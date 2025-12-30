/**
 * Edge Function: pushinpay-create-pix
 * 
 * Cria uma cobrança PIX via PushinPay seguindo a documentação oficial:
 * https://app.theneo.io/pushinpay/pix/pix/criar-pix
 * 
 * Endpoint correto: POST /api/pix/cashIn
 * Valor: em CENTAVOS (não dividir por 100)
 * 
 * SMART SPLIT v2.0:
 * - Se afiliado tem maior parte E tem credenciais PushinPay → PIX criado pelo afiliado
 * - Senão → PIX criado pelo produtor (comportamento padrão)
 * - Limite de 50% respeitado em todos os cenários
 * 
 * @author RiseCheckout Team
 * @version 3.0.0 - Smart Split com token dinâmico
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  calculatePlatformFeeCents, 
  PLATFORM_PUSHINPAY_ACCOUNT_ID, 
  getVendorFeePercent,
  getGatewayCredentials,
  validateCredentials,
  PLATFORM_FEE_PERCENT
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

// Limite máximo de split da PushinPay (50%)
const PUSHINPAY_MAX_SPLIT_PERCENT = 0.50;

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

interface SmartSplitDecision {
  pixCreatorToken: string;
  pixCreatorAccountId: string;
  pixCreatorEnvironment: 'sandbox' | 'production';
  pixCreatedBy: 'producer' | 'affiliate';
  splitRules: Array<{value: number, account_id: string}>;
  adjustedSplit: boolean;
  manualPaymentNeeded: number; // Centavos que precisam ser pagos manualmente
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const functionName = 'pushinpay-create-pix';
  console.log(`[${functionName}] Iniciando Smart Split v3.0...`);

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

    // 4.1 VALIDAÇÃO CRÍTICA: valueInCents do frontend DEVE corresponder ao amount_cents do banco
    if (valueInCents !== order.amount_cents) {
      console.error(`[${functionName}] ⛔ ALERTA DE SEGURANÇA: Valor divergente! Frontend=${valueInCents}, Banco=${order.amount_cents}`);
      
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
    
    console.log(`[${functionName}] ✅ Validação de valor OK: ${valueInCents} centavos`);

    // 5. SMART SPLIT: Determinar quem cria o PIX
    const smartSplit = await determineSmartSplit(
      supabase, 
      order, 
      valueInCents, 
      functionName
    );

    console.log(`[${functionName}] 🎯 SMART SPLIT: PIX criado por ${smartSplit.pixCreatedBy.toUpperCase()}`);
    console.log(`[${functionName}] 🎯 Split rules: ${smartSplit.splitRules.length} destinatário(s)`);
    if (smartSplit.adjustedSplit) {
      console.warn(`[${functionName}] ⚠️ Split ajustado - ${smartSplit.manualPaymentNeeded} centavos precisam pagamento manual`);
    }

    // 6. Montar payload
    const environment = smartSplit.pixCreatorEnvironment;
    const apiUrl = environment === 'sandbox' 
      ? PUSHINPAY_URLS.sandbox 
      : PUSHINPAY_URLS.production;

    const pushinPayload: Record<string, unknown> = {
      value: valueInCents,
      webhook_url: webhookUrl || `${supabaseUrl}/functions/v1/pushinpay-webhook`
    };
    
    if (smartSplit.splitRules.length > 0) {
      pushinPayload.split_rules = smartSplit.splitRules;
    }

    console.log(`[${functionName}] Payload para PushinPay:`, JSON.stringify(pushinPayload));

    // 7. Chamar API do PushinPay
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${smartSplit.pixCreatorToken}`
      },
      body: JSON.stringify(pushinPayload)
    });

    const responseText = await response.text();
    console.log(`[${functionName}] Status: ${response.status}, Response: ${responseText}`);

    if (!response.ok) {
      console.error(`[${functionName}] Erro na API PushinPay:`, responseText);
      
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

    // 8. Salvar pix_id no pedido + metadata do smart split
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
    }

    // 9. Disparar evento pix_generated para webhooks do vendedor
    const internalSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');
    if (internalSecret) {
      try {
        console.log(`[${functionName}] Disparando evento pix_generated para order ${orderId}`);
        
        const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/trigger-webhooks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': internalSecret,
          },
          body: JSON.stringify({
            order_id: orderId,
            event_type: 'pix_generated',
          }),
        });
        
        if (webhookResponse.ok) {
          console.log(`[${functionName}] Evento pix_generated disparado com sucesso`);
        } else {
          const errorText = await webhookResponse.text();
          console.warn(`[${functionName}] Erro ao disparar pix_generated:`, errorText);
        }
      } catch (webhookError) {
        console.warn(`[${functionName}] Excecao ao disparar pix_generated (nao critico):`, webhookError);
      }
    } else {
      console.warn(`[${functionName}] INTERNAL_WEBHOOK_SECRET nao configurado - pix_generated nao sera disparado`);
    }

    // 10. Se houver ajuste de split, logar para pagamento manual
    if (smartSplit.adjustedSplit && smartSplit.manualPaymentNeeded > 0) {
      await supabase.from('edge_function_errors').insert({
        function_name: `${functionName}-manual-payment`,
        order_id: orderId,
        error_message: `PAGAMENTO MANUAL NECESSÁRIO: ${smartSplit.manualPaymentNeeded} centavos`,
        request_payload: {
          pixCreatedBy: smartSplit.pixCreatedBy,
          manualPaymentNeeded: smartSplit.manualPaymentNeeded,
          originalSplitRules: smartSplit.splitRules
        },
        notes: 'Split excedeu 50%, diferença precisa ser paga manualmente'
      });
    }

    // 11. Retornar dados do PIX
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

/**
 * SMART SPLIT: Determina quem cria o PIX e como montar os split_rules
 * 
 * REGRA: PIX é criado por quem tem a MAIOR parte do valor
 * - Se afiliado tem maior parte E tem credenciais → afiliado cria PIX
 * - Senão → produtor cria PIX
 * 
 * Isso garante que o split nunca exceda 50% (limite PushinPay)
 */
