/**
 * ============================================================================
 * WEBHOOK HELPERS - Funções Compartilhadas para Webhooks de Pagamento
 * ============================================================================
 * 
 * Funções utilitárias usadas por múltiplos webhooks de gateway.
 * Centraliza lógica comum para evitar duplicação de código.
 * 
 * Versão: 2.0 (+ Dead Letter Queue)
 * Data de Criação: 2026-01-11
 * ============================================================================
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// TYPES
// ============================================================================

export interface StatusMapping {
  orderStatus: string;
  eventType: string | null;
}

export interface SignatureValidationResult {
  valid: boolean;
  error?: string;
}

export type GatewayType = 'mercadopago' | 'pushinpay' | 'asaas' | 'stripe';

export interface DLQPayload {
  gateway: GatewayType;
  eventType: string;
  payload: unknown;
  headers?: Record<string, string>;
  errorCode: string;
  errorMessage: string;
  orderId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-pushinpay-token, asaas-access-token, stripe-signature'
};

export const ERROR_CODES = {
  PAYMENT_ID_MISSING: 'PAYMENT_ID_MISSING',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  GATEWAY_NOT_CONFIGURED: 'GATEWAY_NOT_CONFIGURED',
  GATEWAY_API_ERROR: 'GATEWAY_API_ERROR',
  UPDATE_ERROR: 'UPDATE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SECRET_NOT_CONFIGURED: 'SECRET_NOT_CONFIGURED',
  MISSING_SIGNATURE_HEADERS: 'MISSING_SIGNATURE_HEADERS',
  INVALID_SIGNATURE_FORMAT: 'INVALID_SIGNATURE_FORMAT',
  WEBHOOK_EXPIRED: 'WEBHOOK_EXPIRED',
  SIGNATURE_MISMATCH: 'SIGNATURE_MISMATCH',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  CIRCUIT_OPEN: 'CIRCUIT_OPEN',
};

export const SIGNATURE_MAX_AGE = 300; // 5 minutos

// ============================================================================
// DEAD LETTER QUEUE
// ============================================================================

/**
 * Salva um webhook falhado na Dead Letter Queue para reprocessamento
 * 
 * @param supabase - Cliente Supabase
 * @param data - Dados do webhook falhado
 */
export async function saveToDeadLetterQueue(
  supabase: SupabaseClient,
  data: DLQPayload
): Promise<void> {
  try {
    // Mascarar headers sensíveis
    const maskedHeaders = data.headers ? maskSensitiveHeaders(data.headers) : null;

    const { error } = await supabase.from('gateway_webhook_dlq').insert({
      gateway: data.gateway,
      event_type: data.eventType,
      payload: data.payload,
      headers: maskedHeaders,
      error_code: data.errorCode,
      error_message: data.errorMessage.substring(0, 1000), // Limitar tamanho
      order_id: data.orderId || null,
      status: 'pending'
    });

    if (error) {
      console.error('[DLQ] Erro ao salvar na DLQ:', error);
    } else {
      console.log(`[DLQ] Webhook salvo na DLQ: ${data.gateway}/${data.eventType}`);
    }
  } catch (dlqError) {
    // Log mas não falha - DLQ é best-effort
    console.error('[DLQ] Exception ao salvar na DLQ:', dlqError);
  }
}

/**
 * Mascara headers sensíveis para armazenamento seguro
 */
function maskSensitiveHeaders(headers: Record<string, string>): Record<string, string> {
  const sensitiveKeys = ['authorization', 'x-pushinpay-token', 'asaas-access-token', 'stripe-signature'];
  const masked: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.includes(lowerKey)) {
      masked[key] = value.length > 8 ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : '***';
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

// ============================================================================
// CRYPTO HELPERS
// ============================================================================

/**
 * Gera assinatura HMAC-SHA256
 */
export async function generateHmacSignature(secret: string, message: string): Promise<string> {
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
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// STATUS MAPPING
// ============================================================================

/**
 * Mapeia status do Mercado Pago para status interno
 */
export function mapMercadoPagoStatus(paymentStatus: string): StatusMapping {
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
      return { orderStatus: 'PENDING', eventType: null };
  }
}

/**
 * Mapeia status do PushinPay para status interno
 */
export function mapPushinPayStatus(status: string): StatusMapping {
  switch (status) {
    case 'paid':
      return { orderStatus: 'PAID', eventType: 'purchase_approved' };
    case 'expired':
      return { orderStatus: 'EXPIRED', eventType: null };
    case 'canceled':
      return { orderStatus: 'CANCELLED', eventType: null };
    case 'created':
      return { orderStatus: 'PENDING', eventType: null };
    default:
      return { orderStatus: 'PENDING', eventType: null };
  }
}

/**
 * Mapeia status do Asaas para status interno
 */
export function mapAsaasStatus(status: string): StatusMapping {
  const statusMap: Record<string, string> = {
    'PENDING': 'PENDING',
    'RECEIVED': 'PAID',
    'CONFIRMED': 'PAID',
    'OVERDUE': 'EXPIRED',
    'REFUNDED': 'REFUNDED',
    'RECEIVED_IN_CASH': 'PAID',
    'REFUND_REQUESTED': 'REFUND_REQUESTED',
    'REFUND_IN_PROGRESS': 'REFUND_IN_PROGRESS',
    'CHARGEBACK_REQUESTED': 'CHARGEBACK',
    'CHARGEBACK_DISPUTE': 'CHARGEBACK_DISPUTE',
    'AWAITING_RISK_ANALYSIS': 'PENDING',
    'DUNNING_REQUESTED': 'PENDING',
    'DUNNING_RECEIVED': 'PAID'
  };

  const orderStatus = statusMap[status] || 'PENDING';
  let eventType: string | null = null;

  if (orderStatus === 'PAID') {
    eventType = 'purchase_approved';
  } else if (orderStatus === 'REFUNDED') {
    eventType = 'purchase_refunded';
  } else if (orderStatus === 'PENDING') {
    eventType = 'pix_generated';
  }

  return { orderStatus, eventType };
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Cria resposta de sucesso padronizada
 */
export function createSuccessResponse(data: unknown): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

/**
 * Cria resposta de erro padronizada
 */
export function createErrorResponse(code: string, message: string, status: number): Response {
  return new Response(
    JSON.stringify({ success: false, error: message, code }),
    {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status,
    }
  );
}

// ============================================================================
// LOGGING FACTORY
// ============================================================================

export interface Logger {
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, error?: unknown) => void;
}

/**
 * Cria logger com prefixo do webhook
 */
export function createLogger(functionName: string, version: string): Logger {
  return {
    info: (message: string, data?: unknown) => {
      console.log(`[${functionName}] [v${version}] [INFO] ${message}`, data ? JSON.stringify(data) : '');
    },
    warn: (message: string, data?: unknown) => {
      console.warn(`[${functionName}] [v${version}] [WARN] ${message}`, data ? JSON.stringify(data) : '');
    },
    error: (message: string, error?: unknown) => {
      console.error(`[${functionName}] [v${version}] [ERROR] ${message}`, error);
    },
  };
}
