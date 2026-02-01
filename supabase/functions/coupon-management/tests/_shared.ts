/**
 * Shared utilities for coupon-management tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Centralized test utilities for coupon-management Edge Function.
 * NO HARDCODED CREDENTIALS - uses centralized test config.
 * 
 * @module coupon-management/tests/_shared
 * @version 2.0.0
 */

// ============================================================================
// RE-EXPORTS FROM CENTRALIZED TESTING
// ============================================================================

export {
  // Test config
  skipIntegration,
  skipContract,
  isCI,
  getTestConfig,
  unitTestOptions,
  integrationTestOptions,
  
  // Mock Supabase
  createMockSupabaseClient,
  createMockDataStore,
  createEmptyDataStore,
  
  // Mock HTTP
  FetchMock,
  
  // Factories
  createMockUser,
  createMockRequest,
  createAuthenticatedRequest,
  generateId,
  
  // Mock responses
  jsonResponse,
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  corsOptionsResponse,
  createCorsHeaders,
  defaultCorsHeaders,
} from "../../_shared/testing/mod.ts";

// ============================================================================
// FUNCTION-SPECIFIC CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "coupon-management";

export const VALID_ACTIONS = ["create", "update", "delete", "list"] as const;
export const DISCOUNT_TYPES = ["percentage", "fixed"] as const;

export type CouponAction = typeof VALID_ACTIONS[number];
export type DiscountType = typeof DISCOUNT_TYPES[number];

// ============================================================================
// TYPES
// ============================================================================

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
  discount_type?: DiscountType;
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

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function isValidAction(action: string): action is CouponAction {
  return VALID_ACTIONS.includes(action as CouponAction);
}

export function isValidDiscountType(type: string): type is DiscountType {
  return DISCOUNT_TYPES.includes(type as DiscountType);
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

// ============================================================================
// PAYLOAD FACTORIES
// ============================================================================

/**
 * Creates a valid coupon data object
 */
export function createValidCouponData(overrides?: Partial<CouponData>): CouponData {
  return {
    code: `TEST${Date.now()}`,
    name: "Test Coupon",
    description: "Test coupon for automated tests",
    discount_type: "percentage",
    discount_value: 10,
    active: true,
    max_uses: 100,
    max_uses_per_customer: 1,
    uses_count: 0,
    apply_to_order_bumps: false,
    ...overrides,
  };
}

/**
 * Creates a list action payload
 */
export function createListPayload(productId: string): CouponPayload {
  return {
    action: "list",
    productId,
  };
}

/**
 * Creates a create action payload
 */
export function createCreatePayload(productId: string, coupon?: Partial<CouponData>): CouponPayload {
  return {
    action: "create",
    productId,
    coupon: createValidCouponData(coupon),
  };
}

/**
 * Creates an update action payload
 */
export function createUpdatePayload(
  couponId: string,
  updates: Partial<CouponData>
): CouponPayload {
  return {
    action: "update",
    couponId,
    coupon: updates,
  };
}

/**
 * Creates a delete action payload
 */
export function createDeletePayload(couponId: string): CouponPayload {
  return {
    action: "delete",
    couponId,
  };
}

// ============================================================================
// HEADER FACTORIES
// ============================================================================

/**
 * Creates headers for authenticated requests
 */
export function createHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "Origin": "http://localhost:5173",
  };
}

/**
 * Creates headers without authentication
 */
export function createUnauthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Origin": "http://localhost:5173",
  };
}

// ============================================================================
// FUNCTION URL BUILDER
// ============================================================================

/**
 * Builds the function URL for a given action
 */
export function buildFunctionUrl(supabaseUrl: string, action?: string): string {
  const baseUrl = `${supabaseUrl}/functions/v1/${FUNCTION_NAME}`;
  return action ? `${baseUrl}/${action}` : baseUrl;
}
