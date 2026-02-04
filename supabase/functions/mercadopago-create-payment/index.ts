/**
 * Mercado Pago Create Payment - Edge Function
 * 
 * @version 6.0.0 - RISE Protocol V3 Compliance (Adapter Pattern)
 * 
 * RISE V3: Usa PaymentFactory + MercadoPagoAdapter para garantir:
 * - Validação de preço integrada no Adapter
 * - Circuit Breaker
 * - Timeout de 15s
 * - Zero duplicação de código
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsV2, PUBLIC_CORS_HEADERS } from '../_shared/cors-v2.ts';
import { rateLimitOnlyMiddleware, getIdentifier, RATE_LIMIT_CONFIGS } from '../_shared/rate-limiting/index.ts';
import { getVendorCredentials } from '../_shared/vault-credentials.ts';
import { processPostPaymentActions } from '../_shared/webhook-post-payment.ts';
import { createLogger } from '../_shared/logger.ts';
// RISE V3: UTMify dispatcher for pix_generated event
import { dispatchUTMifyEventForOrder } from '../_shared/utmify/index.ts';

// RISE V3: Usar PaymentFactory + Adapter
import { PaymentFactory, PaymentRequest as AdapterPaymentRequest } from '../_shared/payment-gateways/index.ts';

const log = createLogger("mercadopago-create-payment");

// === TYPES ===
interface OrderRecord {
  id: string;
  vendor_id: string;
  product_id: string;
  product_name: string | null;
  amount_cents: number;
  status: string | null;
  affiliate_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_document: string | null;
  affiliate?: { id: string; user_id: string; commission_rate: number | null } | null;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  amount_cents: number;
  quantity: number;
}

interface RequestBody {
  orderId: string;
  payerEmail: string;
  payerName?: string;
  payerDocument?: string;
  paymentMethod: 'pix' | 'credit_card';
  token?: string;
  installments?: number;
  paymentMethodId?: string;
  issuerId?: string;
}

// === CONSTANTS ===
const ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  PRODUCTS_NOT_FOUND: 'PRODUCTS_NOT_FOUND',
  TOKEN_REQUIRED: 'TOKEN_REQUIRED',
  GATEWAY_API_ERROR: 'GATEWAY_API_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CREDENTIALS_NOT_FOUND: 'CREDENTIALS_NOT_FOUND'
};

// === HELPERS ===
function createErrorResponse(
  code: string, message: string, status: number, 
  headers: Record<string, string>, details?: unknown
): Response {
  return new Response(JSON.stringify({ error: code, message, details }), {
    status, headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

function createSuccessResponse(data: unknown, headers: Record<string, string>): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200, headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

async function fetchCredentials(supabase: SupabaseClient, vendorId: string) {
  const vaultResult = await getVendorCredentials(supabase, vendorId, 'mercadopago');
  if (vaultResult.success && vaultResult.credentials?.access_token) {
    return { accessToken: vaultResult.credentials.access_token, isOwner: false };
  }
  const platformToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
  if (platformToken) {
    return { accessToken: platformToken, isOwner: true };
  }
  throw { code: ERROR_CODES.CREDENTIALS_NOT_FOUND, message: 'Credenciais não encontradas' };
}

async function calculateSplit(
  supabase: SupabaseClient, order: OrderRecord, isOwner: boolean, 
  totalCents: number
): Promise<{ applicationFeeCents: number }> {
  if (isOwner) return { applicationFeeCents: 0 };
  
  const { data: splitConfig } = await supabase
    .from('mercadopago_split_config')
    .select('split_type, percentage_amount, fixed_amount')
    .eq('vendor_id', order.vendor_id)
    .maybeSingle();
  
  if (!splitConfig) return { applicationFeeCents: 0 };
  
  let feeCents = 0;
  if (splitConfig.split_type === 'percentage' && splitConfig.percentage_amount) {
    feeCents = Math.round(totalCents * (splitConfig.percentage_amount / 100));
  } else if (splitConfig.split_type === 'fixed' && splitConfig.fixed_amount) {
    feeCents = splitConfig.fixed_amount;
  }
  
  return { applicationFeeCents: feeCents };
}

// === MAIN HANDLER ===
serve(async (req) => {
  const corsResult = handleCorsV2(req);
  
  let corsHeaders: Record<string, string>;
  if (corsResult instanceof Response) {
    if (req.method === 'OPTIONS') {
      return corsResult;
    }
    corsHeaders = PUBLIC_CORS_HEADERS;
  } else {
    corsHeaders = corsResult.headers;
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    // Rate Limiting
    const rateLimitResponse = await rateLimitOnlyMiddleware(
      supabase, req, RATE_LIMIT_CONFIGS.MERCADOPAGO_CREATE_PAYMENT, corsHeaders
    );
    if (rateLimitResponse) return rateLimitResponse;
    
    const body: RequestBody | null = await req.json().catch(() => null);
    if (!body) return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'JSON inválido', 400, corsHeaders);

    const { orderId, payerEmail, payerName, payerDocument, paymentMethod, token, installments, paymentMethodId } = body;
    if (!orderId || !payerEmail || !paymentMethod) {
      return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'Campos obrigatórios faltando', 400, corsHeaders);
    }

    log.info('RISE V3 - Using PaymentFactory + MercadoPagoAdapter', {
      orderId, paymentMethod
    });

    const { data: order } = await supabase.from('orders')
      .select(`*, affiliate:affiliates(id, user_id, commission_rate)`)
      .eq('id', orderId).maybeSingle() as { data: OrderRecord | null };
    if (!order) return createErrorResponse(ERROR_CODES.ORDER_NOT_FOUND, 'Pedido não encontrado', 404, corsHeaders);

    const { data: items } = await supabase.from('order_items')
      .select('product_id, product_name, amount_cents, quantity')
      .eq('order_id', orderId) as { data: OrderItem[] | null };
    if (!items?.length) return createErrorResponse(ERROR_CODES.PRODUCTS_NOT_FOUND, 'Pedido sem itens', 500, corsHeaders);

    const calculatedTotalCents = items.reduce((sum, i) => sum + i.amount_cents * i.quantity, 0);

    let credentials;
    try { credentials = await fetchCredentials(supabase, order.vendor_id); }
    catch (e: unknown) { 
      const err = e as { code: string; message: string };
      return createErrorResponse(err.code, err.message, 400, corsHeaders); 
    }

    const { applicationFeeCents } = await calculateSplit(
      supabase, order, credentials.isOwner, calculatedTotalCents
    );

    // ============================================================================
    // RISE V3: USAR PAYMENTFACTORY + MERCADOPAGOADAPTER
    // ============================================================================
    const gateway = PaymentFactory.create('mercadopago', {
      access_token: credentials.accessToken
    }, supabase);

    // Montar PaymentRequest no formato do Adapter
    const adapterRequest: AdapterPaymentRequest = {
      amount_cents: calculatedTotalCents,
      order_id: orderId,
      customer: {
        name: payerName || 'Cliente',
        email: payerEmail,
        document: payerDocument || order.customer_document || ''
      },
      description: `Pedido ${orderId.slice(0, 8)}`,
      card_token: token,
      installments: installments || 1,
      split_rules: applicationFeeCents > 0 ? [
        {
          amount_cents: applicationFeeCents,
          role: 'platform' as const
        }
      ] : undefined
    };

    // Validar token para cartão
    if (paymentMethod === 'credit_card' && !token) {
      return createErrorResponse(ERROR_CODES.TOKEN_REQUIRED, 'Token obrigatório para cartão', 400, corsHeaders);
    }

    // Executar pagamento via Adapter (validação de preço JÁ ESTÁ INTEGRADA)
    let result;
    try {
      if (paymentMethod === 'pix') {
        result = await gateway.createPix(adapterRequest);
      } else if (paymentMethod === 'credit_card') {
        result = await gateway.createCreditCard(adapterRequest);
      } else {
        return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'Método inválido', 400, corsHeaders);
      }
    } catch (e: unknown) {
      const err = e as { code?: string; message: string; details?: unknown };
      log.error('Adapter exception', { error: err.message });
      return createErrorResponse(err.code || ERROR_CODES.GATEWAY_API_ERROR, err.message, 502, corsHeaders, err.details);
    }

    if (!result.success) {
      log.error('Adapter returned error', { error: result.error_message, status: result.status });
      
      // RISE V3: Registrar cartão recusado no banco ANTES de retornar erro
      if (paymentMethod === 'credit_card' && result.status === 'refused') {
        await supabase.from('orders').update({
          status: 'refused',
          gateway: 'mercadopago',
          gateway_payment_id: result.transaction_id || null,
          payment_method: 'credit_card',
          updated_at: new Date().toISOString()
        }).eq('id', orderId);
        
        log.info('Order updated to refused status', { orderId });
      }
      
      return createErrorResponse(ERROR_CODES.GATEWAY_API_ERROR, result.error_message || 'Erro ao processar pagamento', 400, corsHeaders);
    }

    // Atualizar ordem
    const updateData: Record<string, unknown> = {
      gateway: 'mercadopago', 
      gateway_payment_id: result.transaction_id,
      status: result.status === 'approved' ? 'paid' : (order.status?.toLowerCase() || 'pending'),
      payment_method: paymentMethod.toLowerCase(), 
      updated_at: new Date().toISOString()
    };
    
    if (result.status === 'approved') {
      updateData.paid_at = new Date().toISOString();
    }
    
    if (paymentMethod === 'pix' && result.qr_code_text) {
      updateData.pix_qr_code = result.qr_code_text;
      updateData.pix_id = result.transaction_id;
      updateData.pix_status = result.status;
      updateData.pix_created_at = new Date().toISOString();
    }
    
    await supabase.from('orders').update(updateData).eq('id', orderId);

    // RISE V3: Disparar UTMify pix_generated para MercadoPago PIX
    if (paymentMethod === 'pix' && result.qr_code_text) {
      try {
        log.info("Disparando UTMify pix_generated para order", { orderId });
        const utmifyResult = await dispatchUTMifyEventForOrder(supabase, orderId, "pix_generated");
        if (utmifyResult.success && !utmifyResult.skipped) {
          log.info("✅ UTMify pix_generated disparado com sucesso");
        } else if (utmifyResult.skipped) {
          log.info("UTMify pix_generated pulado:", utmifyResult.reason);
        }
      } catch (utmifyError) {
        // Não crítico - não impede o fluxo de pagamento
        const errMsg = utmifyError instanceof Error ? utmifyError.message : String(utmifyError);
        log.warn("UTMify pix_generated falhou (não crítico):", errMsg);
      }
    }

    // Post-payment actions se aprovado
    if (result.status === 'approved') {
      await processPostPaymentActions(supabase, {
        orderId, 
        customerEmail: order.customer_email, 
        customerName: order.customer_name,
        productId: order.product_id, 
        productName: order.product_name,
        amountCents: calculatedTotalCents, 
        paymentMethod, 
        vendorId: order.vendor_id
      }, 'payment.approved', log);
    }

    // Montar resposta
    const responseData: Record<string, unknown> = { 
      paymentId: result.transaction_id, 
      status: result.status,
      riseV3: true,
      adapterUsed: 'MercadoPagoAdapter'
    };
    
    if (paymentMethod === 'pix' && result.qr_code) {
      responseData.pix = { 
        qrCode: result.qr_code_text || '', 
        qrCodeBase64: result.qr_code 
      };
    }
    
    return createSuccessResponse(responseData, corsHeaders);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('Erro fatal', { message: errorMessage });
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Erro interno', 500, PUBLIC_CORS_HEADERS);
  }
});
