/**
 * ============================================================================
 * WEBHOOK HELPERS - Funções Compartilhadas para Webhooks de Pagamento
 * ============================================================================
 * 
 * @version 4.0 - RISE Protocol V3 Compliant (Refactored <300 lines)
 * 
 * PADRÃO DE MERCADO: Uma venda pendente NUNCA vira "cancelada".
 * Status expired, cancelled, failed = 'pending' + technical_status atualizado.
 * 
 * @see webhook-dlq.ts for Dead Letter Queue helpers
 * ============================================================================
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger as createCentralLogger } from "./logger.ts";
import { PUBLIC_CORS_HEADERS } from './cors-v2.ts';

const log = createCentralLogger("WebhookHelpers");

// ============================================================================
// TYPES
// ============================================================================

export interface StatusMapping {
  orderStatus: string;
  eventType: string | null;
  technicalStatus?: string;
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

// Re-export for backward compatibility
export { PUBLIC_CORS_HEADERS as CORS_HEADERS };

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

export const SIGNATURE_MAX_AGE = 300;

// ============================================================================
// DEAD LETTER QUEUE
// ============================================================================

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

export async function saveToDeadLetterQueue(
  supabase: SupabaseClient,
  data: DLQPayload
): Promise<void> {
  try {
    const maskedHeaders = data.headers ? maskSensitiveHeaders(data.headers) : null;

    const { error } = await supabase.from('gateway_webhook_dlq').insert({
      gateway: data.gateway,
      event_type: data.eventType,
      payload: data.payload,
      headers: maskedHeaders,
      error_code: data.errorCode,
      error_message: data.errorMessage.substring(0, 1000),
      order_id: data.orderId || null,
      status: 'pending'
    });

    if (error) {
      log.error("Erro ao salvar na DLQ", error);
    } else {
      log.info(`Webhook salvo na DLQ: ${data.gateway}/${data.eventType}`);
    }
  } catch (dlqError) {
    log.error("Exception ao salvar na DLQ", dlqError);
  }
}

// ============================================================================
// CRYPTO HELPERS
// ============================================================================

export async function generateHmacSignature(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// STATUS MAPPING - MODELO HOTMART/KIWIFY
// ============================================================================

export function mapMercadoPagoStatus(paymentStatus: string): StatusMapping {
  switch (paymentStatus) {
    case 'approved':
      return { orderStatus: 'PAID', eventType: 'purchase_approved' };
    case 'pending':
    case 'in_process':
    case 'in_mediation':
      return { orderStatus: 'PENDING', eventType: 'pix_generated' };
    case 'rejected':
      return { orderStatus: 'PENDING', eventType: null, technicalStatus: 'gateway_error' };
    case 'cancelled':
      return { orderStatus: 'PENDING', eventType: null, technicalStatus: 'gateway_cancelled' };
    case 'refunded':
      return { orderStatus: 'REFUNDED', eventType: 'refund' };
    case 'charged_back':
      return { orderStatus: 'CHARGEBACK', eventType: 'chargeback' };
    default:
      return { orderStatus: 'PENDING', eventType: null };
  }
}

export function mapPushinPayStatus(status: string): StatusMapping {
  switch (status) {
    case 'paid':
      return { orderStatus: 'PAID', eventType: 'purchase_approved' };
    case 'expired':
      return { orderStatus: 'PENDING', eventType: null, technicalStatus: 'expired' };
    case 'canceled':
      return { orderStatus: 'PENDING', eventType: null, technicalStatus: 'gateway_cancelled' };
    case 'created':
      return { orderStatus: 'PENDING', eventType: null };
    default:
      return { orderStatus: 'PENDING', eventType: null };
  }
}

export function mapAsaasStatus(status: string): StatusMapping {
  switch (status) {
    case 'PENDING':
    case 'AWAITING_RISK_ANALYSIS':
    case 'DUNNING_REQUESTED':
      return { orderStatus: 'PENDING', eventType: 'pix_generated' };
    case 'RECEIVED':
    case 'CONFIRMED':
    case 'RECEIVED_IN_CASH':
    case 'DUNNING_RECEIVED':
      return { orderStatus: 'PAID', eventType: 'purchase_approved' };
    case 'OVERDUE':
      return { orderStatus: 'PENDING', eventType: null, technicalStatus: 'expired' };
    case 'REFUNDED':
      return { orderStatus: 'REFUNDED', eventType: 'purchase_refunded' };
    case 'REFUND_REQUESTED':
    case 'REFUND_IN_PROGRESS':
      return { orderStatus: 'PENDING', eventType: null, technicalStatus: 'refund_in_progress' };
    case 'CHARGEBACK_REQUESTED':
    case 'CHARGEBACK_DISPUTE':
      return { orderStatus: 'CHARGEBACK', eventType: 'chargeback' };
    default:
      return { orderStatus: 'PENDING', eventType: null };
  }
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export function createSuccessResponse(data: unknown): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...PUBLIC_CORS_HEADERS, 'Content-Type': 'application/json' }, status: 200 }
  );
}

export function createErrorResponse(code: string, message: string, status: number): Response {
  return new Response(
    JSON.stringify({ success: false, error: message, code }),
    { headers: { ...PUBLIC_CORS_HEADERS, 'Content-Type': 'application/json' }, status }
  );
}

// ============================================================================
// LOGGING FACTORY (Re-exports for backward compatibility)
// ============================================================================

export interface Logger {
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, error?: unknown) => void;
}

export function createLogger(functionName: string, version: string): Logger {
  const logger = createCentralLogger(`${functionName}-v${version}`);
  return { info: logger.info, warn: logger.warn, error: logger.error };
}
