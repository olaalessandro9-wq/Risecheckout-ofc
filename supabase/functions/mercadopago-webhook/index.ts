/**
 * ============================================================================
 * MERCADOPAGO-WEBHOOK EDGE FUNCTION
 * ============================================================================
 * 
 * Versão: 145 (CREDENTIALS FIX)
 * Última Atualização: 2025-12-31
 * Status: ✅ Credenciais Centralizadas via getGatewayCredentials
 * 
 * ============================================================================
 * MUDANÇAS NESTA VERSÃO (v145)
 * ============================================================================
 * 
 * 🔧 CORREÇÃO CRÍTICA DE CREDENCIAIS:
 * - Refatorada lógica de obtenção de credenciais para usar getGatewayCredentials
 * - Agora busca accessToken corretamente do Supabase Vault (produção/OAuth)
 * - Elimina duplicidade de código com mercadopago-create-payment
 * 
 * ANTES (v144): Buscava accessToken apenas de vendor_integrations.config
 *               Falhava para vendedores conectados via OAuth (produção)
 * 
 * AGORA (v145): Usa getGatewayCredentials que busca de múltiplas fontes:
 *               - Secrets globais (Owner)
 *               - vendor_integrations.config (Sandbox)
 *               - Supabase Vault (Produção/OAuth)
 * 
 * ============================================================================
 * HISTÓRICO
 * ============================================================================
 * v144 (2025-12-12): Validação rigorosa de assinatura HMAC-SHA256
 * v145 (2025-12-31): Credenciais centralizadas via getGatewayCredentials
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { rateLimitMiddleware, getIdentifier } from '../_shared/rate-limit.ts';
import { sendOrderConfirmationEmails, type OrderData } from '../_shared/send-order-emails.ts';
import { getGatewayCredentials, validateCredentials } from '../_shared/platform-config.ts';

// Versão da função - SEMPRE incrementar ao fazer mudanças significativas
const FUNCTION_VERSION = "145";

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
    // 5. FETCH MERCADO PAGO CREDENTIALS (v145: Usando getGatewayCredentials centralizado)
    // ========================================================================

    logInfo('Buscando credenciais via getGatewayCredentials', { vendorId });

    let accessToken: string | undefined;
    
    try {
      const credentialsResult = await getGatewayCredentials(supabase, vendorId, 'mercadopago');
      const validation = validateCredentials('mercadopago', credentialsResult.credentials);

      if (!validation.valid) {
        logError('🔴 Credenciais incompletas', { 
          vendorId, 
          missingFields: validation.missingFields,
          source: credentialsResult.source 
        });
        return createSuccessResponse({ message: 'Credenciais incompletas para o vendedor' });
      }

      accessToken = credentialsResult.credentials.accessToken;
      
      logInfo('✅ Credenciais obtidas com sucesso', { 
        source: credentialsResult.source,
        isOwner: credentialsResult.isOwner,
        environment: credentialsResult.credentials.environment
      });

    } catch (credError: any) {
      logError('🔴 Falha ao obter credenciais do Mercado Pago', { 
        vendorId, 
        error: credError.message 
      });
      // Retorna 200 para não gerar retries do MP, mas registra o erro
      return createSuccessResponse({ message: 'Falha ao obter credenciais do gateway' });
    }

    if (!accessToken) {
      logError('🔴 Access token não encontrado mesmo após busca centralizada', { vendorId });
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
    // 10. SEND CONFIRMATION EMAILS (um para cada item do pedido)
    // ========================================================================

    if (orderStatus === 'PAID' && order.customer_email) {
      logInfo('Enviando emails de confirmação para todos os itens do pedido', { 
        orderId: order.id,
        email: order.customer_email 
      });

      try {
        const orderData: OrderData = {
          id: order.id,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          amount_cents: order.amount_cents,
          product_id: order.product_id,
          product_name: order.product_name,
        };

        const emailResult = await sendOrderConfirmationEmails(
          supabase,
          orderData,
          'PIX / Mercado Pago'
        );

        logInfo('✅ Resultado do envio de emails', {
          totalItems: emailResult.totalItems,
          emailsSent: emailResult.emailsSent,
          emailsFailed: emailResult.emailsFailed
        });
      } catch (emailError) {
        logWarn('⚠️ Exceção ao enviar emails (não crítico)', emailError);
      }
    }

    // ========================================================================
    // 11. TRIGGER VENDOR WEBHOOKS EXPLICITLY
    // ========================================================================

    // O trigger automático do banco não está funcionando consistentemente,
    // então fazemos a chamada explícita com X-Internal-Secret
    if (eventType) {
      const internalSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');
      if (internalSecret) {
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/trigger-webhooks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Secret': internalSecret,
            },
            body: JSON.stringify({
              order_id: order.id,
              event_type: eventType,
            }),
          });
          logInfo('Resposta trigger-webhooks', { status: webhookResponse.status });
        } catch (e) {
          logWarn('Erro ao disparar webhooks (não crítico)', e);
        }
      } else {
        logWarn('INTERNAL_WEBHOOK_SECRET não configurado - webhooks não serão disparados');
      }
    }

    logInfo('Webhooks disparados explicitamente');

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
