/**
 * ============================================================================
 * PUSHINPAY-WEBHOOK EDGE FUNCTION
 * ============================================================================
 * 
 * Versão: 5 (+ Dead Letter Queue)
 * Última Atualização: 2026-01-11
 * Status: ✅ DLQ integrada para zero perda de webhooks
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logSecurityEvent, SecurityAction } from '../_shared/audit-logger.ts';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createLogger,
  mapPushinPayStatus,
  saveToDeadLetterQueue,
  CORS_HEADERS,
  ERROR_CODES
} from '../_shared/webhook-helpers.ts';
import { processPostPaymentActions } from '../_shared/webhook-post-payment.ts';

const FUNCTION_VERSION = "5";
const logger = createLogger('pushinpay-webhook', FUNCTION_VERSION);

interface PushinPayWebhookBody {
  id: string;
  status: 'created' | 'paid' | 'canceled' | 'expired';
  value?: number;
  payer_name?: string | null;
  payer_national_registration?: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // Inicializar Supabase fora do try para uso no DLQ
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let body: PushinPayWebhookBody | null = null;
  let order: Record<string, unknown> | null = null;

  try {
    logger.info('========== WEBHOOK RECEBIDO ==========');

    // Validate Token
    const receivedToken = req.headers.get('x-pushinpay-token');
    const expectedToken = Deno.env.get('PUSHINPAY_WEBHOOK_TOKEN');

    if (!expectedToken) {
      logger.error('PUSHINPAY_WEBHOOK_TOKEN não configurado!');
      return createErrorResponse(ERROR_CODES.SECRET_NOT_CONFIGURED, 'Token não configurado', 500);
    }

    if (!receivedToken || receivedToken !== expectedToken) {
      logger.warn('Token inválido ou ausente');
      return createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'Unauthorized', 401);
    }

    logger.info('✅ Token validado');

    // Parse Request
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      body = {
        id: params.get('id') || '',
        status: (params.get('status') as PushinPayWebhookBody['status']) || 'created',
        value: params.get('value') ? parseInt(params.get('value')!, 10) : undefined,
        payer_name: params.get('payer_name') || undefined,
        payer_national_registration: params.get('payer_national_registration') || undefined,
      };
    } else {
      body = await req.json();
    }

    logger.info('Payload recebido', { id: body?.id, status: body?.status });

    if (!body?.id) {
      return createErrorResponse(ERROR_CODES.PAYMENT_ID_MISSING, 'Missing payment ID', 400);
    }

    // Normalize ID to lowercase
    const paymentId = body.id.toLowerCase();
    logger.info('ID normalizado', { original: body.id, normalizado: paymentId });

    // Find Order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('pix_id', paymentId)
      .single();

    if (orderError || !orderData) {
      logger.error('Pedido não encontrado', { pix_id: paymentId });
      return createErrorResponse(ERROR_CODES.ORDER_NOT_FOUND, 'Order not found', 404);
    }

    order = orderData;
    const currentOrder = orderData;
    logger.info('✅ Pedido encontrado', { order_id: currentOrder.id, status_atual: currentOrder.status });

    // Ignore 'created' events
    if (body.status === 'created') {
      logger.info('Evento created - apenas log');
      return createSuccessResponse({ message: 'Event logged' });
    }

    // Avoid reprocessing
    if (body.status === 'paid' && (currentOrder.status as string)?.toUpperCase() === 'PAID') {
      logger.warn('Pedido já está PAID - ignorando duplicata');
      return createSuccessResponse({ message: 'Already processed' });
    }

    // Map Status
    const { orderStatus, eventType } = mapPushinPayStatus(body.status);

    if (orderStatus === 'PENDING') {
      logger.warn('Status desconhecido', { status: body.status });
      return createSuccessResponse({ message: `Unknown status: ${body.status}` });
    }

    logger.info('Atualizando pedido', { old_status: currentOrder.status, new_status: orderStatus });

    // Update Order
    const updateData: Record<string, unknown> = {
      status: orderStatus,
      pix_status: body.status,
      updated_at: new Date().toISOString(),
    };

    if (orderStatus === 'PAID') {
      updateData.paid_at = new Date().toISOString();
    }

    if (body.payer_name && !currentOrder.customer_name) {
      updateData.customer_name = body.payer_name;
    }
    if (body.payer_national_registration && !currentOrder.customer_document) {
      updateData.customer_document = body.payer_national_registration;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', currentOrder.id);

    if (updateError) {
      logger.error('Erro ao atualizar pedido', updateError);
      
      await saveToDeadLetterQueue(supabase, {
        gateway: 'pushinpay',
        eventType: body.status,
        payload: body,
        errorCode: ERROR_CODES.UPDATE_ERROR,
        errorMessage: updateError.message,
        orderId: currentOrder.id as string
      });
      
      return createErrorResponse(ERROR_CODES.UPDATE_ERROR, 'Failed to update order', 500);
    }

    logger.info('✅ Pedido atualizado');

    // Security Log
    if (orderStatus === 'PAID') {
      await logSecurityEvent(supabase, {
        userId: currentOrder.vendor_id as string,
        action: SecurityAction.PROCESS_PAYMENT,
        resource: "orders",
        resourceId: currentOrder.id as string,
        success: true,
        metadata: { gateway: "pushinpay", payment_status: body.status, pix_id: paymentId }
      });
    }

    // Post-Payment Actions
    if (orderStatus === 'PAID') {
      await processPostPaymentActions(supabase, {
        orderId: currentOrder.id as string,
        customerEmail: currentOrder.customer_email as string,
        customerName: (currentOrder.customer_name as string) || body.payer_name || null,
        productId: currentOrder.product_id as string,
        productName: currentOrder.product_name as string,
        amountCents: currentOrder.amount_cents as number,
        offerId: currentOrder.offer_id as string,
        paymentMethod: 'PIX / PushinPay',
        vendorId: currentOrder.vendor_id as string,
      }, eventType, logger);
    }

    // Log Event
    try {
      await supabase.from('order_events').insert({
        order_id: currentOrder.id,
        vendor_id: currentOrder.vendor_id,
        type: `pushinpay_${body.status}`,
        occurred_at: new Date().toISOString(),
        data: { status: body.status, payer_name: body.payer_name, version: FUNCTION_VERSION },
      });
    } catch (eventError) {
      logger.warn('Erro ao registrar evento', eventError);
    }

    logger.info('========== WEBHOOK PROCESSADO ==========');

    return createSuccessResponse({
      order_id: currentOrder.id,
      new_status: orderStatus,
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Erro geral', error);

    // 🆕 Salvar na DLQ para erros críticos não tratados
    if (supabase && body) {
      await saveToDeadLetterQueue(supabase, {
        gateway: 'pushinpay',
        eventType: body?.status || 'unknown',
        payload: body,
        errorCode: ERROR_CODES.INTERNAL_ERROR,
        errorMessage: msg,
        orderId: order?.id as string | undefined
      });
    }

    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, msg, 500);
  }
});
