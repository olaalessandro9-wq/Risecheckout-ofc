/**
 * ============================================================================
 * ASAAS-WEBHOOK EDGE FUNCTION
 * ============================================================================
 * 
 * Versão: 4 (+ IP Whitelist)
 * Última Atualização: 2026-01-12
 * Status: ✅ DLQ + IP Whitelist para segurança máxima
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
import { validateAsaasIP } from '../_shared/ip-whitelist.ts';

const FUNCTION_VERSION = "4";
const logger = createLogger('asaas-webhook', FUNCTION_VERSION);

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ASAAS_WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN') || '';

// Se true, bloqueia IPs fora da whitelist. Se false, apenas loga warning.
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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  let event: AsaasWebhookEvent | null = null;
  let orderId: string | undefined;

  try {
    // 🆕 Validate IP Whitelist
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
    
    // Log IP para auditoria (mesmo quando válido)
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

    // Map Status
    const { orderStatus, eventType: webhookEventType } = mapAsaasStatus(payment.status);
    orderId = payment.externalReference;

    if (!orderId) {
      logger.info('Payment sem externalReference (orderId)');
      return createSuccessResponse({ received: true, message: 'Payment sem orderId' });
    }

    logger.info(`Atualizando order ${orderId} para status ${orderStatus}`);

    // Fetch Order
    const { data: orderData } = await supabase
      .from('orders')
      .select('vendor_id, customer_email, customer_name, product_name, amount_cents, product_id, offer_id')
      .eq('id', orderId)
      .single();

    const vendorId = orderData?.vendor_id || '00000000-0000-0000-0000-000000000000';

    // Update Order - Normalizar status para lowercase
    const normalizedStatus = orderStatus.toLowerCase();
    const updateData: Record<string, unknown> = {
      status: normalizedStatus,
      gateway_payment_id: payment.id,
      updated_at: new Date().toISOString()
    };

    if (normalizedStatus === 'paid') {
      updateData.paid_at = payment.confirmedDate || payment.paymentDate || new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      logger.error('Erro ao atualizar order', updateError);
      
      // 🆕 Salvar na DLQ em caso de erro de update
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

    // Post-Payment Actions
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

    // Log Event
    await supabase.from('order_events').insert({
      order_id: orderId,
      type: `asaas.${eventType?.toLowerCase()}`,
      data: event,
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
      metadata: { gateway: 'asaas', eventType, paymentId: payment.id, newStatus: orderStatus }
    });

    logger.info(`Order ${orderId} atualizada com sucesso para ${orderStatus}`);

    return createSuccessResponse({ 
      received: true, 
      orderId, 
      status: orderStatus,
      asaasPaymentId: payment.id 
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    logger.error('Exception', error);

    // 🆕 Salvar na DLQ para erros críticos não tratados
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
