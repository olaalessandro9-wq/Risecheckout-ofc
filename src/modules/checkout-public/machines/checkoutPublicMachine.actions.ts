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
import { isFieldRequired } from "./helpers/requiredFields";

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
    // Phase 2: BFF Unified Data
    productPixels: mapped.productPixels,
    vendorIntegration: mapped.vendorIntegration,
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

import type { ErrorReason } from "./checkoutPublicMachine.types";

/**
 * Creates a FETCH_FAILED error (generic fallback)
 */
export function createFetchError(message: string) {
  return {
    reason: 'FETCH_FAILED' as const,
    message: message || "Erro ao carregar checkout",
  };
}

/**
 * Creates an error from backend response with specific reason.
 * Maps backend reasons to frontend ErrorReason type.
 * All messages in Brazilian Portuguese.
 */
export function createBackendError(error: string, backendReason?: string) {
  // Valid backend reasons that should be preserved
  const validBackendReasons: ErrorReason[] = [
    'NOT_FOUND',
    'NO_CHECKOUT', 
    'INACTIVE', 
    'BLOCKED',
    'CHECKOUT_NOT_FOUND',
  ];
  
  const reason: ErrorReason = (backendReason && validBackendReasons.includes(backendReason as ErrorReason))
    ? (backendReason as ErrorReason)
    : 'FETCH_FAILED';
    
  return {
    reason,
    message: error || "Erro ao carregar checkout",
  };
}

/**
 * Creates a NETWORK_ERROR error with defensive handling.
 * Handles ProgressEvent, Error, string, and other unknown types gracefully.
 */
export function createNetworkError(error: unknown) {
  let message = "Erro de rede";
  
  if (error instanceof Error) {
    message = error.message || "Erro de rede";
  } else if (typeof error === 'string' && error.trim()) {
    message = error;
  }
  // ProgressEvent and other objects without message property fall through to default
  
  return {
    reason: 'NETWORK_ERROR' as const,
    message,
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

// ============================================================================
// FORM VALIDATION
// ============================================================================

/**
 * Validates all required form fields and returns errors.
 * This is the SINGLE SOURCE OF TRUTH for checkout form validation.
 */
export function validateFormFields(context: CheckoutPublicContext): { isValid: boolean; errors: FormErrors } {
  const errors: FormErrors = {};
  const { formData, product } = context;
  const requiredFields = product?.required_fields;
  
  // Nome obrigatório
  if (!formData.name.trim()) {
    errors.name = "Nome é obrigatório";
  }
  
  // Email obrigatório e formato válido
  if (!formData.email.trim()) {
    errors.email = "Email é obrigatório";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Email inválido";
  }
  
  // CPF (se obrigatório) - supports both array and object formats
  if (isFieldRequired(requiredFields, 'cpf') && !formData.cpf.trim()) {
    errors.cpf = "CPF/CNPJ é obrigatório";
  }
  
  // Telefone (se obrigatório) - supports both array and object formats
  if (isFieldRequired(requiredFields, 'phone') && !formData.phone.trim()) {
    errors.phone = "Celular é obrigatório";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
