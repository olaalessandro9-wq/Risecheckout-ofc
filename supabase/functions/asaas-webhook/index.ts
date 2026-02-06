/**
 * ============================================================================
 * ASAAS-WEBHOOK EDGE FUNCTION
 * ============================================================================
 * 
 * @version 5 - RISE Protocol V3 - Modelo Hotmart/Kiwify
 * 
 * PADRÃO DE MERCADO: Uma venda pendente NUNCA vira "cancelada".
 * OVERDUE = status continua PENDING + technical_status = 'expired'.
 * 
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { logSecurityEvent, SecurityAction } from "../_shared/audit-logger.ts";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createLogger,
  mapAsaasStatus,
  saveToDeadLetterQueue,
  CORS_HEADERS,
  ERROR_CODES
} from '../_shared/webhook-helpers.ts';
import { processPostPaymentActions } from '../_shared/webhook-post-payment.ts';
import { processPostRefundActions, getRefundEventType, type RefundReason } from '../_shared/webhook-post-refund.ts';
import { validateAsaasIP } from '../_shared/ip-whitelist.ts';

const FUNCTION_VERSION = "5";
const logger = createLogger('asaas-webhook', FUNCTION_VERSION);

// RISE V3: Supabase client via centralized factory (webhooks domain)
const ASAAS_WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN') || '';

const ENFORCE_IP_WHITELIST = Deno.env.get('ASAAS_ENFORCE_IP_WHITELIST') === 'true';

interface AsaasWebhookEvent {
  event: string;
  payment?: {
    id: string;
    billingType: string;
    value: number;
    status: string;
    externalReference?: string;
    confirmedDate?: string;
    paymentDate?: string;
  };
}

const RELEVANT_EVENTS = [
  'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_OVERDUE',
  'PAYMENT_REFUNDED', 'PAYMENT_DELETED', 'PAYMENT_UPDATED', 'PAYMENT_CREATED'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const supabase = getSupabaseClient('webhooks');
  
  let event: AsaasWebhookEvent | null = null;
  let orderId: string | undefined;

  try {
    // Validate IP Whitelist
    const ipValidation = validateAsaasIP(req, ENFORCE_IP_WHITELIST);
    
    if (!ipValidation.isValid) {
      logger.error('IP não autorizado', { 
        ip: ipValidation.clientIP, 
        reason: ipValidation.reason,
        enforced: ENFORCE_IP_WHITELIST
      });
      
      await logSecurityEvent(supabase, {
        userId: '00000000-0000-0000-0000-000000000000',
        action: SecurityAction.ACCESS_DENIED,
        resource: 'asaas-webhook',
        success: false,
        request: req,
        metadata: { 
          reason: 'IP not in whitelist', 
          ip: ipValidation.clientIP,
          enforced: ENFORCE_IP_WHITELIST
        }
      });
      
      return createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'IP não autorizado', 403);
    }
    
    if (ipValidation.clientIP) {
      logger.info('IP validado', { ip: ipValidation.clientIP });
    }

    // Validate Token
    const authHeader = req.headers.get('asaas-access-token') || '';
    
    if (!ASAAS_WEBHOOK_TOKEN) {
      logger.error('ASAAS_WEBHOOK_TOKEN não configurado');
      return createErrorResponse(ERROR_CODES.SECRET_NOT_CONFIGURED, 'Webhook token não configurado', 500);
    }

    if (authHeader !== ASAAS_WEBHOOK_TOKEN) {
      logger.error('Token inválido');
      await logSecurityEvent(supabase, {
        userId: '00000000-0000-0000-0000-000000000000',
        action: SecurityAction.ACCESS_DENIED,
        resource: 'asaas-webhook',
        success: false,
        request: req,
        metadata: { reason: 'Invalid webhook token' }
      });
      return createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'Unauthorized', 401);
    }

    event = await req.json();
    logger.info('Evento recebido', { event: event?.event });

    const { event: eventType, payment } = event || {};

    if (!payment) {
      logger.info('Evento sem payment, ignorando');
      return createSuccessResponse({ received: true, message: 'Evento sem payment' });
    }

    if (!RELEVANT_EVENTS.includes(eventType || '')) {
      logger.info(`Evento ${eventType} não processado`);
      return createSuccessResponse({ received: true, message: `Evento ${eventType} não processado` });
    }

    // Map Status (Modelo Hotmart/Kiwify)
    const { orderStatus, eventType: webhookEventType, technicalStatus } = mapAsaasStatus(payment.status);
    orderId = payment.externalReference;

    if (!orderId) {
      logger.info('Payment sem externalReference (orderId)');
      return createSuccessResponse({ received: true, message: 'Payment sem orderId' });
    }

    logger.info('Mapeamento de status', { 
      gateway_status: payment.status, 
      order_status: orderStatus, 
      technical_status: technicalStatus 
    });

    // Fetch Order
    const { data: orderData } = await supabase
      .from('orders')
      .select('vendor_id, customer_email, customer_name, product_name, amount_cents, product_id, offer_id, status')
      .eq('id', orderId)
      .single();

    const vendorId = orderData?.vendor_id || '00000000-0000-0000-0000-000000000000';

    // RISE V3: Idempotência - Se já pago e evento é de pagamento, retornar early
    const normalizedStatus = orderStatus.toLowerCase();
    if (orderData?.status === 'paid' && normalizedStatus === 'paid') {
      logger.info("Order already paid, skipping duplicate", { orderId, asaasPaymentId: payment.id });
      return createSuccessResponse({ received: true, duplicate: true, orderId });
    }

    // Build update data - MODELO HOTMART/KIWIFY
    const updateData: Record<string, unknown> = {
      gateway_payment_id: payment.id,
      updated_at: new Date().toISOString()
    };

    // MODELO HOTMART/KIWIFY:
    // - Para PAID: atualiza status para 'paid'
    // - Para technical status changes: mantém status atual, atualiza technical_status
    if (normalizedStatus === 'paid') {
      updateData.status = 'paid';
      updateData.paid_at = payment.confirmedDate || payment.paymentDate || new Date().toISOString();
    } else if (normalizedStatus === 'refunded') {
      updateData.status = 'refunded';
    } else if (normalizedStatus === 'chargeback') {
      updateData.status = 'chargeback';
    } else if (technicalStatus) {
      // NÃO muda o status principal - mantém pending (padrão de mercado)
      updateData.technical_status = technicalStatus;
      updateData.expired_at = new Date().toISOString();
      logger.info(`[MODELO HOTMART] Mantendo status=${orderData?.status || 'pending'}, technical_status=${technicalStatus}`);
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      logger.error('Erro ao atualizar order', updateError);
      
      await saveToDeadLetterQueue(supabase, {
        gateway: 'asaas',
        eventType: eventType || 'unknown',
        payload: event,
        errorCode: ERROR_CODES.UPDATE_ERROR,
        errorMessage: updateError.message,
        orderId
      });
      
      return createErrorResponse(ERROR_CODES.UPDATE_ERROR, 'Erro ao atualizar order', 500);
    }

    // Post-Payment Actions (only for PAID)
    if (normalizedStatus === 'paid' && orderData) {
      await processPostPaymentActions(supabase, {
        orderId,
        customerEmail: orderData.customer_email,
        customerName: orderData.customer_name,
        productId: orderData.product_id,
        productName: orderData.product_name,
        amountCents: orderData.amount_cents,
        offerId: orderData.offer_id,
        paymentMethod: payment.billingType === 'PIX' ? 'PIX / Asaas' : 'Asaas',
        vendorId,
      }, webhookEventType, logger);
    }

    // Post-Refund Actions - RISE V3: Revogação automática de acesso
    if (['refunded', 'chargeback'].includes(normalizedStatus) && orderData) {
      await processPostRefundActions(supabase, {
        orderId,
        productId: orderData.product_id,
        vendorId,
        reason: normalizedStatus as RefundReason,
      }, getRefundEventType(normalizedStatus as RefundReason), logger);
    }

    // Log Event
    await supabase.from('order_events').insert({
      order_id: orderId,
      type: `asaas.${eventType?.toLowerCase()}`,
      data: { 
        ...event, 
        technical_status: technicalStatus,
        model: 'hotmart_kiwify',
        version: FUNCTION_VERSION 
      },
      gateway_event_id: payment.id,
      occurred_at: new Date().toISOString(),
      vendor_id: vendorId
    });

    // Audit Log
    await logSecurityEvent(supabase, {
      userId: vendorId,
      action: SecurityAction.PROCESS_PAYMENT,
      resource: 'orders',
      resourceId: orderId,
      success: true,
      request: req,
      metadata: { 
        gateway: 'asaas', 
        eventType, 
        paymentId: payment.id, 
        newStatus: normalizedStatus === 'paid' ? 'paid' : orderData?.status,
        technicalStatus,
        model: 'hotmart_kiwify'
      }
    });

    logger.info(`Order ${orderId} processada`, { 
      status: normalizedStatus === 'paid' ? 'paid' : orderData?.status,
      technical_status: technicalStatus 
    });

    return createSuccessResponse({ 
      received: true, 
      orderId, 
      status: normalizedStatus === 'paid' ? 'paid' : orderData?.status,
      technicalStatus,
      asaasPaymentId: payment.id,
      model: 'hotmart_kiwify'
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    logger.error('Exception', error);

    if (supabase && event) {
      await saveToDeadLetterQueue(supabase, {
        gateway: 'asaas',
        eventType: event?.event || 'unknown',
        payload: event,
        errorCode: ERROR_CODES.INTERNAL_ERROR,
        errorMessage: msg,
        orderId
      });
    }

    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, msg, 500);
  }
});
