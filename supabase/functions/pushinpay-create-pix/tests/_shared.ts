/**
 * Shared Test Utilities - pushinpay-create-pix
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module pushinpay-create-pix/tests/_shared
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

export const FUNCTION_NAME = "pushinpay-create-pix";
export const PUSHINPAY_MAX_SPLIT_PERCENT = 0.50;

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePixRequest {
  orderId: string;
  valueInCents: number;
  webhookUrl?: string;
}

export interface PixData {
  id: string;
  pix_id: string;
  qr_code: string;
  qr_code_base64: string;
  status: string;
  value: number;
}

export interface SmartSplitInfo {
  pixCreatedBy: "producer" | "affiliate";
  adjustedSplit: boolean;
  manualPaymentNeeded: number;
}

export interface CreatePixResponse {
  ok: boolean;
  pix?: PixData;
  smartSplit?: SmartSplitInfo;
  error?: string;
}

export interface OrderRecord {
  id: string;
  vendor_id: string;
  amount_cents: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_document: string | null;
  commission_cents: number | null;
  affiliate_id: string | null;
  platform_fee_cents: number | null;
}

export interface SplitRule {
  value: number;
  account_id: string;
}

// ============================================================================
// REQUEST FACTORIES
// ============================================================================

/**
 * Creates a valid create pix request
 */
export function createValidRequest(
  orderId?: string,
  valueInCents?: number
): CreatePixRequest {
  return {
    orderId: orderId ?? "order-test-123",
    valueInCents: valueInCents ?? 10000,
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
export function createRequestWithoutOrderId(): Partial<CreatePixRequest> {
  return { valueInCents: 10000 };
}

/**
 * Creates a request without valueInCents
 */
export function createRequestWithoutValue(): Partial<CreatePixRequest> {
  return { orderId: "order-test-123" };
}

/**
 * Creates a request with zero value
 */
export function createZeroValueRequest(): CreatePixRequest {
  return {
    orderId: "order-test-123",
    valueInCents: 0,
  };
}

/**
 * Creates a request with negative value
 */
export function createNegativeValueRequest(): CreatePixRequest {
  return {
    orderId: "order-test-123",
    valueInCents: -100,
  };
}

/**
 * Creates a request with mismatched value (for security tests)
 */
export function createMismatchedValueRequest(
  orderId: string,
  valueInCents: number
): CreatePixRequest {
  return { orderId, valueInCents };
}

// ============================================================================
// RESPONSE FACTORIES
// ============================================================================

/**
 * Creates a successful PIX response
 */
export function createSuccessPixResponse(
  orderId?: string,
  valueInCents?: number
): CreatePixResponse {
  return {
    ok: true,
    pix: {
      id: "pix-response-123",
      pix_id: "pix-response-123",
      qr_code: "00020126580014BR.GOV.BCB.PIX0136abc-123-456-789",
      qr_code_base64: "data:image/png;base64,iVBORw0KGgo...",
      status: "created",
      value: valueInCents ?? 10000,
    },
    smartSplit: {
      pixCreatedBy: "producer",
      adjustedSplit: false,
      manualPaymentNeeded: 0,
    },
  };
}

/**
 * Creates a PIX response with adjusted split
 */
export function createAdjustedSplitResponse(
  manualPaymentNeeded: number
): CreatePixResponse {
  return {
    ok: true,
    pix: {
      id: "pix-response-123",
      pix_id: "pix-response-123",
      qr_code: "00020126580014BR.GOV.BCB.PIX0136abc-123-456-789",
      qr_code_base64: "data:image/png;base64,iVBORw0KGgo...",
      status: "created",
      value: 10000,
    },
    smartSplit: {
      pixCreatedBy: "producer",
      adjustedSplit: true,
      manualPaymentNeeded,
    },
  };
}

/**
 * Creates an affiliate-created PIX response
 */
export function createAffiliatePixResponse(): CreatePixResponse {
  return {
    ok: true,
    pix: {
      id: "pix-response-123",
      pix_id: "pix-response-123",
      qr_code: "00020126580014BR.GOV.BCB.PIX0136abc-123-456-789",
      qr_code_base64: "data:image/png;base64,iVBORw0KGgo...",
      status: "created",
      value: 10000,
    },
    smartSplit: {
      pixCreatedBy: "affiliate",
      adjustedSplit: false,
      manualPaymentNeeded: 0,
    },
  };
}

/**
 * Creates an error response
 */
export function createErrorPixResponse(message: string): CreatePixResponse {
  return {
    ok: false,
    error: message,
  };
}

// ============================================================================
// MOCK ORDER FACTORIES
// ============================================================================

/**
 * Creates a basic order for PIX creation
 */
export function createOrderForPix(
  orderId: string = "order-test-123",
  vendorId: string = "vendor-123",
  amountCents: number = 10000
): OrderRecord {
  return {
    id: orderId,
    vendor_id: vendorId,
    amount_cents: amountCents,
    customer_name: "Test Customer",
    customer_email: "customer@test.com",
    customer_document: "12345678901",
    commission_cents: null,
    affiliate_id: null,
    platform_fee_cents: null,
  };
}

/**
 * Creates an order with affiliate
 */
export function createOrderWithAffiliate(
  orderId: string = "order-test-123",
  amountCents: number = 10000,
  commissionCents: number = 3000
): OrderRecord {
  return {
    id: orderId,
    vendor_id: "vendor-123",
    amount_cents: amountCents,
    customer_name: "Test Customer",
    customer_email: "customer@test.com",
    customer_document: "12345678901",
    commission_cents: commissionCents,
    affiliate_id: "affiliate-123",
    platform_fee_cents: 400,
  };
}

// ============================================================================
// SPLIT RULE FACTORIES
// ============================================================================

/**
 * Creates split rules for platform fee
 */
export function createPlatformSplitRules(
  platformFeeCents: number,
  platformAccountId: string = "platform-account-123"
): SplitRule[] {
  return [{ value: platformFeeCents, account_id: platformAccountId }];
}

/**
 * Creates split rules with affiliate
 */
export function createAffiliateSplitRules(
  platformFeeCents: number,
  affiliateCommissionCents: number,
  platformAccountId: string = "platform-account-123",
  affiliateAccountId: string = "affiliate-account-123"
): SplitRule[] {
  return [
    { value: platformFeeCents, account_id: platformAccountId },
    { value: affiliateCommissionCents, account_id: affiliateAccountId },
  ];
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Calculates if split exceeds 50% limit
 */
export function splitExceedsLimit(
  totalSplitCents: number,
  valueInCents: number
): boolean {
  const maxSplitCents = Math.floor(valueInCents * PUSHINPAY_MAX_SPLIT_PERCENT);
  return totalSplitCents > maxSplitCents;
}

/**
 * Calculates manual payment needed
 */
export function calculateManualPayment(
  totalSplitCents: number,
  valueInCents: number
): number {
  const maxSplitCents = Math.floor(valueInCents * PUSHINPAY_MAX_SPLIT_PERCENT);
  return Math.max(0, totalSplitCents - maxSplitCents);
}
