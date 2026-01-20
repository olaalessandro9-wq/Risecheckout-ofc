/**
 * Checkout Public Machine Guards
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Pure guard functions for the XState state machine.
 * 
 * @module checkout-public/machines
 */

import type { CheckoutPublicContext } from "./checkoutPublicMachine.types";
import { validateResolveAndLoadResponse } from "../contracts";

// ============================================================================
// RETRY GUARDS
// ============================================================================

const MAX_RETRIES = 3;

export function canRetry({ context }: { context: CheckoutPublicContext }): boolean {
  return context.retryCount < MAX_RETRIES;
}

// ============================================================================
// VALIDATION GUARDS
// ============================================================================

export function isDataValid({ context }: { context: CheckoutPublicContext }): boolean {
  const result = validateResolveAndLoadResponse(context.rawData);
  return result.success;
}

export function hasRequiredFormFields({ context }: { context: CheckoutPublicContext }): boolean {
  const { name, email } = context.formData;
  
  // Basic validation - name and email are always required
  if (!name.trim()) return false;
  if (!email.trim()) return false;
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  // Phone validation (if required)
  if (context.product?.required_fields?.phone) {
    if (!context.formData.phone.trim()) return false;
  }
  
  // CPF validation (if required)
  if (context.product?.required_fields?.cpf) {
    if (!context.formData.cpf.trim()) return false;
  }
  
  return true;
}

export function isFormValid({ context }: { context: CheckoutPublicContext }): boolean {
  return (
    hasRequiredFormFields({ context }) &&
    Object.keys(context.formErrors).length === 0
  );
}

// ============================================================================
// DATA GUARDS
// ============================================================================

export function hasCheckout({ context }: { context: CheckoutPublicContext }): boolean {
  return context.checkout !== null;
}

export function hasProduct({ context }: { context: CheckoutPublicContext }): boolean {
  return context.product !== null;
}

export function isReady({ context }: { context: CheckoutPublicContext }): boolean {
  return context.checkout !== null && context.product !== null && context.design !== null;
}
