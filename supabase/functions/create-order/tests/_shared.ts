/**
 * Shared Test Utilities - create-order
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Centralized test utilities for create-order Edge Function.
 * 
 * @module create-order/tests/_shared
 * @version 1.0.0
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
  createMockProduct,
  createMockOrder,
  createMockRequest,
  createAuthenticatedRequest,
  generateId,
  
  // Mock responses
  jsonResponse,
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  corsOptionsResponse,
  createCorsHeaders,
  defaultCorsHeaders,
} from "../../_shared/testing/mod.ts";

// ============================================================================
// FUNCTION-SPECIFIC CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "create-order";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateOrderRequest {
  product_id: string;
  checkout_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_cpf?: string;
  gateway: "MERCADOPAGO" | "PUSHINPAY" | "STRIPE" | "ASAAS";
  payment_method: "pix" | "credit_card" | "boleto";
  affiliate_code?: string;
  coupon_code?: string;
  order_bumps?: string[];
}

export interface CreateOrderResponse {
  success: boolean;
  order_id: string;
  payment_data?: {
    qr_code?: string;
    qr_code_base64?: string;
    payment_url?: string;
    expires_at?: string;
  };
  error?: string;
}

// ============================================================================
// PAYLOAD FACTORIES
// ============================================================================

/**
 * Creates a valid create-order request payload
 */
export function createValidPayload(overrides?: Partial<CreateOrderRequest>): CreateOrderRequest {
  return {
    product_id: "dc29b022-5dff-4175-9228-6a0449523707",
    checkout_id: "1e1bb5ef-451f-4260-b7b5-7abd514691a0",
    customer_name: "Test Customer",
    customer_email: "test@example.com",
    customer_phone: "11999999999",
    customer_cpf: "12345678900",
    gateway: "MERCADOPAGO",
    payment_method: "credit_card",
    ...overrides,
  };
}

/**
 * Creates a PIX payment payload
 */
export function createPixPayload(overrides?: Partial<CreateOrderRequest>): CreateOrderRequest {
  return createValidPayload({
    gateway: "PUSHINPAY",
    payment_method: "pix",
    ...overrides,
  });
}

/**
 * Creates an invalid payload (missing required fields)
 */
export function createInvalidPayload(): Partial<CreateOrderRequest> {
  return {
    customer_name: "Test",
    // Missing: product_id, checkout_id, customer_email, gateway, payment_method
  };
}

/**
 * Creates a payload with affiliate code
 */
export function createAffiliatePayload(affiliateCode: string): CreateOrderRequest {
  return createValidPayload({
    affiliate_code: affiliateCode,
  });
}

/**
 * Creates a payload with coupon code
 */
export function createCouponPayload(couponCode: string): CreateOrderRequest {
  return createValidPayload({
    coupon_code: couponCode,
  });
}

// ============================================================================
// HEADER FACTORIES
// ============================================================================

/**
 * Creates headers for authenticated requests
 */
export function createHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Origin": "http://localhost:5173",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Creates headers with anon key
 */
export function createAnonHeaders(anonKey: string): Record<string, string> {
  return createHeaders(anonKey);
}
