/**
 * Shared Test Utilities - mercadopago-webhook
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module mercadopago-webhook/tests/_shared
 * @version 1.0.0
 */

import { createHmac } from "node:crypto";

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
  
  // Mock HTTP
  FetchMock,
  
  // Mock responses
  jsonResponse,
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
  serverErrorResponse,
  corsOptionsResponse,
  MercadoPagoResponses,
} from "../../_shared/testing/mod.ts";

// ============================================================================
// FUNCTION-SPECIFIC CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "mercadopago-webhook";
export const WEBHOOK_SECRET = "test-mercadopago-webhook-secret";

// ============================================================================
// TYPES
// ============================================================================

export type MercadoPagoPaymentStatus = 
  | "pending"
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";

export interface MercadoPagoWebhookPayload {
  type: string;
  data?: {
    id: string | number;
  };
  action?: string;
}

export interface MercadoPagoPaymentDetails {
  id: number;
  status: MercadoPagoPaymentStatus;
  status_detail: string;
  external_reference?: string;
  transaction_amount: number;
  date_approved?: string;
}

// ============================================================================
// STATUS MAPPING
// ============================================================================

export const STATUS_MAPPING: Record<MercadoPagoPaymentStatus, string> = {
  pending: "PENDING",
  approved: "PAID",
  authorized: "PENDING",
  in_process: "PENDING",
  in_mediation: "PENDING",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
  charged_back: "CHARGEBACK",
};

// ============================================================================
// SIGNATURE HELPERS
// ============================================================================

/**
 * Generates a valid HMAC-SHA256 signature for MercadoPago webhook
 */
export function generateValidSignature(dataId: string, ts: string, secret?: string): string {
  const manifest = `id:${dataId};request-id:test-request-id;ts:${ts};`;
  const hmac = createHmac("sha256", secret ?? WEBHOOK_SECRET);
  hmac.update(manifest);
  return `ts=${ts},v1=${hmac.digest("hex")}`;
}

/**
 * Generates an expired signature (timestamp > 5 minutes ago)
 */
export function generateExpiredSignature(dataId: string, secret?: string): string {
  const oldTs = (Math.floor(Date.now() / 1000) - 600).toString(); // 10 minutes ago
  return generateValidSignature(dataId, oldTs, secret);
}

/**
 * Generates an invalid signature
 */
export function generateInvalidSignature(): string {
  const ts = Math.floor(Date.now() / 1000).toString();
  return `ts=${ts},v1=invalid_signature_hash`;
}

// ============================================================================
// PAYLOAD FACTORIES
// ============================================================================

/**
 * Creates a valid webhook payload
 */
export function createValidPayload(overrides?: Partial<MercadoPagoWebhookPayload>): MercadoPagoWebhookPayload {
  return {
    type: "payment",
    data: {
      id: "12345678",
    },
    action: "payment.updated",
    ...overrides,
  };
}

/**
 * Creates a non-payment type payload
 */
export function createNonPaymentPayload(): MercadoPagoWebhookPayload {
  return {
    type: "merchant_order",
    data: { id: "order-123" },
  };
}

/**
 * Creates a payload without data.id
 */
export function createPayloadWithoutId(): MercadoPagoWebhookPayload {
  return {
    type: "payment",
    data: undefined,
  };
}

/**
 * Creates a mock payment details from MercadoPago API
 */
export function createMockPaymentDetails(overrides?: Partial<MercadoPagoPaymentDetails>): MercadoPagoPaymentDetails {
  return {
    id: 12345678,
    status: "approved",
    status_detail: "accredited",
    external_reference: "order-test-123",
    transaction_amount: 100.00,
    date_approved: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// REQUEST FACTORIES
// ============================================================================

/**
 * Creates headers for authenticated webhook request
 */
export function createAuthHeaders(dataId?: string, secret?: string): Record<string, string> {
  const ts = Math.floor(Date.now() / 1000).toString();
  const id = dataId ?? "12345678";
  
  return {
    "Content-Type": "application/json",
    "x-signature": generateValidSignature(id, ts, secret),
    "x-request-id": "test-request-id",
  };
}

/**
 * Creates headers without signature
 */
export function createUnauthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

/**
 * Creates headers with invalid signature
 */
export function createInvalidSignatureHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-signature": generateInvalidSignature(),
    "x-request-id": "test-request-id",
  };
}

/**
 * Creates headers with expired signature
 */
export function createExpiredSignatureHeaders(dataId?: string, secret?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-signature": generateExpiredSignature(dataId ?? "12345678", secret),
    "x-request-id": "test-request-id",
  };
}

// ============================================================================
// MOCK ORDER HELPERS
// ============================================================================

/**
 * Creates a mock order matching a payment ID
 */
export function createOrderForPaymentId(paymentId: string, status: string = "pending"): Record<string, unknown> {
  return {
    id: `order-${paymentId}`,
    gateway_payment_id: paymentId,
    status,
    vendor_id: "vendor-123",
    customer_email: "customer@test.com",
    customer_name: "Test Customer",
    product_id: "product-123",
    product_name: "Test Product",
    amount_cents: 10000,
    offer_id: "offer-123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
