/**
 * Shared Test Infrastructure for checkout-public-data
 * 
 * @module checkout-public-data/tests/_shared
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 * RISE Protocol V3 Compliant
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "checkout-public-data";

export const VALID_ACTIONS = [
  "product",
  "offer", 
  "order-bumps",
  "affiliate",
  "resolve-and-load",
  "validate-coupon",
  "checkout",
  "product-pixels",
  "order-by-token",
  "payment-link-data",
  "check-order-payment-status",
  "get-checkout-offer",
  "get-checkout-slug-by-order",
  "all",
] as const;

export type ValidAction = typeof VALID_ACTIONS[number];

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidAction(action: string): action is ValidAction {
  return VALID_ACTIONS.includes(action as ValidAction);
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export interface CheckoutPublicPayload {
  action?: string;
  productId?: string;
  checkoutId?: string;
  affiliateId?: string;
  slug?: string;
  code?: string;
  token?: string;
  linkId?: string;
  orderId?: string;
}

export function createMockRequest(body: CheckoutPublicPayload): Request {
  const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}`;
  return new Request(url, {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
}

export function createMockSupabaseClient(): Record<string, unknown> {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: {}, error: null }),
        }),
      }),
    }),
  };
}

// ============================================================================
// TEST HELPERS
// ============================================================================

export function hasRequiredField(body: Record<string, unknown>, field: string): boolean {
  return field in body && body[field] !== undefined && body[field] !== null;
}
