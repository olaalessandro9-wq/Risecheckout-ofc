/**
 * Edge Function: pushinpay-create-pix
 * 
 * Cria uma cobrança PIX via PushinPay seguindo a documentação oficial:
 * https://app.theneo.io/pushinpay/pix/pix/criar-pix
 * 
 * SMART SPLIT v2.0:
 * - Se afiliado tem maior parte E tem credenciais PushinPay → PIX criado pelo afiliado
 * - Senão → PIX criado pelo produtor (comportamento padrão)
 * - Limite de 50% respeitado em todos os cenários
 * 
 * @author RiseCheckout Team
 * @version 4.0.0 - Modular handlers
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { determineSmartSplit } from "./handlers/smart-split.ts";
import { buildPixPayload, callPushinPayApi, type PushinPayResponse } from "./handlers/pix-builder.ts";
import { updateOrderWithPixData, triggerPixGeneratedWebhook, logManualPaymentIfNeeded } from "./handlers/post-pix.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePixRequest {
  orderId: string;
  valueInCents: number;
  webhookUrl?: string;
}

Deno.serve(withSentry('pushinpay-create-pix', async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const functionName = 'pushinpay-create-pix';
  console.log(`[${functionName}] Iniciando Smart Split v4.0...`);

  try {
    // 1. Parse request
    const body: CreatePixRequest = await req.json();
    const { orderId, valueInCents, webhookUrl } = body;

    console.log(`[${functionName}] orderId=${orderId}, valueInCents=${valueInCents}`);

    // 2. Validações
    if (!orderId) throw new Error('orderId é obrigatório');
    if (!valueInCents || valueInCents <= 0) throw new Error('valueInCents deve ser maior que zero');

    // 3. Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Buscar pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, vendor_id, amount_cents, customer_name, customer_email, customer_document, commission_cents, affiliate_id, platform_fee_cents')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error(`[${functionName}] Pedido não encontrado:`, orderError);
      throw new Error(`Pedido ${orderId} não encontrado`);
    }

    console.log(`[${functionName}] Pedido encontrado, vendor_id=${order.vendor_id}, affiliate_id=${order.affiliate_id || 'nenhum'}`);

    // 5. Validação de segurança: valor frontend vs banco
    if (valueInCents !== order.amount_cents) {
      console.error(`[${functionName}] ⛔ ALERTA DE SEGURANÇA: Valor divergente! Frontend=${valueInCents}, Banco=${order.amount_cents}`);
      
      await supabase.from('security_events').insert({
        event_type: 'value_mismatch',
        resource: functionName,
        identifier: orderId,
        metadata: {
          frontend_value: valueInCents,
          database_value: order.amount_cents,
          vendor_id: order.vendor_id,
          difference_cents: Math.abs(valueInCents - order.amount_cents)
        },
        success: false
      });
      
      throw new Error(`Valor inválido: esperado ${order.amount_cents} centavos, recebido ${valueInCents}. Possível tentativa de manipulação.`);
    }
    
    console.log(`[${functionName}] ✅ Validação de valor OK: ${valueInCents} centavos`);

    // 6. SMART SPLIT: Determinar quem cria o PIX
    const smartSplit = await determineSmartSplit(supabase, order, valueInCents, functionName);

    console.log(`[${functionName}] 🎯 SMART SPLIT: PIX criado por ${smartSplit.pixCreatedBy.toUpperCase()}`);
    console.log(`[${functionName}] 🎯 Split rules: ${smartSplit.splitRules.length} destinatário(s)`);
    if (smartSplit.adjustedSplit) {
      console.warn(`[${functionName}] ⚠️ Split ajustado - ${smartSplit.manualPaymentNeeded} centavos precisam pagamento manual`);
    }

    // 7. Montar payload e chamar API
    const payload = buildPixPayload({
      valueInCents,
      webhookUrl,
      supabaseUrl,
      splitRules: smartSplit.splitRules
    });

    const pixData = await callPushinPayApi({
      environment: smartSplit.pixCreatorEnvironment,
      token: smartSplit.pixCreatorToken,
      payload,
      orderId,
      supabase,
      logPrefix: functionName
    });

    // 8. Atualizar pedido
    await updateOrderWithPixData({ supabase, orderId, pixData, logPrefix: functionName });

    // 9. Disparar webhook
    await triggerPixGeneratedWebhook({ supabaseUrl, orderId, logPrefix: functionName });

    // 10. Logar pagamento manual se necessário
    await logManualPaymentIfNeeded({ supabase, orderId, smartSplit, logPrefix: functionName });

    // 11. Retornar resposta
    return new Response(JSON.stringify({
      ok: true,
      pix: {
        id: pixData.id,
        pix_id: pixData.id,
        qr_code: pixData.qr_code,
        qr_code_base64: pixData.qr_code_base64,
        status: pixData.status,
        value: valueInCents
      },
      smartSplit: {
        pixCreatedBy: smartSplit.pixCreatedBy,
        adjustedSplit: smartSplit.adjustedSplit,
        manualPaymentNeeded: smartSplit.manualPaymentNeeded
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error(`[pushinpay-create-pix] Erro:`, error.message);
    
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      functionName: 'pushinpay-create-pix',
      url: req.url,
      method: req.method,
    });
    
    return new Response(JSON.stringify({
      ok: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}));
