/**
 * Checkout Public Machine Actions
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Extracted action functions for the XState state machine.
 * These are pure functions that can be called from assign() in the machine.
 * 
 * @module checkout-public/machines
 */

import type { CheckoutPublicContext, FormErrors } from "./checkoutPublicMachine.types";
import { validateResolveAndLoadResponse } from "../contracts";
import { mapResolveAndLoad } from "../mappers";

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Maps and transforms validated BFF data to context shape.
 * Called from the validating state's assign action.
 */
export function getValidatedContextData(context: CheckoutPublicContext): Partial<CheckoutPublicContext> {
  const validation = validateResolveAndLoadResponse(context.rawData);
  if (!validation.success) {
    return {};
  }
  
  const mapped = mapResolveAndLoad(validation.data);
  
  return {
    checkout: mapped.checkout,
    product: mapped.product,
    offer: mapped.offer,
    orderBumps: mapped.orderBumps,
    affiliate: mapped.affiliate,
    design: mapped.design,
    resolvedGateways: mapped.resolvedGateways,
    selectedPaymentMethod: mapped.product.default_payment_method,
    loadedAt: Date.now(),
    retryCount: 0,
  };
}

// ============================================================================
// FORM HELPERS
// ============================================================================

/**
 * Toggles a bump ID in the selectedBumps array.
 * Returns new array (immutable).
 */
export function toggleBumpInArray(selectedBumps: string[], bumpId: string): string[] {
  const currentBumps = new Set(selectedBumps);
  if (currentBumps.has(bumpId)) {
    currentBumps.delete(bumpId);
  } else {
    currentBumps.add(bumpId);
  }
  return Array.from(currentBumps);
}

/**
 * Removes a specific key from form errors object.
 * Returns new object (immutable).
 * Uses string for field to handle dynamic form fields.
 */
export function removeFieldError(formErrors: FormErrors, field: string): FormErrors {
  const result = { ...formErrors };
  const key = field as keyof FormErrors;
  if (key in result) {
    delete result[key];
  }
  return result;
}

// ============================================================================
// ERROR CREATORS
// ============================================================================

/**
 * Creates a FETCH_FAILED error
 */
export function createFetchError(message: string) {
  return {
    reason: 'FETCH_FAILED' as const,
    message: message || "Erro ao carregar checkout",
  };
}

/**
 * Creates a NETWORK_ERROR error
 */
export function createNetworkError(error: unknown) {
  return {
    reason: 'NETWORK_ERROR' as const,
    message: String(error) || "Erro de rede",
  };
}

/**
 * Creates a VALIDATION_FAILED error
 */
export function createValidationError() {
  return {
    reason: 'VALIDATION_FAILED' as const,
    message: "Dados do checkout inválidos",
  };
}

/**
 * Creates a SUBMIT_FAILED error
 */
export function createSubmitError(message: string) {
  return {
    reason: 'SUBMIT_FAILED' as const,
    message,
  };
}

/**
 * Creates a PAYMENT_FAILED error
 */
export function createPaymentError(message: string) {
  return {
    reason: 'PAYMENT_FAILED' as const,
    message,
  };
}

/**
 * Creates a payment timeout error
 */
export function createPaymentTimeoutError() {
  return {
    reason: 'PAYMENT_FAILED' as const,
    message: "Tempo de pagamento expirado",
  };
}
