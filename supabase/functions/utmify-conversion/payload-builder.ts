/**
 * UTMify Payload Builder
 * 
 * @module utmify-conversion/payload-builder
 * @version 2.0.0 - RISE Protocol V3 Compliant
 * 
 * Constrói o payload conforme documentação oficial da API UTMify
 */

import {
  PLATFORM_NAME,
  PaymentMethodMap,
  OrderStatusMap,
  type UTMifyConversionRequest,
  type UTMifyAPIPayload,
  type UTMifyCustomer,
  type UTMifyProduct,
  type UTMifyTrackingParameters,
  type UTMifyCommission,
} from "./types.ts";

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Formata data para o padrão esperado pela API UTMify
 * Formato: "YYYY-MM-DD HH:mm:ss" (UTC)
 */
export function formatDateUTC(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Se a data for inválida, retorna a string original
      return dateString;
    }
    
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return dateString;
  }
}

// ============================================================================
// MAPPERS
// ============================================================================

/**
 * Mapeia o método de pagamento para o formato da API UTMify
 */
export function mapPaymentMethod(method: string): string {
  const normalized = method.toLowerCase().replace(/[^a-z_]/g, "_");
  return PaymentMethodMap[normalized as keyof typeof PaymentMethodMap] || method;
}

/**
 * Mapeia o status do pedido para o formato da API UTMify
 */
export function mapStatus(status: string): string {
  const normalized = status.toLowerCase();
  return OrderStatusMap[normalized as keyof typeof OrderStatusMap] || status;
}

// ============================================================================
// PAYLOAD BUILDER
// ============================================================================

/**
 * Constrói o objeto customer conforme documentação UTMify
 */
function buildCustomer(input: UTMifyConversionRequest["customer"]): UTMifyCustomer {
  return {
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    document: input.document || null,
    country: input.country || "BR",
    ip: input.ip || null,
  };
}

/**
 * Constrói o array de products conforme documentação UTMify
 */
function buildProducts(inputs: UTMifyConversionRequest["products"]): UTMifyProduct[] {
  return inputs.map((p) => ({
    id: p.id,
    name: p.name,
    planId: p.planId || null,
    planName: p.planName || null,
    quantity: p.quantity || 1,
    priceInCents: p.priceInCents,
  }));
}

/**
 * Constrói o objeto trackingParameters conforme documentação UTMify
 */
function buildTrackingParameters(
  input?: UTMifyConversionRequest["trackingParameters"]
): UTMifyTrackingParameters {
  return {
    src: input?.src || null,
    sck: input?.sck || null,
    utm_source: input?.utm_source || null,
    utm_campaign: input?.utm_campaign || null,
    utm_medium: input?.utm_medium || null,
    utm_content: input?.utm_content || null,
    utm_term: input?.utm_term || null,
  };
}

/**
 * Constrói o objeto commission conforme documentação UTMify
 */
function buildCommission(input: UTMifyConversionRequest["commission"]): UTMifyCommission {
  const totalPriceInCents = input.totalPriceInCents;
  return {
    totalPriceInCents,
    gatewayFeeInCents: input.gatewayFeeInCents || 0,
    userCommissionInCents: input.userCommissionInCents || totalPriceInCents,
    currency: input.currency || "BRL",
  };
}

/**
 * Constrói o payload completo conforme documentação oficial da API UTMify
 */
export function buildUTMifyPayload(request: UTMifyConversionRequest): UTMifyAPIPayload {
  return {
    orderId: request.orderId,
    platform: PLATFORM_NAME,
    paymentMethod: mapPaymentMethod(request.paymentMethod),
    status: mapStatus(request.status),
    createdAt: formatDateUTC(request.createdAt),
    approvedDate: request.approvedDate ? formatDateUTC(request.approvedDate) : null,
    refundedAt: request.refundedAt ? formatDateUTC(request.refundedAt) : null,
    customer: buildCustomer(request.customer),
    products: buildProducts(request.products),
    trackingParameters: buildTrackingParameters(request.trackingParameters),
    commission: buildCommission(request.commission),
    isTest: request.isTest || false,
  };
}
