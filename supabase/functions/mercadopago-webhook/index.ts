/**
 * ============================================================================
 * MERCADOPAGO-WEBHOOK EDGE FUNCTION
 * ============================================================================
 * 
 * Versão: 147 (+ Dead Letter Queue)
 * Última Atualização: 2026-01-11
 * Status: ✅ DLQ integrada para zero perda de webhooks
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { rateLimitOnlyMiddleware, RATE_LIMIT_CONFIGS } from '../_shared/rate-limiting/index.ts';
import { getGatewayCredentials, validateCredentials } from '../_shared/platform-config.ts';
import { logSecurityEvent, SecurityAction } from '../_shared/audit-logger.ts';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createLogger,
  mapMercadoPagoStatus,
  saveToDeadLetterQueue,
  CORS_HEADERS,
  ERROR_CODES
} from '../_shared/webhook-helpers.ts';
import { validateMercadoPagoSignature } from '../_shared/mercadopago-signature.ts';
import { processPostPaymentActions } from '../_shared/webhook-post-payment.ts';
import { processPostRefundActions, getRefundEventType, type RefundReason } from '../_shared/webhook-post-refund.ts';
import { dispatchUTMifyEventForOrder } from '../_shared/utmify/index.ts';

const FUNCTION_VERSION = "147";
const logger = createLogger('mercadopago-webhook', FUNCTION_VERSION);

interface WebhookBody {
  type: string;
  data?: { id: string | number };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // Inicializar Supabase fora do try para uso no DLQ
  const supabase = (() => {
    try { return getSupabaseClient('webhooks'); }
    catch { return null; }
  })();

  let body: WebhookBody | null = null;
  let order: Record<string, unknown> | null = null;

  try {
    logger.info(`🚀 Webhook recebido - Versão ${FUNCTION_VERSION}`);

    // Rate Limiting
    if (supabase) {
      const rateLimitResponse = await rateLimitOnlyMiddleware(
        supabase,
        req,
        RATE_LIMIT_CONFIGS.WEBHOOK,
        CORS_HEADERS
      );

      if (rateLimitResponse) {
        logger.warn('Rate limit excedido');
        return rateLimitResponse;
      }
    }

    if (!supabase) {
      throw new Error('Variáveis de ambiente não configuradas');
    }

    // Parse Webhook Body
    try {
      body = await req.json();
      logger.info('Webhook payload', body);
    } catch {
      return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Corpo inválido', 400);
    }

    if (body?.type !== 'payment') {
      logger.info('Tipo de notificação ignorado', { type: body?.type });
      return createSuccessResponse({ message: 'Tipo ignorado' });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return createErrorResponse(ERROR_CODES.PAYMENT_ID_MISSING, 'ID não fornecido', 400);
    }

    // Validate Signature
    logger.info('🔒 Validando assinatura');
    const signatureValidation = await validateMercadoPagoSignature(req, paymentId.toString(), logger);
    if (!signatureValidation.valid) {
      return createErrorResponse(signatureValidation.error || 'SIGNATURE_FAILED', 'Assinatura inválida', 401);
    }

    // Find Order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('gateway_payment_id', paymentId.toString())
      .maybeSingle();

    if (orderError || !orderData) {
      logger.warn('Pedido não encontrado', { paymentId });
      return createSuccessResponse({ message: 'Pedido não encontrado' });
    }

    // Atribuir para uso fora do try (DLQ) e garantir tipo não-nulo
    order = orderData;
    const currentOrder = orderData;
    logger.info('Pedido encontrado', { orderId: currentOrder.id });

    // Get Credentials
    let accessToken: string | undefined;
    try {
      const credentialsResult = await getGatewayCredentials(supabase, currentOrder.vendor_id as string, 'mercadopago');
      if (!credentialsResult.success || !credentialsResult.credentials) {
        logger.error('🔴 Credenciais não encontradas', { error: credentialsResult.error });
        return createSuccessResponse({ message: 'Credenciais incompletas' });
      }
      const validation = validateCredentials('mercadopago', credentialsResult.credentials);
      if (!validation.valid) {
        return createSuccessResponse({ message: 'Credenciais incompletas' });
      }
      accessToken = credentialsResult.credentials.accessToken || credentialsResult.credentials.access_token;
      logger.info('✅ Credenciais obtidas', { source: credentialsResult.source });
    } catch (credError: unknown) {
      const msg = credError instanceof Error ? credError.message : 'Erro';
      logger.error('🔴 Falha ao obter credenciais', { error: msg });
      return createSuccessResponse({ message: 'Falha nas credenciais' });
    }

    if (!accessToken) {
      return createSuccessResponse({ message: 'Access token não encontrado' });
    }

    // Fetch Payment from MP
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const payment = await mpResponse.json();

    if (!mpResponse.ok) {
      logger.error('Erro ao buscar pagamento no MP', payment);
      return createSuccessResponse({ message: 'Erro MP API' });
    }

    logger.info('Status do pagamento', { status: payment.status });

    // Map Status
    const { orderStatus, eventType } = mapMercadoPagoStatus(payment.status);

    // Deduplication
    if (currentOrder.status === orderStatus) {
      logger.info('Webhook duplicado ignorado');
      return createSuccessResponse({ message: 'Duplicado', orderId: currentOrder.id });
    }

    // Update Order - Normalizar status para lowercase
    const normalizedStatus = orderStatus.toLowerCase();
    const updateData: Record<string, unknown> = {
      status: normalizedStatus,
      updated_at: new Date().toISOString()
    };
    if (normalizedStatus === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', currentOrder.id);

    if (updateError) {
      logger.error('Erro ao atualizar pedido', updateError);
      
      await saveToDeadLetterQueue(supabase, {
        gateway: 'mercadopago',
        eventType: body?.type || 'payment',
        payload: body,
        errorCode: ERROR_CODES.UPDATE_ERROR,
        errorMessage: updateError.message,
        orderId: currentOrder.id as string
      });
      
      return createErrorResponse(ERROR_CODES.UPDATE_ERROR, 'Erro ao atualizar', 500);
    }

    logger.info('✅ Pedido atualizado', { orderId: currentOrder.id, status: normalizedStatus });

    // Security Log
    if (normalizedStatus === 'paid') {
      await logSecurityEvent(supabase, {
        userId: currentOrder.vendor_id as string,
        action: SecurityAction.PROCESS_PAYMENT,
        resource: "orders",
        resourceId: currentOrder.id as string,
        success: true,
        metadata: { gateway: "mercadopago", payment_status: payment.status }
      });
    }

    // Post-Payment Actions
    if (normalizedStatus === 'paid') {
      await processPostPaymentActions(supabase, {
        orderId: currentOrder.id as string,
        customerEmail: currentOrder.customer_email as string,
        customerName: currentOrder.customer_name as string,
        productId: currentOrder.product_id as string,
        productName: currentOrder.product_name as string,
        amountCents: currentOrder.amount_cents as number,
        offerId: currentOrder.offer_id as string,
        paymentMethod: 'PIX / Mercado Pago',
        vendorId: currentOrder.vendor_id as string,
      }, eventType, logger);
    }

    // RISE V3: Disparar UTMify purchase_refused para pagamentos recusados
    if (normalizedStatus === 'rejected' || normalizedStatus === 'cancelled') {
      try {
        const result = await dispatchUTMifyEventForOrder(supabase, currentOrder.id as string, "purchase_refused");
        if (result.success && !result.skipped) {
          logger.info("UTMify purchase_refused disparado");
        }
      } catch (utmifyError) {
        logger.warn("UTMify purchase_refused falhou (não crítico)", utmifyError);
      }
    }

    // Post-Refund Actions - RISE V3: Revogação automática de acesso + UTMify
    if (['refunded', 'chargeback', 'partially_refunded'].includes(normalizedStatus)) {
      await processPostRefundActions(supabase, {
        orderId: currentOrder.id as string,
        productId: currentOrder.product_id as string,
        vendorId: currentOrder.vendor_id as string,
        reason: normalizedStatus as RefundReason,
      }, getRefundEventType(normalizedStatus as RefundReason), logger);
    }

    return createSuccessResponse({
      orderId: currentOrder.id,
      status: orderStatus,
      version: FUNCTION_VERSION
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro';
    logger.error('Erro fatal', { message: msg });

    // 🆕 Salvar na DLQ para erros críticos não tratados
    if (supabase && body) {
      await saveToDeadLetterQueue(supabase, {
        gateway: 'mercadopago',
        eventType: body?.type || 'unknown',
        payload: body,
        errorCode: ERROR_CODES.INTERNAL_ERROR,
        errorMessage: msg,
        orderId: order?.id as string | undefined
      });
    }

    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Erro interno', 500);
  }
});
