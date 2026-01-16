/**
 * Mercado Pago Create Payment - Edge Function
 * 
 * @version 3.0.0 - RISE Protocol V2 Compliance (Modular Architecture)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { rateLimitMiddleware, getIdentifier } from '../_shared/rate-limit.ts';

// Handlers
import { handlePixPayment, PixPaymentResult } from './handlers/pix-handler.ts';
import { handleCardPayment, CardPaymentResult } from './handlers/card-handler.ts';

// Helpers (same level)
import { getCorsHeaders, createSuccessResponse, createErrorResponse } from './cors.ts';
import { fetchCredentials } from './credentials.ts';
import { fetchAffiliateCollectorId, calculateSplit } from './split.ts';
import { handlePostPaymentActions } from './post-payment.ts';

// Utils
import { logError } from './utils/logger.ts';

// Types & Constants
import { ERROR_CODES } from './constants.ts';
import type { 
  OrderRecord, 
  OrderItem, 
  RequestBody,
  SuccessResponseData,
  OrderUpdateData,
  GatewayError,
  CredentialsResult
} from './types.ts';

// === MAIN HANDLER ===
serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const corsHeaders = getCorsHeaders(origin);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Rate limit check
    const rateLimitResponse = await rateLimitMiddleware(req, {
      maxAttempts: 10,
      windowMs: 60000,
      identifier: getIdentifier(req, false),
      action: 'create_payment'
    });
    if (rateLimitResponse) return rateLimitResponse;

    // Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Parse body
    const body: RequestBody | null = await req.json().catch(() => null);
    if (!body) {
      return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'JSON inválido', 400, corsHeaders);
    }

    const { 
      orderId, 
      payerEmail, 
      payerName, 
      payerDocument, 
      paymentMethod, 
      token, 
      installments, 
      paymentMethodId, 
      issuerId 
    } = body;

    // Validação de campos obrigatórios
    if (!orderId || !payerEmail || !paymentMethod) {
      return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'Campos obrigatórios faltando', 400, corsHeaders);
    }

    // Buscar order
    const { data: order } = await supabase
      .from('orders')
      .select(`*, affiliate:affiliates(id, user_id, commission_rate)`)
      .eq('id', orderId)
      .maybeSingle() as { data: OrderRecord | null };

    if (!order) {
      return createErrorResponse(ERROR_CODES.ORDER_NOT_FOUND, 'Pedido não encontrado', 404, corsHeaders);
    }

    // Buscar itens do pedido
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, product_name, amount_cents, quantity')
      .eq('order_id', orderId) as { data: OrderItem[] | null };

    if (!items?.length) {
      return createErrorResponse(ERROR_CODES.PRODUCTS_NOT_FOUND, 'Pedido sem itens', 500, corsHeaders);
    }

    const calculatedTotalCents = items.reduce((sum, i) => sum + i.amount_cents * i.quantity, 0);

    // Buscar credenciais
    let credentials: CredentialsResult;
    try {
      credentials = await fetchCredentials(supabase, order.vendor_id);
    } catch (e: unknown) {
      const gatewayError = e as GatewayError;
      return createErrorResponse(gatewayError.code, gatewayError.message, 400, corsHeaders);
    }

    // Calcular split
    const affiliateCollectorId = await fetchAffiliateCollectorId(supabase, order);
    const { effectiveAccessToken, applicationFeeCents } = await calculateSplit(
      supabase,
      order,
      credentials.isOwner,
      calculatedTotalCents,
      credentials.accessToken,
      affiliateCollectorId
    );

    // Processar pagamento
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
        if (!token) {
          return createErrorResponse(ERROR_CODES.TOKEN_REQUIRED, 'Token obrigatório', 400, corsHeaders);
        }
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
      return createErrorResponse(
        gatewayError.code || ERROR_CODES.GATEWAY_API_ERROR,
        gatewayError.message,
        502,
        corsHeaders,
        gatewayError.details
      );
    }

    // Preparar dados de update
    const updateData: OrderUpdateData = {
      gateway: 'mercadopago',
      gateway_payment_id: paymentResult.transactionId,
      status: paymentResult.status === 'approved' ? 'paid' : (order.status?.toLowerCase() || 'pending'),
      payment_method: paymentMethod.toLowerCase(),
      updated_at: new Date().toISOString()
    };

    if (paymentResult.status === 'approved') {
      updateData.paid_at = new Date().toISOString();
    }

    if (paymentMethod === 'pix' && 'qrCodeText' in paymentResult && paymentResult.qrCodeText) {
      updateData.pix_qr_code = paymentResult.qrCodeText;
      updateData.pix_id = paymentResult.transactionId;
      updateData.pix_status = paymentResult.status;
      updateData.pix_created_at = new Date().toISOString();
    }

    // Atualizar order
    await supabase.from('orders').update(updateData).eq('id', orderId);

    // Se aprovado, executar ações pós-pagamento
    if (paymentResult.status === 'approved') {
      await handlePostPaymentActions({
        supabase,
        order,
        orderId,
        transactionId: paymentResult.transactionId,
        calculatedTotalCents
      });
    }

    // Montar resposta de sucesso
    const responseData: SuccessResponseData = {
      paymentId: paymentResult.transactionId,
      status: paymentResult.status
    };

    if (paymentMethod === 'pix' && 'qrCode' in paymentResult && paymentResult.qrCode) {
      responseData.pix = {
        qrCode: paymentResult.qrCodeText || '',
        qrCodeBase64: paymentResult.qrCode
      };
    }

    return createSuccessResponse(responseData, corsHeaders);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Erro fatal', { message: errorMessage });
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Erro interno', 500, getCorsHeaders(""));
  }
});
