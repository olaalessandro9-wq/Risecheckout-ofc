/**
 * ============================================================================
 * MERCADOPAGO-WEBHOOK EDGE FUNCTION
 * ============================================================================
 * 
 * Versão: 146 (REFATORADO)
 * Última Atualização: 2026-01-11
 * Status: ✅ Refatorado para usar helpers compartilhados
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { rateLimitMiddleware, getIdentifier } from '../_shared/rate-limit.ts';
import { getGatewayCredentials, validateCredentials } from '../_shared/platform-config.ts';
import { logSecurityEvent, SecurityAction } from '../_shared/audit-logger.ts';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createLogger,
  mapMercadoPagoStatus,
  CORS_HEADERS,
  ERROR_CODES
} from '../_shared/webhook-helpers.ts';
import { validateMercadoPagoSignature } from '../_shared/mercadopago-signature.ts';
import { processPostPaymentActions } from '../_shared/webhook-post-payment.ts';

const FUNCTION_VERSION = "146";
const logger = createLogger('mercadopago-webhook', FUNCTION_VERSION);

interface WebhookBody {
  type: string;
  data?: { id: string | number };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    logger.info(`🚀 Webhook recebido - Versão ${FUNCTION_VERSION}`);

    // Rate Limiting
    const rateLimitResponse = await rateLimitMiddleware(req, {
      maxAttempts: 30,
      windowMs: 60 * 1000,
      identifier: getIdentifier(req, false),
      action: 'mercadopago_webhook',
    });

    if (rateLimitResponse) {
      logger.warn('Rate limit excedido');
      return rateLimitResponse;
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente não configuradas');
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse Webhook Body
    let body: WebhookBody;
    try {
      body = await req.json();
      logger.info('Webhook payload', body);
    } catch {
      return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Corpo inválido', 400);
    }

    if (body.type !== 'payment') {
      logger.info('Tipo de notificação ignorado', { type: body.type });
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
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('gateway_payment_id', paymentId.toString())
      .maybeSingle();

    if (orderError || !order) {
      logger.warn('Pedido não encontrado', { paymentId });
      return createSuccessResponse({ message: 'Pedido não encontrado' });
    }

    logger.info('Pedido encontrado', { orderId: order.id });

    // Get Credentials
    let accessToken: string | undefined;
    try {
      const credentialsResult = await getGatewayCredentials(supabase, order.vendor_id, 'mercadopago');
      const validation = validateCredentials('mercadopago', credentialsResult.credentials);
      if (!validation.valid) {
        return createSuccessResponse({ message: 'Credenciais incompletas' });
      }
      accessToken = credentialsResult.credentials.accessToken;
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
    if (order.status === orderStatus) {
      logger.info('Webhook duplicado ignorado');
      return createSuccessResponse({ message: 'Duplicado', orderId: order.id });
    }

    // Update Order
    const updateData: Record<string, unknown> = {
      status: orderStatus,
      updated_at: new Date().toISOString()
    };
    if (orderStatus === 'PAID') {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      logger.error('Erro ao atualizar pedido', updateError);
      return createErrorResponse(ERROR_CODES.UPDATE_ERROR, 'Erro ao atualizar', 500);
    }

    logger.info('✅ Pedido atualizado', { orderId: order.id, status: orderStatus });

    // Security Log
    if (orderStatus === 'PAID') {
      await logSecurityEvent(supabase, {
        userId: order.vendor_id,
        action: SecurityAction.PROCESS_PAYMENT,
        resource: "orders",
        resourceId: order.id,
        success: true,
        metadata: { gateway: "mercadopago", payment_status: payment.status }
      });
    }

    // Post-Payment Actions
    if (orderStatus === 'PAID') {
      await processPostPaymentActions(supabase, {
        orderId: order.id,
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        productId: order.product_id,
        productName: order.product_name,
        amountCents: order.amount_cents,
        offerId: order.offer_id,
        paymentMethod: 'PIX / Mercado Pago',
        vendorId: order.vendor_id,
      }, eventType, logger);
    }

    return createSuccessResponse({
      orderId: order.id,
      status: orderStatus,
      version: FUNCTION_VERSION
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro';
    logger.error('Erro fatal', { message: msg });
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Erro interno', 500);
  }
});
