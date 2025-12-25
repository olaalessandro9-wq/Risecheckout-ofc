/**
 * ============================================================================
 * MERCADOPAGO-WEBHOOK EDGE FUNCTION
 * ============================================================================
 * 
 * Versão: 144 (SECURITY FIX)
 * Última Atualização: 2025-12-12
 * Status: ✅ Validação Rigorosa Implementada
 * 
 * ============================================================================
 * MUDANÇAS NESTA VERSÃO (v144)
 * ============================================================================
 * 
 * 🔒 CORREÇÃO DE SEGURANÇA CRÍTICA:
 * - Implementada validação rigorosa de assinatura HMAC-SHA256
 * - Webhooks inválidos agora são REJEITADOS (não mais permitidos)
 * - Adicionado logging detalhado para monitoramento
 * 
 * ANTES (v143): validateMercadoPagoSignature retornava { valid: true, skipped: true }
 *               mesmo quando a validação falhava
 * 
 * AGORA (v144): validateMercadoPagoSignature retorna { valid: false, error: '...' }
 *               e o webhook é rejeitado com status HTTP apropriado
 * 
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { rateLimitMiddleware, getIdentifier } from '../_shared/rate-limit.ts';
import { sendEmail } from '../_shared/zeptomail.ts';
import { getPurchaseConfirmationTemplate, getPurchaseConfirmationTextTemplate, type PurchaseConfirmationData } from '../_shared/email-templates.ts';

// Versão da função - SEMPRE incrementar ao fazer mudanças significativas
const FUNCTION_VERSION = "144";

// ========================================================================
// TYPES & INTERFACES
// ========================================================================

interface ApiResponse {
  success: boolean
  data?: any
  error?: string
}

interface WebhookBody {
  type: string
  data?: {
    id: string | number
  }
}

interface SignatureValidationResult {
  valid: boolean
  error?: string
}

// ========================================================================
// CONSTANTS
// ========================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const ERROR_CODES = {
  PAYMENT_ID_MISSING: 'PAYMENT_ID_MISSING',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  MP_NOT_CONFIGURED: 'MP_NOT_CONFIGURED',
  MP_API_ERROR: 'MP_API_ERROR',
  UPDATE_ERROR: 'UPDATE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SECRET_NOT_CONFIGURED: 'SECRET_NOT_CONFIGURED',
  MISSING_SIGNATURE_HEADERS: 'MISSING_SIGNATURE_HEADERS',
  INVALID_SIGNATURE_FORMAT: 'INVALID_SIGNATURE_FORMAT',
  WEBHOOK_EXPIRED: 'WEBHOOK_EXPIRED',
  SIGNATURE_MISMATCH: 'SIGNATURE_MISMATCH',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
};

const SIGNATURE_MAX_AGE = 300; // 5 minutos

// ========================================================================
// HELPER FUNCTIONS - LOGGING
// ========================================================================

function logInfo(message: string, data?: any) {
  console.log(`[mercadopago-webhook] [v${FUNCTION_VERSION}] [INFO] ${message}`, data ? JSON.stringify(data) : '');
}

function logError(message: string, error?: any) {
  console.error(`[mercadopago-webhook] [v${FUNCTION_VERSION}] [ERROR] ${message}`, error);
}

function logWarn(message: string, data?: any) {
  console.warn(`[mercadopago-webhook] [v${FUNCTION_VERSION}] [WARN] ${message}`, data ? JSON.stringify(data) : '');
}

// ========================================================================
// HELPER FUNCTIONS - RESPONSE
// ========================================================================

function createSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

function createErrorResponse(code: string, message: string, status: number): Response {
  return new Response(
    JSON.stringify({ success: false, error: message, code }),
    {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status,
    }
  );
}

// ========================================================================
// HELPER FUNCTIONS - CRYPTO
// ========================================================================

async function generateHmacSignature(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

// ========================================================================
// HELPER FUNCTIONS - SIGNATURE VALIDATION (SECURITY FIX v144)
// ========================================================================

async function validateMercadoPagoSignature(
  req: Request,
  dataId: string
): Promise<SignatureValidationResult> {
  
  // ========================================================================
  // CAMADA 1: VERIFICAR PRESENÇA DO SECRET (OBRIGATÓRIO)
  // ========================================================================
  
  const webhookSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');

  if (!webhookSecret) {
    logError('🔴 MERCADOPAGO_WEBHOOK_SECRET não configurado - REJEITANDO webhook');
    return { valid: false, error: ERROR_CODES.SECRET_NOT_CONFIGURED };
  }

  // ========================================================================
  // CAMADA 2: VERIFICAR PRESENÇA DOS HEADERS (OBRIGATÓRIOS)
  // ========================================================================

  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');

  logInfo('Headers recebidos', {
    hasSignature: !!xSignature,
    hasRequestId: !!xRequestId
  });

  if (!xSignature || !xRequestId) {
    logError('🔴 Headers de assinatura ausentes - REJEITANDO webhook', {
      xSignature: xSignature ? 'presente' : 'ausente',
      xRequestId: xRequestId ? 'presente' : 'ausente'
    });
    return { valid: false, error: ERROR_CODES.MISSING_SIGNATURE_HEADERS };
  }

  try {
    // ========================================================================
    // CAMADA 3: VALIDAR FORMATO DA ASSINATURA
    // ========================================================================

    const parts = xSignature.split(',');
    const tsMatch = parts.find(p => p.startsWith('ts='));
    const v1Match = parts.find(p => p.startsWith('v1='));

    if (!tsMatch || !v1Match) {
      logError('🔴 Formato de assinatura inválido - REJEITANDO webhook', {
        signatureFormat: xSignature
      });
      return { valid: false, error: ERROR_CODES.INVALID_SIGNATURE_FORMAT };
    }

    const timestamp = tsMatch.split('=')[1];
    const receivedHash = v1Match.split('=')[1];

    // ========================================================================
    // CAMADA 4: VERIFICAR IDADE DO WEBHOOK (PROTEÇÃO CONTRA REPLAY)
    // ========================================================================

    const now = Math.floor(Date.now() / 1000);
    const age = now - parseInt(timestamp);

    logInfo('Verificando idade do webhook', { age, maxAge: SIGNATURE_MAX_AGE });

    if (age > SIGNATURE_MAX_AGE) {
      logError('🔴 Webhook expirado - REJEITANDO', { 
        age, 
        maxAge: SIGNATURE_MAX_AGE,
        difference: age - SIGNATURE_MAX_AGE 
      });
      return { valid: false, error: ERROR_CODES.WEBHOOK_EXPIRED };
    }

    // ========================================================================
    // CAMADA 5: VALIDAR ASSINATURA HMAC-SHA256
    // ========================================================================

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
    const expectedHash = await generateHmacSignature(webhookSecret, manifest);

    logInfo('Comparando assinaturas', {
      expected: expectedHash.substring(0, 10) + '...',
      received: receivedHash.substring(0, 10) + '...',
      manifest
    });

    if (expectedHash !== receivedHash) {
      logError('🔴 Assinatura não corresponde - REJEITANDO webhook', {
        expected: expectedHash.substring(0, 20) + '...',
        received: receivedHash.substring(0, 20) + '...'
      });
      return { valid: false, error: ERROR_CODES.SIGNATURE_MISMATCH };
    }

    logInfo('✅ Assinatura validada com sucesso');
    return { valid: true };

  } catch (error) {
    logError('🔴 Erro ao validar assinatura - REJEITANDO webhook', error);
    return { valid: false, error: ERROR_CODES.VALIDATION_ERROR };
  }
}

// ========================================================================
// HELPER FUNCTIONS - BUSINESS LOGIC
// ========================================================================

function mapPaymentStatusToOrderStatus(paymentStatus: string): {
  orderStatus: string;
  eventType: string | null;
} {
  switch (paymentStatus) {
    case 'approved':
      return { orderStatus: 'PAID', eventType: 'purchase_approved' };
    case 'pending':
    case 'in_process':
    case 'in_mediation':
      return { orderStatus: 'PENDING', eventType: 'pix_generated' };
    case 'rejected':
    case 'cancelled':
      return { orderStatus: 'CANCELLED', eventType: 'purchase_refused' };
    case 'refunded':
    case 'charged_back':
      return {
        orderStatus: 'REFUNDED',
        eventType: paymentStatus === 'charged_back' ? 'chargeback' : 'refund'
      };
    default:
      logWarn('Status de pagamento desconhecido', { paymentStatus });
      return { orderStatus: 'PENDING', eventType: null };
  }
}

// ========================================================================
// MAIN HANDLER
// ========================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    logInfo(`🚀 Webhook recebido - Versão ${FUNCTION_VERSION} (Security Fix)`);

    // ========================================================================
    // 0. RATE LIMITING (Proteção contra spam de webhooks)
    // ========================================================================
    const rateLimitResponse = await rateLimitMiddleware(req, {
      maxAttempts: 30,
      windowMs: 60 * 1000, // 1 minuto
      identifier: getIdentifier(req, false), // usar IP
      action: 'mercadopago_webhook',
    });

    if (rateLimitResponse) {
      logWarn('Rate limit excedido para webhook', { identifier: getIdentifier(req, false) });
      return rateLimitResponse;
    }

    // ========================================================================
    // 1. INITIALIZE SUPABASE CLIENT
    // ========================================================================

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ========================================================================
    // 2. PARSE AND VALIDATE WEBHOOK BODY
    // ========================================================================

    let body: WebhookBody;

    try {
      body = await req.json();
      logInfo('Webhook payload', body);
    } catch (error) {
      logError('Erro ao fazer parse do JSON', error);
      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Corpo da requisição inválido',
        400
      );
    }

    // Ignorar notificações que não são de pagamento
    if (body.type !== 'payment') {
      logInfo('Tipo de notificação ignorado', { type: body.type });
      return createSuccessResponse({ message: 'Tipo de notificação ignorado' });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      logError('ID do pagamento não fornecido');
      return createErrorResponse(
        ERROR_CODES.PAYMENT_ID_MISSING,
        'ID do pagamento não fornecido',
        400
      );
    }

    // ========================================================================
    // 3. VALIDATE SIGNATURE (SECURITY FIX v144)
    // ========================================================================

    logInfo('🔒 Iniciando validação de assinatura (v144 - Security Fix)');
    const signatureValidation = await validateMercadoPagoSignature(req, paymentId.toString());

    // 🔒 SECURITY FIX: REJEITAR se a validação falhar
    if (!signatureValidation.valid) {
      logError('🔴 Validação de assinatura falhou - REJEITANDO webhook', {
        error: signatureValidation.error,
        paymentId
      });
      
      return createErrorResponse(
        signatureValidation.error || 'SIGNATURE_VALIDATION_FAILED',
        'Assinatura do webhook inválida',
        401 // Unauthorized
      );
    }

    logInfo('✅ Assinatura validada com sucesso - Prosseguindo com processamento');

    // ========================================================================
    // 4. FIND ORDER
    // ========================================================================

    logInfo('Buscando pedido', { paymentId });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('gateway_payment_id', paymentId.toString())
      .maybeSingle();

    if (orderError) {
      logError('Erro ao buscar pedido', orderError);
      // Retornar 200 para não receber retry do MP
      return createSuccessResponse({ message: 'Erro ao buscar pedido' });
    }

    if (!order) {
      logWarn('Pedido não encontrado', { paymentId });
      // Retornar 200 para não receber retry do MP
      return createSuccessResponse({ message: 'Pedido não encontrado' });
    }

    logInfo('Pedido encontrado', { orderId: order.id });

    const vendorId = order.vendor_id;

    // ========================================================================
    // 5. FETCH MERCADO PAGO CREDENTIALS (CORRIGIDO: Busca de vendor_integrations)
    // ========================================================================

    logInfo('Buscando credenciais', { vendorId });

    const { data: integration } = await supabase
      .from('vendor_integrations')
      .select('config')
      .eq('vendor_id', vendorId)
      .eq('integration_type', 'MERCADOPAGO')
      .eq('active', true)
      .maybeSingle();

    if (!integration) {
      logError('Integração do Mercado Pago não encontrada');
      return createSuccessResponse({ message: 'Integração não encontrada' });
    }

    let accessToken: string | undefined;
    
    // Verificar se é modo sandbox baseado em is_test da config
    const isTestMode = integration.config?.is_test === true;
    
    logInfo('Modo de integração detectado', { 
      isTestMode, 
      configIsTest: integration.config?.is_test 
    });

    if (isTestMode) {
      // MODO SANDBOX: Usar credenciais direto da config
      accessToken = integration.config?.access_token;
      logInfo('✅ Usando credenciais de SANDBOX (is_test=true)');
    } else {
      // MODO PRODUÇÃO: Usar credenciais da config (ou Vault no futuro)
      accessToken = integration.config?.access_token;
      logInfo('✅ Usando credenciais de PRODUÇÃO');
    }

    if (!accessToken) {
      logError('Access token não encontrado');
      return createSuccessResponse({ message: 'Access token não encontrado' });
    }

    // ========================================================================
    // 6. FETCH PAYMENT FROM MERCADO PAGO
    // ========================================================================

    logInfo('Consultando pagamento no Mercado Pago', { paymentId });

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const payment = await mpResponse.json();

    if (!mpResponse.ok) {
      logError('Erro ao buscar pagamento no Mercado Pago', payment);
      return createSuccessResponse({ message: 'Erro ao buscar pagamento no MP' });
    }

    logInfo('Status do pagamento', {
      status: payment.status,
      statusDetail: payment.status_detail
    });

    // ========================================================================
    // 7. MAP PAYMENT STATUS TO ORDER STATUS
    // ========================================================================

    const { orderStatus, eventType } = mapPaymentStatusToOrderStatus(payment.status);

    // ========================================================================
    // 8. DEDUPLICATION CHECK
    // ========================================================================

    if (order.status === orderStatus) {
      logInfo('Webhook duplicado ignorado', {
        orderId: order.id,
        status: orderStatus
      });
      return createSuccessResponse({
        message: 'Webhook duplicado ignorado',
        orderId: order.id
      });
    }

    // ========================================================================
    // 9. UPDATE ORDER
    // ========================================================================

    logInfo('Atualizando pedido', {
      orderId: order.id,
      newStatus: orderStatus
    });

    const updateData: Record<string, unknown> = {
      status: orderStatus,
      updated_at: new Date().toISOString()
    };

    // Se aprovado, adicionar paid_at
    if (orderStatus === 'PAID') {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      logError('Erro ao atualizar pedido', updateError);
      return createErrorResponse(
        ERROR_CODES.UPDATE_ERROR,
        'Erro ao atualizar pedido',
        500
      );
    }

    logInfo('Pedido atualizado com sucesso', { orderId: order.id });

    // ========================================================================
    // 10. SEND CONFIRMATION EMAIL (se pagamento aprovado)
    // ========================================================================

    if (orderStatus === 'PAID' && order.customer_email) {
      logInfo('Enviando email de confirmação', { email: order.customer_email });

      // Buscar delivery_url do produto
      const { data: product } = await supabase
        .from('products')
        .select('delivery_url')
        .eq('id', order.product_id)
        .single();

      try {
        const emailData: PurchaseConfirmationData = {
          customerName: order.customer_name || 'Cliente',
          productName: order.product_name || 'Produto',
          amountCents: order.amount_cents,
          orderId: order.id,
          paymentMethod: 'PIX / Mercado Pago',
          deliveryUrl: product?.delivery_url || undefined,
        };

        const emailResult = await sendEmail({
          to: { email: order.customer_email, name: order.customer_name || undefined },
          subject: `✅ Compra Confirmada - ${order.product_name || 'Seu Pedido'}`,
          htmlBody: getPurchaseConfirmationTemplate(emailData),
          textBody: getPurchaseConfirmationTextTemplate(emailData),
          type: 'transactional',
          clientReference: `order_${order.id}_confirmation`,
        });

        if (emailResult.success) {
          logInfo('✅ Email de confirmação enviado', { messageId: emailResult.messageId });
        } else {
          logWarn('⚠️ Falha ao enviar email (não crítico)', { error: emailResult.error });
        }
      } catch (emailError) {
        logWarn('⚠️ Exceção ao enviar email (não crítico)', emailError);
      }
    }

    // ========================================================================
    // 11. WEBHOOKS ARE TRIGGERED AUTOMATICALLY BY DATABASE TRIGGER
    // ========================================================================

    logInfo('Webhooks serão disparados automaticamente pelo trigger do banco');

    // ========================================================================
    // 12. RETURN SUCCESS
    // ========================================================================

    return createSuccessResponse({
      orderId: order.id,
      status: orderStatus,
      eventType,
      emailSent: orderStatus === 'PAID' && !!order.customer_email,
      version: FUNCTION_VERSION
    });

  } catch (error: any) {
    // ========================================================================
    // GLOBAL ERROR HANDLER
    // ========================================================================

    logError('Erro fatal não tratado', {
      message: error.message,
      stack: error.stack,
    });

    return createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'Erro interno do servidor',
      500
    );
  }
})
