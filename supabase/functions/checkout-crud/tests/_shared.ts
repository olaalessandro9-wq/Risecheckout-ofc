/**
 * Shared utilities for checkout-crud tests
 * @module checkout-crud/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================
// CONFIGURATION (Hardcoded for unit tests - no dotenv dependency)
// ============================================

export const SUPABASE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdmJ0bXRncHN4dXBmand3b3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3Mjg2NzIsImV4cCI6MjA4MTA4ODY3Mn0.h8HDRdHaVTZpZLqBxj7bODaUPCox2h6HF_3U1xfbSXY";
export const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/checkout-crud`;

// ============================================
// CONSTANTS
// ============================================

export const VALID_ACTIONS = ["create", "update", "set-default", "delete", "toggle-link-status"];
export const RATE_LIMITED_ACTIONS = ["create", "update"];
export const CASCADE_DELETE_ORDER = ["checkout_links", "payment_links", "order_bumps", "checkout_rows", "checkouts"];

// ============================================
// TYPES
// ============================================

export interface CheckoutPayload {
  action?: string;
  productId?: string;
  checkoutId?: string;
  checkout_id?: string;
  name?: string;
  offerId?: string;
  isDefault?: boolean;
  linkId?: string;
}

export interface Checkout {
  id: string;
  product_id: string;
  name: string;
  is_default: boolean;
  updated_at?: string;
}

export interface PaymentLink {
  id: string;
  is_original: boolean;
}

// ============================================
// HELPERS
// ============================================

export function isValidAction(action: string): boolean {
  return VALID_ACTIONS.includes(action);
}

export function isRateLimited(action: string): boolean {
  return RATE_LIMITED_ACTIONS.includes(action);
}

export function getActionFromBody(body: CheckoutPayload, pathAction: string): string {
  return body.action ?? pathAction;
}

export function getCheckoutId(body: CheckoutPayload): string | undefined {
  return body.checkout_id ?? body.checkoutId;
}

export function shouldDeletePaymentLink(link: PaymentLink): boolean {
  return link.is_original === false;
}
