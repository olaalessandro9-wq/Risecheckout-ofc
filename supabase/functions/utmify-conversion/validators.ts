/**
 * UTMify Conversion Validators
 * 
 * @module utmify-conversion/validators
 * @version 2.1.0 - RISE Protocol V3 Compliant
 * 
 * Validação de campos obrigatórios conforme documentação UTMify
 * 
 * Mudanças V2.1.0:
 * - Suporte a payload aninhado (orderData) do frontend
 * - Normalização automática antes da validação
 */

import type { UTMifyConversionRequest, FrontendUTMifyRequest } from "./types.ts";

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  /** Payload normalizado (flat) para uso interno */
  normalizedPayload?: UTMifyConversionRequest;
}

// ============================================================================
// PAYLOAD NORMALIZATION
// ============================================================================

/**
 * Detecta se o payload vem do frontend com orderData aninhado
 */
function hasFrontendStructure(data: Record<string, unknown>): boolean {
  return (
    typeof data.vendorId === "string" &&
    typeof data.orderData === "object" &&
    data.orderData !== null
  );
}

/**
 * Normaliza o payload do frontend para o formato interno esperado
 * Se o payload já estiver flat, retorna como está
 */
export function normalizePayload(data: Record<string, unknown>): Record<string, unknown> {
  if (hasFrontendStructure(data)) {
    const orderData = data.orderData as Record<string, unknown>;
    return {
      vendorId: data.vendorId,
      orderId: orderData.orderId,
      paymentMethod: orderData.paymentMethod || "pix",
      status: orderData.status,
      createdAt: orderData.createdAt,
      approvedDate: orderData.approvedDate,
      refundedAt: orderData.refundedAt,
      customer: orderData.customer,
      products: orderData.products,
      trackingParameters: orderData.trackingParameters,
      commission: orderData.commission || {
        totalPriceInCents: orderData.totalPriceInCents,
        gatewayFeeInCents: 0,
        userCommissionInCents: orderData.totalPriceInCents,
        currency: "BRL",
      },
      isTest: orderData.isTest,
    };
  }
  return data;
}

// ============================================================================
// VALIDATORS
// ============================================================================

/**
 * Valida se o request contém todos os campos obrigatórios
 * Aceita tanto payload flat quanto aninhado (orderData do frontend)
 */
export function validateRequest(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Request body must be an object"] };
  }

  // Normalizar payload (extrair de orderData se necessário)
  const normalized = normalizePayload(data as Record<string, unknown>);
  const request = normalized;

  // Campos obrigatórios de nível raiz
  if (!request.orderId || typeof request.orderId !== "string") {
    errors.push("orderId is required and must be a string");
  }

  if (!request.vendorId || typeof request.vendorId !== "string") {
    errors.push("vendorId is required and must be a string");
  }

  if (!request.paymentMethod || typeof request.paymentMethod !== "string") {
    errors.push("paymentMethod is required and must be a string");
  }

  if (!request.status || typeof request.status !== "string") {
    errors.push("status is required and must be a string");
  }

  if (!request.createdAt || typeof request.createdAt !== "string") {
    errors.push("createdAt is required and must be a string");
  }

  // Validar customer
  if (!request.customer || typeof request.customer !== "object") {
    errors.push("customer object is required");
  } else {
    const customer = request.customer as Record<string, unknown>;
    if (!customer.name || typeof customer.name !== "string") {
      errors.push("customer.name is required and must be a string");
    }
    if (!customer.email || typeof customer.email !== "string") {
      errors.push("customer.email is required and must be a string");
    }
  }

  // Validar products
  if (!request.products || !Array.isArray(request.products)) {
    errors.push("products must be a non-empty array");
  } else if (request.products.length === 0) {
    errors.push("products array cannot be empty");
  } else {
    for (let i = 0; i < request.products.length; i++) {
      const product = request.products[i] as Record<string, unknown>;
      if (!product.id || typeof product.id !== "string") {
        errors.push(`products[${i}].id is required and must be a string`);
      }
      if (!product.name || typeof product.name !== "string") {
        errors.push(`products[${i}].name is required and must be a string`);
      }
      if (typeof product.priceInCents !== "number") {
        errors.push(`products[${i}].priceInCents is required and must be a number`);
      }
    }
  }

  // Validar commission
  if (!request.commission || typeof request.commission !== "object") {
    errors.push("commission object is required");
  } else {
    const commission = request.commission as Record<string, unknown>;
    if (typeof commission.totalPriceInCents !== "number") {
      errors.push("commission.totalPriceInCents is required and must be a number");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    normalizedPayload: errors.length === 0 ? (normalized as unknown as UTMifyConversionRequest) : undefined,
  };
}

/**
 * Valida formato de UUID
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Type guard para UTMifyConversionRequest
 */
export function isValidConversionRequest(data: unknown): data is UTMifyConversionRequest {
  const result = validateRequest(data);
  return result.valid;
}
