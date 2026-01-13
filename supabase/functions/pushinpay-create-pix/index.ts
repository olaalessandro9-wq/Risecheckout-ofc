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
 * @version 4.1.0 - RISE Protocol V2 Compliance (Zero any)
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "../_shared/rate-limiter.ts";
import { determineSmartSplit } from "./handlers/smart-split.ts";
import { buildPixPayload, callPushinPayApi, type PushinPayResponse } from "./handlers/pix-builder.ts";
import { updateOrderWithPixData, triggerPixGeneratedWebhook, logManualPaymentIfNeeded } from "./handlers/post-pix.ts";

// Use public CORS for checkout/payment endpoints
const corsHeaders = PUBLIC_CORS_HEADERS;

// === INTERFACES (Zero any) ===

interface CreatePixRequest {
  orderId: string;
  valueInCents: number;
  webhookUrl?: string;
}

interface OrderRecord {
  id: string;
  vendor_id: string;
  amount_cents: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_document: string | null;
  commission_cents: number | null;
  affiliate_id: string | null;
  platform_fee_cents: number | null;
}

interface SecurityEventEntry {
  event_type: string;
  resource: string;
  identifier: string;
  metadata: Record<string, unknown>;
  success: boolean;
}

interface PixResponseData {
  ok: true;
  pix: {
    id: string;
    pix_id: string;
    qr_code: string;
    qr_code_base64: string;
    status: string;
    value: number;
  };
  smartSplit: {
    pixCreatedBy: string;
    adjustedSplit: boolean;
    manualPaymentNeeded: number;
  };
}

// === MAIN HANDLER ===

Deno.serve(withSentry('pushinpay-create-pix', async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const functionName = 'pushinpay-create-pix';
  console.log(`[${functionName}] Iniciando Smart Split v4.0...`);

  try {
    // 1. Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(
      supabase,
      req,
      RATE_LIMIT_CONFIGS.CREATE_PIX
    );
    if (rateLimitResult) {
      console.warn(`[${functionName}] Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    // 2. Parse request
    const body: CreatePixRequest = await req.json();
    const { orderId, valueInCents, webhookUrl } = body;

    console.log(`[${functionName}] orderId=${orderId}, valueInCents=${valueInCents}`);

    // 3. Validações
    if (!orderId) throw new Error('orderId é obrigatório');
    if (!valueInCents || valueInCents <= 0) throw new Error('valueInCents deve ser maior que zero');

    // 4. Buscar pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, vendor_id, amount_cents, customer_name, customer_email, customer_document, commission_cents, affiliate_id, platform_fee_cents')
      .eq('id', orderId)
      .single() as { data: OrderRecord | null; error: Error | null };

    if (orderError || !order) {
      console.error(`[${functionName}] Pedido não encontrado:`, orderError);
      throw new Error(`Pedido ${orderId} não encontrado`);
    }

    console.log(`[${functionName}] Pedido encontrado, vendor_id=${order.vendor_id}, affiliate_id=${order.affiliate_id || 'nenhum'}`);

    // 5. Validação de segurança: valor frontend vs banco
    if (valueInCents !== order.amount_cents) {
      console.error(`[${functionName}] ⛔ ALERTA DE SEGURANÇA: Valor divergente! Frontend=${valueInCents}, Banco=${order.amount_cents}`);
      
      const securityEvent: SecurityEventEntry = {
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
      };
      await supabase.from('security_events').insert(securityEvent);
      
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

    const pixData: PushinPayResponse = await callPushinPayApi({
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
    const responseData: PixResponseData = {
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
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[pushinpay-create-pix] Erro:`, errorMessage);
    
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      functionName: 'pushinpay-create-pix',
      url: req.url,
      method: req.method,
    });
    
    return new Response(JSON.stringify({
      ok: false,
      error: errorMessage
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}));
