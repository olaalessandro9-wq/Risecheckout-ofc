/**
 * Response Builder Handler - asaas-create-payment
 * 
 * Responsável por construir respostas padronizadas
 */

import { PUBLIC_CORS_HEADERS } from "../../_shared/cors.ts";

export const corsHeaders = PUBLIC_CORS_HEADERS;

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
export function createSuccessResponse(data: {
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
}): Response {
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

  console.log('[asaas-create-payment] ✅ Sucesso');

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
  statusCode: number = 400
): Response {
  return new Response(
    JSON.stringify({ success: false, error }),
    { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Cria resposta de rate limit
 */
export function createRateLimitResponse(retryAfter?: string | number): Response {
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
