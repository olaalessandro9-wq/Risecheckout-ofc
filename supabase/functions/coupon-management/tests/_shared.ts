/**
 * Shared utilities for coupon-management tests
 * @module coupon-management/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================
// CONFIGURATION (Hardcoded for unit tests - no dotenv dependency)
// ============================================

export const SUPABASE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdmJ0bXRncHN4dXBmand3b3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3Mjg2NzIsImV4cCI6MjA4MTA4ODY3Mn0.h8HDRdHaVTZpZLqBxj7bODaUPCox2h6HF_3U1xfbSXY";
export const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/coupon-management`;

// ============================================
// CONSTANTS
// ============================================

export const VALID_ACTIONS = ["create", "update", "delete", "list"];
export const DISCOUNT_TYPES = ["percentage", "fixed"];

// ============================================
// TYPES
// ============================================

export interface CouponPayload {
  action?: string;
  productId?: string;
  couponId?: string;
  coupon?: CouponData;
}

export interface CouponData {
  code?: string;
  name?: string;
  description?: string;
  discount_type?: string;
  discount_value?: number;
  active?: boolean;
  max_uses?: number;
  max_uses_per_customer?: number;
  uses_count?: number;
  start_date?: string;
  expires_at?: string;
  apply_to_order_bumps?: boolean;
}

export interface CouponProductLink {
  coupon_id: string;
  product_id: string;
}

// ============================================
// HELPERS
// ============================================

export function isValidAction(action: string): boolean {
  return VALID_ACTIONS.includes(action);
}

export function isValidDiscountType(type: string): boolean {
  return DISCOUNT_TYPES.includes(type);
}

export function getActionFromBody(body: CouponPayload, urlAction: string): string {
  const bodyAction = typeof body.action === "string" ? body.action : null;
  return bodyAction ?? urlAction;
}

export function isValidPercentage(value: number): boolean {
  return value > 0 && value <= 100;
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function convertReaisToCents(reais: number): number {
  return Math.round(reais * 100);
}
