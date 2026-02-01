/**
 * Shared Test Utilities - pushinpay-webhook
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module pushinpay-webhook/tests/_shared
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
  unitTestOptions,
  integrationTestOptions,
  
  // Mock Supabase
  createMockSupabaseClient,
  createMockDataStore,
  createMockOrder,
  createMockPaidOrder,
  createMockPixOrder,
  
  // Mock HTTP
  FetchMock,
  
  // Mock responses
  jsonResponse,
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  corsOptionsResponse,
  PushinPayResponses,
} from "../../_shared/testing/mod.ts";

// ============================================================================
// FUNCTION-SPECIFIC CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "pushinpay-webhook";
export const WEBHOOK_TOKEN = "test-pushinpay-webhook-token-123";

// ============================================================================
// TYPES
// ============================================================================

export type PushinPayStatus = "created" | "paid" | "canceled" | "expired";

export interface PushinPayWebhookPayload {
  id: string;
  status: PushinPayStatus;
  value?: number;
  payer_name?: string | null;
  payer_national_registration?: string | null;
}

// ============================================================================
// STATUS MAPPING (Hotmart/Kiwify Model)
// ============================================================================

/**
 * Maps PushinPay status to order status following Hotmart/Kiwify model:
 * - paid → status: 'paid'
 * - expired/canceled → status stays 'pending', technical_status updated
 */
export const STATUS_MAPPING: Record<PushinPayStatus, { orderStatus: string; technicalStatus?: string }> = {
  created: { orderStatus: "PENDING" },
  paid: { orderStatus: "PAID" },
  canceled: { orderStatus: "PENDING", technicalStatus: "pix_canceled" },
  expired: { orderStatus: "PENDING", technicalStatus: "pix_expired" },
};

// ============================================================================
// PAYLOAD FACTORIES
// ============================================================================

/**
 * Creates a valid webhook payload
 */
export function createValidPayload(overrides?: Partial<PushinPayWebhookPayload>): PushinPayWebhookPayload {
  return {
    id: "pix-test-123",
    status: "paid",
    value: 10000,
    payer_name: "Test User",
    payer_national_registration: "12345678901",
    ...overrides,
  };
}

/**
 * Creates a paid payload
 */
export function createPaidPayload(pixId?: string): PushinPayWebhookPayload {
  return createValidPayload({ id: pixId ?? "pix-paid-123", status: "paid" });
}

/**
 * Creates an expired payload
 */
export function createExpiredPayload(pixId?: string): PushinPayWebhookPayload {
  return createValidPayload({ id: pixId ?? "pix-expired-123", status: "expired" });
}

/**
 * Creates a canceled payload
 */
export function createCanceledPayload(pixId?: string): PushinPayWebhookPayload {
  return createValidPayload({ id: pixId ?? "pix-canceled-123", status: "canceled" });
}

/**
 * Creates a created (pending) payload
 */
export function createCreatedPayload(pixId?: string): PushinPayWebhookPayload {
  return createValidPayload({ id: pixId ?? "pix-created-123", status: "created" });
}

/**
 * Creates an empty payload
 */
export function createEmptyPayload(): Record<string, never> {
  return {};
}

/**
 * Creates a payload without ID
 */
export function createPayloadWithoutId(): Omit<PushinPayWebhookPayload, "id"> {
  return {
    status: "paid",
    value: 10000,
  };
}

// ============================================================================
// REQUEST FACTORIES
// ============================================================================

/**
 * Creates headers for authenticated webhook request
 */
export function createAuthHeaders(token?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-pushinpay-token": token ?? WEBHOOK_TOKEN,
  };
}

/**
 * Creates headers without token
 */
export function createUnauthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

// ============================================================================
// MOCK ORDER HELPERS
// ============================================================================

/**
 * Creates a mock order matching a PIX ID
 */
export function createOrderForPixId(pixId: string, status: string = "pending"): Record<string, unknown> {
  return {
    id: `order-${pixId}`,
    pix_id: pixId.toLowerCase(),
    status,
    vendor_id: "vendor-123",
    customer_email: "customer@test.com",
    customer_name: null,
    product_id: "product-123",
    product_name: "Test Product",
    amount_cents: 10000,
    offer_id: "offer-123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
