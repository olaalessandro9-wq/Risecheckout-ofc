/**
 * Shared Test Infrastructure for coupon-read
 * 
 * @module coupon-read/tests/_shared
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 * RISE Protocol V3 Compliant
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "coupon-read";

export const VALID_ACTIONS = ["get-coupon"] as const;

export type ValidAction = typeof VALID_ACTIONS[number];

// ============================================================================
// TYPES
// ============================================================================

export interface CouponPayload {
  action?: string;
  couponId?: string;
}

export interface MockCoupon {
  id: string;
  code: string;
  discount_type?: string;
  discount_value?: number;
  max_uses?: number;
  uses_count?: number;
  expires_at?: string;
  is_active?: boolean;
}

export interface MockCouponProduct {
  product_id: string;
}

export interface MockProduct {
  id: string;
  user_id?: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidAction(action: string): action is ValidAction {
  return VALID_ACTIONS.includes(action as ValidAction);
}

export function hasOwnership(products: MockProduct[], producerId: string): boolean {
  return products.length > 0 && products.some(p => p.user_id === producerId);
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export function createMockRequest(body: CouponPayload): Request {
  const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}`;
  return new Request(url, {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
      "Authorization": "Bearer mock-token",
    }),
    body: JSON.stringify(body),
  });
}

export function createMockCoupon(overrides: Partial<MockCoupon> = {}): MockCoupon {
  return {
    id: "coupon-123",
    code: "SAVE10",
    discount_type: "percentage",
    discount_value: 10,
    max_uses: 100,
    ...overrides,
  };
}

export function createMockProducer(): { id: string; email: string } {
  return { id: "producer-123", email: "test@example.com" };
}
