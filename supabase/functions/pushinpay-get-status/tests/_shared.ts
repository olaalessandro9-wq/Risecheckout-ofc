/**
 * Shared Test Utilities - pushinpay-get-status
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module pushinpay-get-status/tests/_shared
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

export const FUNCTION_NAME = "pushinpay-get-status";

// ============================================================================
// TYPES
// ============================================================================

export type PushinPayStatus = "created" | "paid" | "cancelled" | "expired" | "pending";

export interface GetStatusRequest {
  orderId: string;
}

export interface GetStatusResponse {
  success: boolean;
  status?: string;
  rawStatus?: string;
  isPaid?: boolean;
  paidAt?: string;
  payerName?: string;
  payerDocument?: string;
  endToEndId?: string;
  message?: string;
  error?: string;
}

export interface PushinPayApiStatusResponse {
  id: string;
  status: string;
  value: number;
  paid_at?: string;
  payer_name?: string;
  payer_document?: string;
  end_to_end_id?: string;
  created_at: string;
  expires_at: string;
}

// ============================================================================
// STATUS MAPPING
// ============================================================================

export const STATUS_MAPPING: Record<string, string> = {
  paid: "paid",
  approved: "paid",
  confirmed: "paid",
  cancelled: "cancelled",
  canceled: "cancelled",
  expired: "cancelled",
  pending: "pending",
  waiting: "pending",
  processing: "pending",
  created: "pending",
};

// ============================================================================
// PAYLOAD FACTORIES
// ============================================================================

/**
 * Creates a valid get status request
 */
export function createValidRequest(orderId?: string): GetStatusRequest {
  return {
    orderId: orderId ?? "order-test-123",
  };
}

/**
 * Creates an empty request
 */
export function createEmptyRequest(): Record<string, never> {
  return {};
}

/**
 * Creates a request without orderId
 */
export function createRequestWithoutOrderId(): Record<string, unknown> {
  return { someOtherField: "value" };
}

// ============================================================================
// API RESPONSE FACTORIES
// ============================================================================

/**
 * Creates a paid status response from PushinPay API
 */
export function createPaidApiResponse(pixId?: string): PushinPayApiStatusResponse {
  return {
    id: pixId ?? "pix-test-123",
    status: "paid",
    value: 10000,
    paid_at: new Date().toISOString(),
    payer_name: "João Silva",
    payer_document: "12345678901",
    end_to_end_id: "E123456789",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  };
}

/**
 * Creates a pending status response from PushinPay API
 */
export function createPendingApiResponse(pixId?: string): PushinPayApiStatusResponse {
  return {
    id: pixId ?? "pix-test-123",
    status: "pending",
    value: 10000,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  };
}

/**
 * Creates an expired status response from PushinPay API
 */
export function createExpiredApiResponse(pixId?: string): PushinPayApiStatusResponse {
  return {
    id: pixId ?? "pix-test-123",
    status: "expired",
    value: 10000,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    expires_at: new Date(Date.now() - 3600000).toISOString(),
  };
}

// ============================================================================
// EDGE FUNCTION RESPONSE FACTORIES
// ============================================================================

/**
 * Creates a success response for paid status
 */
export function createPaidStatusResponse(): GetStatusResponse {
  return {
    success: true,
    status: "paid",
    rawStatus: "paid",
    isPaid: true,
    paidAt: new Date().toISOString(),
    payerName: "João Silva",
    payerDocument: "12345678901",
    endToEndId: "E123456789",
  };
}

/**
 * Creates a success response for pending status
 */
export function createPendingStatusResponse(): GetStatusResponse {
  return {
    success: true,
    status: "pending",
    rawStatus: "pending",
    isPaid: false,
  };
}

/**
 * Creates a success response for order without pix_id
 */
export function createNoPixIdResponse(): GetStatusResponse {
  return {
    success: true,
    status: "unknown",
    message: "PIX ainda não foi gerado para este pedido",
  };
}

/**
 * Creates an error response
 */
export function createErrorResponse(message: string): GetStatusResponse {
  return {
    success: false,
    error: message,
  };
}

// ============================================================================
// MOCK ORDER HELPERS
// ============================================================================

/**
 * Creates a mock order with pix_id
 */
export function createOrderWithPix(
  orderId: string = "order-test-123",
  pixId: string = "pix-test-123",
  status: string = "pending"
): Record<string, unknown> {
  return {
    id: orderId,
    vendor_id: "vendor-123",
    pix_id: pixId,
    status,
    pix_status: "pending",
    amount_cents: 10000,
    customer_email: "customer@test.com",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Creates a mock order without pix_id
 */
export function createOrderWithoutPix(
  orderId: string = "order-test-123",
  status: string = "pending"
): Record<string, unknown> {
  return {
    id: orderId,
    vendor_id: "vendor-123",
    pix_id: null,
    status,
    pix_status: null,
    amount_cents: 10000,
    customer_email: "customer@test.com",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
