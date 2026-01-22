/**
 * Response Builder Handler - asaas-create-payment
 * 
 * RISE ARCHITECT PROTOCOL V3 - CORS V2 Compliant
 * 
 * Responsável por construir respostas padronizadas.
 * Todas as funções recebem corsHeaders como parâmetro para suportar
 * CORS dinâmico (handleCorsV2) em vez de wildcards estáticos.
 * 
 * @module asaas-create-payment/response-builder
 */

import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("asaas-create-payment");

/**
 * Mapeia status do Asaas para status interno
 */
export function mapAsaasStatus(asaasStatus: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'pending',
    'RECEIVED': 'approved',
    'CONFIRMED': 'approved',
    'OVERDUE': 'expired',
    'REFUNDED': 'refunded',
    'RECEIVED_IN_CASH': 'approved'
  };
  return statusMap[asaasStatus] || 'pending';
}

/**
 * Cria resposta de sucesso
 */
export function createSuccessResponse(
  data: {
    chargeId: string;
    status: string;
    qrCode?: string;
    qrCodeText?: string;
    splitApplied: boolean;
    platformFeeCents: number;
    affiliateCommissionCents: number;
    vendorNetCents: number;
    hasAffiliate: boolean;
    rawResponse: Record<string, unknown>;
  },
  corsHeaders: Record<string, string>
): Response {
  const response = {
    success: true,
    transactionId: data.chargeId,
    status: mapAsaasStatus(data.status),
    qrCode: data.qrCode,
    qrCodeText: data.qrCodeText,
    splitApplied: data.splitApplied,
    splitDetails: {
      platformFeeCents: data.platformFeeCents,
      affiliateCommissionCents: data.affiliateCommissionCents,
      vendorNetCents: data.vendorNetCents,
      hasAffiliate: data.hasAffiliate
    },
    rawResponse: data.rawResponse
  };

  log.info('✅ Sucesso');

  return new Response(
    JSON.stringify(response),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Cria resposta de erro
 */
export function createErrorResponse(
  error: string,
  statusCode: number = 400,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ success: false, error }),
    { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Cria resposta de rate limit
 */
export function createRateLimitResponse(
  retryAfter: string | number | undefined,
  corsHeaders: Record<string, string>
): Response {
  // Handle both string (ISO timestamp) and number (seconds) formats
  let retryAfterSeconds: number;
  if (typeof retryAfter === 'string') {
    // Parse ISO timestamp and calculate seconds from now
    const retryDate = new Date(retryAfter);
    retryAfterSeconds = Math.max(0, Math.ceil((retryDate.getTime() - Date.now()) / 1000));
  } else {
    retryAfterSeconds = retryAfter || 60;
  }
  
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
      retryAfter: retryAfterSeconds
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': retryAfterSeconds.toString(),
        'X-RateLimit-Remaining': '0'
      }
    }
  );
}