async function determineSmartSplit(
  supabase: { from: (table: string) => any },
  order: {
    vendor_id: string;
    affiliate_id: string | null;
    commission_cents: number | null;
    platform_fee_cents: number | null;
  },
  valueInCents: number,
  logPrefix: string
): Promise<SmartSplitDecision> {
  
  // 1. Calcular taxas
  const vendorFeePercent = await getVendorFeePercent(supabase, order.vendor_id);
  const platformFeeCents = order.platform_fee_cents || calculatePlatformFeeCents(valueInCents, vendorFeePercent);
  const affiliateCommissionCents = order.commission_cents || 0;
  
  // Valor líquido do produtor = Total - Taxa Plataforma - Comissão Afiliado
  const vendorNetCents = valueInCents - platformFeeCents - affiliateCommissionCents;
  
  console.log(`[${logPrefix}] 📊 Distribuição: Produtor=${vendorNetCents}c, Afiliado=${affiliateCommissionCents}c, Plataforma=${platformFeeCents}c`);
  
  // 2. Buscar credenciais do produtor (sempre precisamos)
  let producerCredentials;
  try {
    producerCredentials = await getGatewayCredentials(supabase, order.vendor_id, 'pushinpay');
  } catch (err: any) {
    throw new Error(`Credenciais PushinPay do produtor não configuradas: ${err.message}`);
  }
  
  const validation = validateCredentials('pushinpay', producerCredentials.credentials);
  if (!validation.valid) {
    throw new Error(`Token PushinPay do produtor não configurado`);
  }
  
  const producerToken = producerCredentials.credentials.token!;
  const producerAccountId = producerCredentials.credentials.accountId || '';
  const producerEnvironment = producerCredentials.credentials.environment || 'production';
  const isProducerOwner = producerCredentials.isOwner;
  
  // 3. Verificar se tem afiliado com maior parte
  const affiliateHasLargerShare = order.affiliate_id && affiliateCommissionCents > vendorNetCents;
  
  console.log(`[${logPrefix}] Afiliado tem maior parte? ${affiliateHasLargerShare ? 'SIM' : 'NÃO'}`);
  
  // 4. Se afiliado tem maior parte, tentar usar credenciais dele
  if (affiliateHasLargerShare && order.affiliate_id) {
    console.log(`[${logPrefix}] 🔄 Tentando usar token do AFILIADO...`);
    
    // Buscar user_id do afiliado
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('user_id')
      .eq('id', order.affiliate_id)
      .single();
    
    if (affiliate?.user_id) {
      // Buscar credenciais PushinPay do afiliado - usando token_encrypted (seguro)
      const { data: affiliateSettings } = await supabase
        .from('payment_gateway_settings')
        .select('token_encrypted, pushinpay_account_id, environment')
        .eq('user_id', affiliate.user_id)
        .single();
      
      if (affiliateSettings?.token_encrypted && affiliateSettings?.pushinpay_account_id) {
        console.log(`[${logPrefix}] ✅ Afiliado tem credenciais PushinPay - criando PIX pelo AFILIADO`);
        
        // PIX criado pelo afiliado, split para produtor + plataforma
        const splitRules: Array<{value: number, account_id: string}> = [];
        
        // A. Valor líquido do produtor
        if (vendorNetCents > 0 && producerAccountId) {
          splitRules.push({
            value: vendorNetCents,
            account_id: producerAccountId
          });
          console.log(`[${logPrefix}] Split para produtor: ${vendorNetCents}c → ${producerAccountId}`);
        }
        
        // B. Taxa da plataforma (se não for owner)
        const platformAccountId = PLATFORM_PUSHINPAY_ACCOUNT_ID || Deno.env.get('PUSHINPAY_PLATFORM_ACCOUNT_ID');
        if (!isProducerOwner && platformFeeCents > 0 && platformAccountId) {
          splitRules.push({
            value: platformFeeCents,
            account_id: platformAccountId
          });
          console.log(`[${logPrefix}] Split para plataforma: ${platformFeeCents}c → ${platformAccountId}`);
        }
        
        // Validar limite de 50%
        const totalSplitCents = splitRules.reduce((acc, r) => acc + r.value, 0);
        const maxSplitCents = Math.floor(valueInCents * PUSHINPAY_MAX_SPLIT_PERCENT);
        
        if (totalSplitCents <= maxSplitCents) {
          return {
            pixCreatorToken: affiliateSettings.token_encrypted,
            pixCreatorAccountId: affiliateSettings.pushinpay_account_id,
            pixCreatorEnvironment: (affiliateSettings.environment as 'sandbox' | 'production') || 'production',
            pixCreatedBy: 'affiliate',
            splitRules,
            adjustedSplit: false,
            manualPaymentNeeded: 0
          };
        } else {
          console.warn(`[${logPrefix}] ⚠️ Split ${totalSplitCents}c excede limite ${maxSplitCents}c mesmo com afiliado criando PIX`);
          // Fallback para produtor com ajuste
        }
      } else {
        console.warn(`[${logPrefix}] ⚠️ Afiliado sem credenciais PushinPay - fallback para produtor`);
      }
    }
  }
  
  // 5. PADRÃO: Produtor cria PIX, split para afiliado + plataforma
  console.log(`[${logPrefix}] 📌 Produtor criará o PIX`);
  
  const splitRules: Array<{value: number, account_id: string}> = [];
  const platformAccountId = PLATFORM_PUSHINPAY_ACCOUNT_ID || Deno.env.get('PUSHINPAY_PLATFORM_ACCOUNT_ID');
  
  // A. Taxa da plataforma (se não for owner)
  if (!isProducerOwner && platformFeeCents > 0 && platformAccountId) {
    splitRules.push({
      value: platformFeeCents,
      account_id: platformAccountId
    });
    console.log(`[${logPrefix}] Split plataforma: ${platformFeeCents}c → ${platformAccountId}`);
  }
  
  // B. Comissão do afiliado
  if (order.affiliate_id && affiliateCommissionCents > 0) {
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
          value: affiliateCommissionCents,
          account_id: affiliateSettings.pushinpay_account_id
        });
        console.log(`[${logPrefix}] Split afiliado: ${affiliateCommissionCents}c → ${affiliateSettings.pushinpay_account_id}`);
      } else {
        console.warn(`[${logPrefix}] ⚠️ Afiliado sem pushinpay_account_id, comissão manual`);
      }
    }
  }
  
  // 6. Validar e ajustar limite de 50%
  const totalSplitCents = splitRules.reduce((acc, r) => acc + r.value, 0);
  const maxSplitCents = Math.floor(valueInCents * PUSHINPAY_MAX_SPLIT_PERCENT);
  
  let adjustedSplit = false;
  let manualPaymentNeeded = 0;
  
  if (totalSplitCents > maxSplitCents) {
    console.warn(`[${logPrefix}] ⚠️ Split ${totalSplitCents}c excede limite ${maxSplitCents}c - AJUSTANDO PROPORCIONALMENTE`);
    
    adjustedSplit = true;
    manualPaymentNeeded = totalSplitCents - maxSplitCents;
    
    // Ajuste proporcional: reduzir cada split proporcionalmente
    const reductionRatio = maxSplitCents / totalSplitCents;
    
    for (const rule of splitRules) {
      const originalValue = rule.value;
      rule.value = Math.floor(rule.value * reductionRatio);
      console.log(`[${logPrefix}] Ajustado: ${originalValue}c → ${rule.value}c`);
    }
    
    console.log(`[${logPrefix}] ⚠️ PAGAMENTO MANUAL NECESSÁRIO: ${manualPaymentNeeded}c`);
  }
  
  return {
    pixCreatorToken: producerToken,
    pixCreatorAccountId: producerAccountId,
    pixCreatorEnvironment: producerEnvironment,
    pixCreatedBy: 'producer',
    splitRules,
    adjustedSplit,
    manualPaymentNeeded
  };
}
