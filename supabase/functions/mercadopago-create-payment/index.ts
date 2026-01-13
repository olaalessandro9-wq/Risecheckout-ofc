/**
 * Mercado Pago Create Payment - Edge Function
 * 
 * Versão modularizada - handlers em arquivos separados, 
 * mas lógica de credenciais/split inline para compatibilidade Deno.
 * 
 * @version 2.0.0 - RISE Protocol V2 Compliance (Zero any)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { rateLimitMiddleware, getIdentifier } from '../_shared/rate-limit.ts';
import { getGatewayCredentials, validateCredentials } from '../_shared/platform-config.ts';
import { handlePixPayment, PixPaymentResult } from './handlers/pix-handler.ts';
import { handleCardPayment, CardPaymentResult } from './handlers/card-handler.ts';
import { logInfo, logError, logWarn } from './utils/logger.ts';
import { sendOrderConfirmationEmails, type OrderData } from '../_shared/send-order-emails.ts';

// === INTERFACES (Zero any) ===

interface OrderRecord {
  id: string;
  vendor_id: string;
  customer_name: string | null;
  customer_email: string | null;
  product_id: string | null;
  product_name: string | null;
  status: string | null;
  affiliate_id: string | null;
  commission_cents: number;
  platform_fee_cents: number | null;
  affiliate?: {
    id: string;
    user_id: string;
    commission_rate: number | null;
  } | null;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  amount_cents: number;
  quantity: number;
}

interface CredentialsResult {
  accessToken: string;
  environment: 'production' | 'sandbox';
  isOwner: boolean;
}

interface SplitResult {
  effectiveAccessToken: string;
  applicationFeeCents: number;
}

interface VaultCredentials {
  access_token?: string;
}

interface ProfileRecord {
  mercadopago_collector_id: string | null;
}

interface RequestBody {
  orderId?: string;
  payerEmail?: string;
  payerName?: string;
  payerDocument?: string;
  paymentMethod?: string;
  token?: string;
  installments?: number;
  paymentMethodId?: string;
  issuerId?: string;
}

interface SuccessResponseData {
  paymentId: string;
  status: string;
  pix?: {
    qrCode: string;
    qrCodeBase64: string;
  };
}

interface OrderUpdateData {
  gateway: string;
  gateway_payment_id: string;
  status: string;
  payment_method: string;
  updated_at: string;
  paid_at?: string;
  pix_qr_code?: string;
  pix_id?: string;
  pix_status?: string;
  pix_created_at?: string;
}

interface GatewayError {
  code: string;
  message: string;
  details?: unknown;
}

// === CONSTANTS ===

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://risecheckout.com",
  "https://www.risecheckout.com",
  "https://risecheckout-84776.lovable.app",
  "https://prime-checkout-hub.lovable.app"
];

const getCorsHeaders = (origin: string): Record<string, string> => ({
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

// === HELPER FUNCTIONS ===

function createSuccessResponse(data: SuccessResponseData, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
}

function createErrorResponse(code: string, message: string, status: number, corsHeaders: Record<string, string>, details?: unknown): Response {
  const error: { success: false; error: string; data?: { code: string; details: unknown } } = { success: false, error: message };
  if (details) error.data = { code, details };
  return new Response(JSON.stringify(error), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status });
}

async function fetchCredentials(supabase: SupabaseClient, vendorId: string): Promise<CredentialsResult> {
  let credentialsResult: { isOwner: boolean; credentials: { accessToken?: string; environment?: 'production' | 'sandbox' }; source?: string };
  let isOwner = false;
  
  try {
    credentialsResult = await getGatewayCredentials(supabase, vendorId, 'mercadopago');
    isOwner = credentialsResult.isOwner;
  } catch (credError: unknown) {
    const errorMessage = credError instanceof Error ? credError.message : String(credError);
    logWarn('getGatewayCredentials falhou, tentando Vault...', { error: errorMessage, vendorId });
    
    try {
      const { getVendorCredentials } = await import('../_shared/vault-credentials.ts');
      const { credentials: vaultCreds, source } = await getVendorCredentials(supabase, vendorId, 'MERCADOPAGO') as { credentials: VaultCredentials | null; source: string };
      if (!vaultCreds || !vaultCreds.access_token) {
        const gatewayError: GatewayError = { code: 'GATEWAY_NOT_CONFIGURED', message: 'Mercado Pago não configurado' };
        throw gatewayError;
      }
      credentialsResult = { isOwner: false, credentials: { accessToken: vaultCreds.access_token, environment: 'production' as const }, source };
    } catch (vaultError: unknown) {
      const gatewayError: GatewayError = { code: 'GATEWAY_NOT_CONFIGURED', message: 'Mercado Pago não configurado' };
      throw gatewayError;
    }
  }
  
  const { credentials } = credentialsResult;
  if (!credentials.accessToken || !credentials.environment) {
    const gatewayError: GatewayError = { code: 'GATEWAY_NOT_CONFIGURED', message: 'Credenciais incompletas' };
    throw gatewayError;
  }
  const validation = validateCredentials('mercadopago', credentials as { accessToken: string; environment: 'production' | 'sandbox' });
  if (!validation.valid) {
    const gatewayError: GatewayError = { code: 'GATEWAY_NOT_CONFIGURED', message: 'Credenciais incompletas' };
    throw gatewayError;
  }
  
  return { accessToken: credentials.accessToken, environment: credentials.environment, isOwner };
}

async function calculateSplit(
  supabase: SupabaseClient, 
  order: OrderRecord, 
  isOwner: boolean, 
  calculatedTotalCents: number, 
  gatewayToken: string, 
  affiliateCollectorId: string | null
): Promise<SplitResult> {
  let effectiveAccessToken = gatewayToken;
  let applicationFeeCents = 0;
  
  if (isOwner && order.affiliate_id && order.commission_cents > 0 && affiliateCollectorId) {
    try {
      const { getVendorCredentials } = await import('../_shared/vault-credentials.ts');
      const { credentials: affCreds } = await getVendorCredentials(supabase, order.affiliate!.user_id, 'MERCADOPAGO') as { credentials: VaultCredentials | null };
      if (affCreds?.access_token) {
        effectiveAccessToken = affCreds.access_token;
        applicationFeeCents = calculatedTotalCents - order.commission_cents;
      }
    } catch {
      // Silently continue with original token
    }
  } else if (!isOwner) {
    applicationFeeCents = order.platform_fee_cents || 0;
  }
  
  return { effectiveAccessToken, applicationFeeCents };
}

async function fetchAffiliateCollectorId(supabase: SupabaseClient, order: OrderRecord): Promise<string | null> {
  if (!order.affiliate_id || !order.affiliate) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('mercadopago_collector_id')
    .eq('id', order.affiliate.user_id)
    .maybeSingle() as { data: ProfileRecord | null };
  return profile?.mercadopago_collector_id || null;
}

// === MAIN HANDLER ===

serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const rateLimitResponse = await rateLimitMiddleware(req, { maxAttempts: 10, windowMs: 60000, identifier: getIdentifier(req, false), action: 'create_payment' });
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { autoRefreshToken: false, persistSession: false } });
    const body: RequestBody | null = await req.json().catch(() => null);
    if (!body) return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'JSON inválido', 400, corsHeaders);

    const { orderId, payerEmail, payerName, payerDocument, paymentMethod, token, installments, paymentMethodId, issuerId } = body;
    if (!orderId || !payerEmail || !paymentMethod) return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'Campos obrigatórios faltando', 400, corsHeaders);

    const { data: order } = await supabase
      .from('orders')
      .select(`*, affiliate:affiliates(id, user_id, commission_rate)`)
      .eq('id', orderId)
      .maybeSingle() as { data: OrderRecord | null };
    if (!order) return createErrorResponse(ERROR_CODES.ORDER_NOT_FOUND, 'Pedido não encontrado', 404, corsHeaders);

    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, product_name, amount_cents, quantity')
      .eq('order_id', orderId) as { data: OrderItem[] | null };
    if (!items?.length) return createErrorResponse(ERROR_CODES.PRODUCTS_NOT_FOUND, 'Pedido sem itens', 500, corsHeaders);
    
    const calculatedTotalCents = items.reduce((sum, i) => sum + i.amount_cents * i.quantity, 0);

    let credentials: CredentialsResult;
    try {
      credentials = await fetchCredentials(supabase, order.vendor_id);
    } catch (e: unknown) {
      const gatewayError = e as GatewayError;
      return createErrorResponse(gatewayError.code, gatewayError.message, 400, corsHeaders);
    }

    const affiliateCollectorId = await fetchAffiliateCollectorId(supabase, order);
    const { effectiveAccessToken, applicationFeeCents } = await calculateSplit(supabase, order, credentials.isOwner, calculatedTotalCents, credentials.accessToken, affiliateCollectorId);

    const firstItem = items[0];
    let paymentResult: PixPaymentResult | CardPaymentResult;
    
    try {
      if (paymentMethod === 'pix') {
        paymentResult = await handlePixPayment({ 
          orderId, 
          calculatedTotalCents, 
          payerEmail, 
          payerName, 
          payerDocument, 
          effectiveAccessToken, 
          applicationFeeCents, 
          productId: firstItem.product_id, 
          productName: firstItem.product_name, 
          items 
        });
      } else if (paymentMethod === 'credit_card') {
        if (!token) return createErrorResponse(ERROR_CODES.TOKEN_REQUIRED, 'Token obrigatório', 400, corsHeaders);
        paymentResult = await handleCardPayment({ 
          orderId, 
          calculatedTotalCents, 
          payerEmail, 
          payerName, 
          payerDocument, 
          token, 
          installments: installments || 1, 
          paymentMethodId: paymentMethodId || '', 
          issuerId, 
          effectiveAccessToken, 
          applicationFeeCents, 
          productId: firstItem.product_id, 
          productName: firstItem.product_name, 
          items 
        });
      } else {
        return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'Método inválido', 400, corsHeaders);
      }
    } catch (e: unknown) {
      const gatewayError = e as GatewayError;
      return createErrorResponse(gatewayError.code || ERROR_CODES.GATEWAY_API_ERROR, gatewayError.message, 502, corsHeaders, gatewayError.details);
    }

    const updateData: OrderUpdateData = { 
      gateway: 'mercadopago', 
      gateway_payment_id: paymentResult.transactionId, 
      status: paymentResult.status === 'approved' ? 'paid' : (order.status?.toLowerCase() || 'pending'), 
      payment_method: paymentMethod.toLowerCase(), 
      updated_at: new Date().toISOString() 
    };
    if (paymentResult.status === 'approved') updateData.paid_at = new Date().toISOString();
    
    // Handle PIX-specific fields
    if (paymentMethod === 'pix' && 'qrCodeText' in paymentResult && paymentResult.qrCodeText) {
      updateData.pix_qr_code = paymentResult.qrCodeText;
      updateData.pix_id = paymentResult.transactionId;
      updateData.pix_status = paymentResult.status;
      updateData.pix_created_at = new Date().toISOString();
    }
    
    await supabase.from('orders').update(updateData).eq('id', orderId);

    if (paymentResult.status === 'approved' && order.customer_email) {
      const orderData: OrderData = { 
        id: orderId, 
        customer_name: order.customer_name || '', 
        customer_email: order.customer_email, 
        amount_cents: calculatedTotalCents, 
        product_id: order.product_id || '', 
        product_name: order.product_name || '' 
      };
      try { await sendOrderConfirmationEmails(supabase, orderData, 'Cartão de Crédito / Mercado Pago'); } catch { /* silent */ }
      try { 
        await supabase.from('order_events').insert({ 
          order_id: orderId, 
          vendor_id: order.vendor_id, 
          type: 'purchase_approved', 
          occurred_at: new Date().toISOString(), 
          data: { gateway: 'MERCADOPAGO', payment_id: paymentResult.transactionId, payment_method: 'CREDIT_CARD', source: 'instant_approval' } 
        }); 
      } catch { /* silent */ }
      try { 
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/trigger-webhooks`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': Deno.env.get('INTERNAL_WEBHOOK_SECRET') || '' }, 
          body: JSON.stringify({ order_id: orderId, event_type: 'purchase_approved' }) 
        }); 
      } catch { /* silent */ }
    }

    const responseData: SuccessResponseData = { paymentId: paymentResult.transactionId, status: paymentResult.status };
    if (paymentMethod === 'pix' && 'qrCode' in paymentResult && paymentResult.qrCode) {
      responseData.pix = { qrCode: paymentResult.qrCodeText || '', qrCodeBase64: paymentResult.qrCode };
    }
    
    return createSuccessResponse(responseData, corsHeaders);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Erro fatal', { message: errorMessage });
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Erro interno', 500, getCorsHeaders(""));
  }
});
