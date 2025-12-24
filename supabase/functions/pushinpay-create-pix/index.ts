/**
 * Edge Function: pushinpay-create-pix
 * 
 * Cria uma cobrança PIX via PushinPay seguindo a documentação oficial:
 * https://app.theneo.io/pushinpay/pix/pix/criar-pix
 * 
 * Endpoint correto: POST /api/pix/cashIn
 * Valor: em CENTAVOS (não dividir por 100)
 * 
 * @author RiseCheckout Team
 * @version 2.0.0 - Refatorado conforme documentação oficial
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  calculatePlatformFeeCents, 
  PLATFORM_PUSHINPAY_ACCOUNT_ID, 
  getVendorFeePercent,
  getGatewayCredentials,
  validateCredentials
} from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// URLs corretas conforme documentação oficial
const PUSHINPAY_URLS = {
  sandbox: 'https://api-sandbox.pushinpay.com.br/api/pix/cashIn',
  production: 'https://api.pushinpay.com.br/api/pix/cashIn'
};

interface CreatePixRequest {
  orderId: string;
  valueInCents: number;
  webhookUrl?: string;
}

interface PushinPayResponse {
  id: string;
  status: string;
  value: number;
  qr_code: string;
  qr_code_base64: string;
  pix_key: string;
  external_reference?: string;
  created_at: string;
  expires_at: string;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const functionName = 'pushinpay-create-pix';
  console.log(`[${functionName}] Iniciando...`);

  try {
    // 1. Parse request body
    const body: CreatePixRequest = await req.json();
    const { orderId, valueInCents, webhookUrl } = body;

    console.log(`[${functionName}] orderId=${orderId}, valueInCents=${valueInCents}`);

    // 2. Validações
    if (!orderId) {
      throw new Error('orderId é obrigatório');
    }
    if (!valueInCents || valueInCents <= 0) {
      throw new Error('valueInCents deve ser maior que zero');
    }

    // 3. Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Buscar pedido e dados do vendedor (incluindo afiliado)
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
    console.log(`[${functionName}] MODELO CAKTO - commission_cents=${order.commission_cents || 0} (já sobre valor líquido)`);

    // 4.1 VALIDAÇÃO CRÍTICA: valueInCents do frontend DEVE corresponder ao amount_cents do banco
    // Isso previne manipulação de valores pelo cliente
    if (valueInCents !== order.amount_cents) {
      console.error(`[${functionName}] ⛔ ALERTA DE SEGURANÇA: Valor divergente! Frontend=${valueInCents}, Banco=${order.amount_cents}`);
      
      // Log para auditoria de segurança
      await supabase.from('security_events').insert({
        event_type: 'value_mismatch',
        resource: 'pushinpay-create-pix',
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
    
    console.log(`[${functionName}] ✅ Validação de valor OK: ${valueInCents} centavos confirmado`);

    // 5. Buscar credenciais via getGatewayCredentials (Owner usa secrets globais)
    let credentialsResult;
    try {
      credentialsResult = await getGatewayCredentials(supabase, order.vendor_id, 'pushinpay');
    } catch (credError: any) {
      console.error(`[${functionName}] Erro ao buscar credenciais:`, credError.message);
      throw new Error(`Configurações do PushinPay não encontradas: ${credError.message}`);
    }

    const { isOwner, credentials, source } = credentialsResult;
    
    // Validar credenciais
    const validation = validateCredentials('pushinpay', credentials);
    if (!validation.valid) {
      throw new Error(`Token do PushinPay não configurado. Campos faltantes: ${validation.missingFields.join(', ')}`);
    }

    const token = credentials.token!;
    const environment = credentials.environment || 'production';
    const apiUrl = environment === 'sandbox' 
      ? PUSHINPAY_URLS.sandbox 
      : PUSHINPAY_URLS.production;

    console.log(`[${functionName}] Credenciais obtidas via: ${source}, Ambiente: ${environment}, URL: ${apiUrl}`);
    
    if (isOwner) {
      console.log(`[${functionName}] 🏠 OWNER detectado (via secrets globais) - Split simplificado`);
    }

    // 7. Montar payload conforme documentação oficial (MODELO CAKTO)
    // IMPORTANTE: value deve estar em CENTAVOS!
    const platformAccountId = PLATFORM_PUSHINPAY_ACCOUNT_ID || Deno.env.get('PUSHINPAY_PLATFORM_ACCOUNT_ID');
    
    const pushinPayload: Record<string, unknown> = {
      value: valueInCents, // JÁ em centavos, NÃO dividir por 100!
      webhook_url: webhookUrl || `${supabaseUrl}/functions/v1/pushinpay-webhook`
    };
    
    // Montar split_rules (MODELO CAKTO)
    const splitRules: Array<{value: number, account_id: string}> = [];
    
    // A. Taxa da plataforma (4%) - APENAS SE NÃO FOR OWNER
    if (!isOwner) {
      const vendorFeePercent = await getVendorFeePercent(supabase, order.vendor_id);
      const platformFeeCents = order.platform_fee_cents || calculatePlatformFeeCents(valueInCents, vendorFeePercent);
      
      if (platformAccountId && platformFeeCents > 0) {
        splitRules.push({
          value: platformFeeCents,
          account_id: platformAccountId
        });
        console.log(`[${functionName}] MODELO CAKTO - Split plataforma: ${platformFeeCents} centavos para ${platformAccountId}`);
      }
    } else {
      console.log(`[${functionName}] 🏠 OWNER - Skip split plataforma`);
    }
    
    // B. Comissão do afiliado (MODELO CAKTO - múltiplos splits suportados)
    // PushinPay suporta array de split_rules, então podemos adicionar o afiliado
    if (order.affiliate_id && order.commission_cents && order.commission_cents > 0) {
      // Buscar account_id do afiliado na PushinPay
      // NOTA: Para afiliado, precisamos buscar o user_id primeiro
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('user_id')
        .eq('id', order.affiliate_id)
        .single();
      
      if (affiliate?.user_id) {
        const { data: affiliateSettings } = await supabase
          .from('payment_gateway_settings')
          .select('pushinpay_account_id')
          .eq('user_id', affiliate.user_id)
          .single();
          
        if (affiliateSettings?.pushinpay_account_id) {
          splitRules.push({
            value: order.commission_cents,
            account_id: affiliateSettings.pushinpay_account_id
          });
          console.log(`[${functionName}] MODELO CAKTO - Split afiliado: ${order.commission_cents} centavos para ${affiliateSettings.pushinpay_account_id}`);
        } else {
          console.warn(`[${functionName}] ⚠️ Afiliado ${order.affiliate_id} sem pushinpay_account_id, comissão será paga manualmente`);
        }
      }
    }
    
    if (splitRules.length > 0) {
      pushinPayload.split_rules = splitRules;
      console.log(`[${functionName}] 💰 Split configurado: ${splitRules.length} destinatário(s)`, { isOwner });
    } else if (isOwner) {
      console.log(`[${functionName}] 🏠 OWNER sem afiliado - 100% fica com Owner, nenhum split`);
    } else {
      console.warn(`[${functionName}] ATENÇÃO: Split não configurado! PLATFORM_ACCOUNT_ID=${platformAccountId || 'não definido'}`);
    }

    console.log(`[${functionName}] Payload para PushinPay:`, JSON.stringify(pushinPayload));

    // 7. Chamar API do PushinPay
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(pushinPayload)
    });

    const responseText = await response.text();
    console.log(`[${functionName}] Status: ${response.status}, Response: ${responseText}`);

    if (!response.ok) {
      console.error(`[${functionName}] Erro na API PushinPay:`, responseText);
      
      // Log detalhado para debugging
      await supabase.from('edge_function_errors').insert({
        function_name: functionName,
        order_id: orderId,
        error_message: `PushinPay retornou ${response.status}`,
        request_payload: pushinPayload,
        error_stack: responseText
      });

      throw new Error(`PushinPay retornou erro: ${response.status} - ${responseText}`);
    }

    const pixData: PushinPayResponse = JSON.parse(responseText);
    console.log(`[${functionName}] PIX criado com sucesso, id=${pixData.id}`);

    // 8. Salvar pix_id no pedido
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        pix_id: pixData.id,
        pix_qr_code: pixData.qr_code,
        pix_status: pixData.status || 'pending',
        pix_created_at: new Date().toISOString(),
        gateway: 'pushinpay'
      })
      .eq('id', orderId);

    if (updateError) {
      console.error(`[${functionName}] Erro ao atualizar pedido:`, updateError);
      // Não falhar aqui, PIX já foi criado
    }

    // 9. Retornar dados do PIX (FORMATO COMPATÍVEL COM FRONTEND)
    // Frontend espera { ok: true, pix: { ... } }
    return new Response(JSON.stringify({
      ok: true,
      pix: {
        id: pixData.id,
        pix_id: pixData.id,
        qr_code: pixData.qr_code,
        qr_code_base64: pixData.qr_code_base64,
        status: pixData.status,
        value: valueInCents
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error(`[${functionName}] Erro:`, error.message);
    
    return new Response(JSON.stringify({
      ok: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
