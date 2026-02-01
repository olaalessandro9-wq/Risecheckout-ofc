/**
 * Shared utilities for checkout-crud tests
 * @module checkout-crud/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { getTestConfig } from "../../_shared/testing/mod.ts";

// ============================================
// CONFIGURATION (Centralized via getTestConfig)
// ============================================

const config = getTestConfig();

export const FUNCTION_NAME = "checkout-crud";
export const FUNCTION_URL = config.supabaseUrl
  ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
  : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;

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
