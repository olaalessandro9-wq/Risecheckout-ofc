/**
 * Shared utilities for order-bump-crud tests
 * @module order-bump-crud/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";

// ============================================
// CONFIGURATION
// ============================================

export const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
export const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
export const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/order-bump-crud`;

// ============================================
// CONSTANTS
// ============================================

export const VALID_ACTIONS = ["create", "update", "delete", "reorder"];
export const RATE_LIMITED_ACTIONS = ["create", "update", "reorder"];

// ============================================
// TYPES
// ============================================

export interface OrderBumpPayload {
  action?: string;
  id?: string;
  order_bump_id?: string;
  orderBumpId?: string;
  parent_product_id?: string;
  checkout_id?: string;
  checkoutId?: string;
  product_id?: string;
  offer_id?: string;
  active?: boolean;
  discount_enabled?: boolean;
  original_price?: number;
  discount_price?: number;
  call_to_action?: string;
  custom_title?: string;
  custom_description?: string;
  show_image?: boolean;
  orderedIds?: string[];
}

export interface OrderBump {
  id: string;
  parent_product_id: string;
  checkout_id?: string | null;
  product_id: string;
  offer_id: string;
  active: boolean;
  discount_enabled?: boolean;
  original_price?: number;
  position?: number;
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

export function getActionFromBody(body: OrderBumpPayload, pathAction: string): string {
  return body.action ?? pathAction;
}

export function getOrderBumpId(body: OrderBumpPayload): string | undefined {
  return body.order_bump_id ?? body.orderBumpId ?? body.id;
}

export function getOriginalPrice(body: OrderBumpPayload): number | undefined {
  return body.original_price ?? body.discount_price;
}

export function isValidOriginalPrice(discountEnabled: boolean, originalPrice: number | undefined): boolean {
  return !discountEnabled || (typeof originalPrice === "number" && originalPrice > 0);
}

export function sanitizeText(value: string | undefined): string | null {
  return value?.trim() || null;
}

export function isProductOwner(product: { user_id: string }, producerId: string): boolean {
  return product.user_id === producerId;
}
