/**
 * Shared Test Utilities - asaas-webhook
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module asaas-webhook/tests/_shared
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
  
  // Mock HTTP
  FetchMock,
  
  // Mock responses
  jsonResponse,
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
  corsOptionsResponse,
  AsaasResponses,
} from "../../_shared/testing/mod.ts";

// ============================================================================
// FUNCTION-SPECIFIC CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "asaas-webhook";
export const WEBHOOK_TOKEN = "test-asaas-webhook-token-456";

// Asaas IP Whitelist (Production IPs)
export const ASAAS_IP_WHITELIST = [
  "54.94.52.238",
  "54.207.14.161", 
  "54.94.37.102",
  "52.67.12.206",
  "54.232.121.215",
] as const;

// ============================================================================
// TYPES
// ============================================================================

export type AsaasPaymentStatus = 
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "OVERDUE"
  | "REFUNDED"
  | "RECEIVED_IN_CASH"
  | "REFUND_REQUESTED"
  | "CHARGEBACK_REQUESTED"
  | "CHARGEBACK_DISPUTE"
  | "AWAITING_CHARGEBACK_REVERSAL"
  | "DUNNING_REQUESTED"
  | "DUNNING_RECEIVED"
  | "AWAITING_RISK_ANALYSIS";

export type AsaasEventType = 
  | "PAYMENT_CREATED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_DELETED"
  | "PAYMENT_UPDATED"
  | "PAYMENT_REFUNDED";

export interface AsaasPayment {
  id: string;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD";
  value: number;
  status: AsaasPaymentStatus;
  externalReference?: string;
  confirmedDate?: string;
  paymentDate?: string;
}

export interface AsaasWebhookPayload {
  event: AsaasEventType;
  payment?: AsaasPayment;
}

// ============================================================================
// STATUS MAPPING (Hotmart/Kiwify Model)
// ============================================================================

export const STATUS_MAPPING: Record<string, { orderStatus: string; technicalStatus?: string }> = {
  PENDING: { orderStatus: "PENDING" },
  RECEIVED: { orderStatus: "PAID" },
  CONFIRMED: { orderStatus: "PAID" },
  OVERDUE: { orderStatus: "PENDING", technicalStatus: "expired" },
  REFUNDED: { orderStatus: "REFUNDED" },
  RECEIVED_IN_CASH: { orderStatus: "PAID" },
  REFUND_REQUESTED: { orderStatus: "PENDING", technicalStatus: "refund_requested" },
  CHARGEBACK_REQUESTED: { orderStatus: "CHARGEBACK" },
  CHARGEBACK_DISPUTE: { orderStatus: "CHARGEBACK" },
  AWAITING_CHARGEBACK_REVERSAL: { orderStatus: "CHARGEBACK" },
};

export const RELEVANT_EVENTS: AsaasEventType[] = [
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_REFUNDED",
  "PAYMENT_DELETED",
  "PAYMENT_UPDATED",
  "PAYMENT_CREATED",
];

// ============================================================================
// PAYLOAD FACTORIES
// ============================================================================

/**
 * Creates a valid Asaas payment object
 */
export function createMockPayment(overrides?: Partial<AsaasPayment>): AsaasPayment {
  return {
    id: "pay_test_123",
    billingType: "PIX",
    value: 100.00,
    status: "RECEIVED",
    externalReference: "order-test-123",
    confirmedDate: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a valid webhook payload
 */
export function createValidPayload(overrides?: Partial<AsaasWebhookPayload>): AsaasWebhookPayload {
  return {
    event: "PAYMENT_RECEIVED",
    payment: createMockPayment(),
    ...overrides,
  };
}

/**
 * Creates a confirmed payment payload
 */
export function createConfirmedPayload(orderId?: string): AsaasWebhookPayload {
  return createValidPayload({
    event: "PAYMENT_CONFIRMED",
    payment: createMockPayment({
      status: "CONFIRMED",
      externalReference: orderId ?? "order-confirmed-123",
    }),
  });
}

/**
 * Creates an overdue payment payload
 */
export function createOverduePayload(orderId?: string): AsaasWebhookPayload {
  return createValidPayload({
    event: "PAYMENT_OVERDUE",
    payment: createMockPayment({
      status: "OVERDUE",
      externalReference: orderId ?? "order-overdue-123",
    }),
  });
}

/**
 * Creates a refunded payment payload
 */
export function createRefundedPayload(orderId?: string): AsaasWebhookPayload {
  return createValidPayload({
    event: "PAYMENT_REFUNDED",
    payment: createMockPayment({
      status: "REFUNDED",
      externalReference: orderId ?? "order-refunded-123",
    }),
  });
}

/**
 * Creates an empty payload
 */
export function createEmptyPayload(): Record<string, never> {
  return {};
}

/**
 * Creates a payload without payment object
 */
export function createPayloadWithoutPayment(): { event: AsaasEventType } {
  return { event: "PAYMENT_CREATED" };
}

/**
 * Creates a payload with irrelevant event
 */
export function createIrrelevantEventPayload(): AsaasWebhookPayload {
  return {
    event: "PAYMENT_CREATED" as AsaasEventType, // Using valid type but not in RELEVANT_EVENTS
    payment: createMockPayment(),
  };
}

// ============================================================================
// REQUEST FACTORIES
// ============================================================================

/**
 * Creates headers for authenticated webhook request
 */
export function createAuthHeaders(token?: string, ip?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "asaas-access-token": token ?? WEBHOOK_TOKEN,
  };
  
  if (ip) {
    headers["X-Forwarded-For"] = ip;
  }
  
  return headers;
}

/**
 * Creates headers without token
 */
export function createUnauthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

/**
 * Creates headers with whitelisted IP
 */
export function createWhitelistedHeaders(token?: string): Record<string, string> {
  return createAuthHeaders(token, ASAAS_IP_WHITELIST[0]);
}

// ============================================================================
// MOCK ORDER HELPERS
// ============================================================================

/**
 * Creates a mock order matching an external reference
 */
export function createOrderForExternalRef(orderId: string, status: string = "pending"): Record<string, unknown> {
  return {
    id: orderId,
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
