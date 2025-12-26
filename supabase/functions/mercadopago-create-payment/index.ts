/**
 * Mercado Pago Create Payment - Edge Function
 * 
 * Versão modularizada - handlers em arquivos separados, 
 * mas lógica de credenciais/split inline para compatibilidade Deno.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { rateLimitMiddleware, getIdentifier } from '../_shared/rate-limit.ts';
import { getGatewayCredentials, validateCredentials } from '../_shared/platform-config.ts';
import { handlePixPayment } from './handlers/pix-handler.ts';
import { handleCardPayment } from './handlers/card-handler.ts';
import { logInfo, logError, logWarn } from './utils/logger.ts';

// ========================================================================
// CONSTANTS
// ========================================================================

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://risecheckout.com",
  "https://www.risecheckout.com",
  "https://risecheckout-84776.lovable.app",
  "https://prime-checkout-hub.lovable.app"
];

const getCorsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
});

const ERROR_CODES = {
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  PRODUCTS_NOT_FOUND: 'PRODUCTS_NOT_FOUND',
  GATEWAY_NOT_CONFIGURED: 'GATEWAY_NOT_CONFIGURED',
  TOKEN_REQUIRED: 'TOKEN_REQUIRED',
  GATEWAY_API_ERROR: 'GATEWAY_API_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// ========================================================================
// RESPONSE HELPERS
// ========================================================================

function createSuccessResponse(data: any, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  });
}

function createErrorResponse(code: string, message: string, status: number, corsHeaders: Record<string, string>, details?: any) {
  const error: any = { success: false, error: message };
  if (details) error.data = { code, details };
  return new Response(JSON.stringify(error), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status
  });
}

// ========================================================================
// CREDENTIAL FETCHING
// ========================================================================

async function fetchCredentials(supabase: any, vendorId: string) {
  let credentialsResult;
  let isOwner = false;
  
  try {
    credentialsResult = await getGatewayCredentials(supabase, vendorId, 'mercadopago');
    isOwner = credentialsResult.isOwner;
  } catch (credError: any) {
    logWarn('Fallback para vendor_integrations', { error: credError.message });
    
    const { data: integration } = await supabase
      .from('vendor_integrations')
      .select('config')
      .eq('vendor_id', vendorId)
      .eq('integration_type', 'MERCADOPAGO')
      .eq('active', true)
      .maybeSingle();

    if (!integration) {
      throw { code: 'GATEWAY_NOT_CONFIGURED', message: 'Mercado Pago não configurado' };
    }
    
    credentialsResult = {
      isOwner: false,
      credentials: {
        accessToken: integration.config?.access_token,
        environment: (integration.config?.is_test ? 'sandbox' : 'production') as 'sandbox' | 'production'
      },
      source: 'vendor_integrations'
    };
  }

  const { credentials, source } = credentialsResult;
  const validation = validateCredentials('mercadopago', credentials);
  if (!validation.valid) {
    throw { code: 'GATEWAY_NOT_CONFIGURED', message: 'Credenciais incompletas' };
  }

  logInfo(`✅ Credenciais via: ${source}`, { isOwner, environment: credentials.environment });
  return { accessToken: credentials.accessToken!, environment: credentials.environment!, isOwner };
}

// ========================================================================
// SPLIT CALCULATION (MODELO CAKTO)
// ========================================================================

async function calculateSplit(supabase: any, order: any, isOwner: boolean, calculatedTotalCents: number, gatewayToken: string, affiliateCollectorId: string | null) {
  let effectiveAccessToken = gatewayToken;
  let applicationFeeCents = 0;

  // CENÁRIO 1: Owner + Afiliado
  if (isOwner && order.affiliate_id && order.commission_cents > 0 && affiliateCollectorId) {
    logInfo('🔄 [SPLIT] SEU produto via Afiliado');
    
    const { data: affIntegration } = await supabase
      .from('vendor_integrations')
      .select('config')
      .eq('vendor_id', order.affiliate.user_id)
      .eq('integration_type', 'MERCADOPAGO')
      .eq('active', true)
      .maybeSingle();
    
    if (affIntegration?.config?.access_token) {
      effectiveAccessToken = affIntegration.config.access_token;
      applicationFeeCents = calculatedTotalCents - order.commission_cents;
      logInfo('💰 [SPLIT] CAKTO via Afiliado', { afiliado_recebe: order.commission_cents, voce_recebe: applicationFeeCents });
    }
  } 
  // CENÁRIO 2: Vendedor
  else if (!isOwner) {
    applicationFeeCents = order.platform_fee_cents || 0;
    logInfo('💰 [SPLIT] Vendedor', { platform_fee: applicationFeeCents });
  } 
  // CENÁRIO 3: Direto
  else {
    logInfo('🏠 [SPLIT] Venda direta - 100% Owner');
  }

  return { effectiveAccessToken, applicationFeeCents };
}

async function fetchAffiliateCollectorId(supabase: any, order: any): Promise<string | null> {
  if (!order.affiliate_id || !order.affiliate) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('mercadopago_collector_id')
    .eq('id', order.affiliate.user_id)
    .maybeSingle();
  
  if (profile?.mercadopago_collector_id) {
    logInfo('✅ Afiliado com MP conectado', { collector_id: profile.mercadopago_collector_id });
    return profile.mercadopago_collector_id;
  }
  
  logWarn('⚠️ Afiliado SEM MP conectado');
  return null;
}

// ========================================================================
// MAIN HANDLER
// ========================================================================

serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    logInfo('Request recebido');

    // 1. RATE LIMITING
    const rateLimitResponse = await rateLimitMiddleware(req, {
      maxAttempts: 10, windowMs: 60000, identifier: getIdentifier(req, false), action: 'create_payment'
    });
    if (rateLimitResponse) return rateLimitResponse;

    // 2. SUPABASE CLIENT
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 3. PARSE REQUEST
    const body = await req.json().catch(() => null);
    if (!body) return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'JSON inválido', 400, corsHeaders);

    const { orderId, payerEmail, payerName, payerDocument, paymentMethod, token, installments, paymentMethodId, issuerId } = body;
    if (!orderId || !payerEmail || !paymentMethod) {
      return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'Campos obrigatórios faltando', 400, corsHeaders);
    }

    logInfo('Processando', { orderId, paymentMethod });

    // 4. FETCH ORDER
    const { data: order } = await supabase
      .from('orders')
      .select(`*, affiliate:affiliates(id, user_id, commission_rate)`)
      .eq('id', orderId)
      .maybeSingle();
    if (!order) return createErrorResponse(ERROR_CODES.ORDER_NOT_FOUND, 'Pedido não encontrado', 404, corsHeaders);

    // 5. FETCH ITEMS & CALCULATE TOTAL
    const { data: items } = await supabase.from('order_items').select('amount_cents, quantity').eq('order_id', orderId);
    if (!items?.length) return createErrorResponse(ERROR_CODES.PRODUCTS_NOT_FOUND, 'Pedido sem itens', 500, corsHeaders);
    const calculatedTotalCents = items.reduce((sum, i) => sum + i.amount_cents * i.quantity, 0);

    // 6. FETCH CREDENTIALS
    let credentials;
    try {
      credentials = await fetchCredentials(supabase, order.vendor_id);
    } catch (e: any) {
      return createErrorResponse(e.code, e.message, 400, corsHeaders);
    }

    // 7. SPLIT CALCULATION
    const affiliateCollectorId = await fetchAffiliateCollectorId(supabase, order);
    const { effectiveAccessToken, applicationFeeCents } = await calculateSplit(
      supabase, order, credentials.isOwner, calculatedTotalCents, credentials.accessToken, affiliateCollectorId
    );

    // 8. PROCESS PAYMENT
    let paymentResult: any;
    try {
      if (paymentMethod === 'pix') {
        paymentResult = await handlePixPayment({
          orderId, calculatedTotalCents, payerEmail, payerName, payerDocument, effectiveAccessToken, applicationFeeCents
        });
      } else if (paymentMethod === 'credit_card') {
        if (!token) return createErrorResponse(ERROR_CODES.TOKEN_REQUIRED, 'Token obrigatório', 400, corsHeaders);
        paymentResult = await handleCardPayment({
          orderId, calculatedTotalCents, payerEmail, payerName, payerDocument, token,
          installments: installments || 1, paymentMethodId, issuerId, effectiveAccessToken, applicationFeeCents
        });
      } else {
        return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'Método inválido', 400, corsHeaders);
      }
    } catch (e: any) {
      return createErrorResponse(e.code || ERROR_CODES.GATEWAY_API_ERROR, e.message, 502, corsHeaders, e.details);
    }

    logInfo('Pagamento criado', { id: paymentResult.transactionId, status: paymentResult.status });

    // 9. UPDATE ORDER
    const updateData: any = {
      gateway: 'MERCADOPAGO',
      gateway_payment_id: paymentResult.transactionId,
      status: paymentResult.status === 'approved' ? 'PAID' : order.status,
      payment_method: paymentMethod.toUpperCase(),
      updated_at: new Date().toISOString()
    };
    if (paymentMethod === 'pix' && paymentResult.qrCodeText) {
      updateData.pix_qr_code = paymentResult.qrCodeText;
      updateData.pix_id = paymentResult.transactionId;
      updateData.pix_status = paymentResult.status;
      updateData.pix_created_at = new Date().toISOString();
    }
    await supabase.from('orders').update(updateData).eq('id', orderId);

    // 10. RESPONSE
    const responseData: any = { paymentId: paymentResult.transactionId, status: paymentResult.status };
    if (paymentMethod === 'pix' && paymentResult.qrCode) {
      responseData.pix = { qrCode: paymentResult.qrCodeText, qrCodeBase64: paymentResult.qrCode };
    }

    return createSuccessResponse(responseData, corsHeaders);

  } catch (error: any) {
    logError('Erro fatal', { message: error.message });
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Erro interno', 500, getCorsHeaders(""));
  }
});
