/**
 * Shared Test Utilities - reconcile-pending-orders
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module reconcile-pending-orders/tests/_shared
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
} from "../../_shared/testing/mod.ts";

// ============================================================================
// FUNCTION-SPECIFIC CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "reconcile-pending-orders";
export const INTERNAL_SECRET_HEADER = "X-Internal-Secret";
export const TEST_INTERNAL_SECRET = "test-internal-secret-123";

export const MAX_ORDERS_PER_RUN = 50;
export const MIN_AGE_MINUTES = 3;
export const MAX_AGE_HOURS = 24;

// ============================================================================
// TYPES
// ============================================================================

export interface PendingOrder {
  id: string;
  vendor_id: string;
  product_id: string;
  gateway: string | null;
  gateway_payment_id: string | null;
  pix_id: string | null;
  status: string;
  customer_email: string | null;
  customer_name: string | null;
}

export interface ReconcileResult {
  order_id: string;
  previous_status: string;
  new_status: string;
  action: "updated" | "skipped" | "error";
  reason: string;
}

export interface GatewaySummary {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

export interface ReconcileResponse {
  success: boolean;
  version?: string;
  results?: ReconcileResult[];
  summary?: {
    total: number;
    updated: number;
    skipped: number;
    errors: number;
    by_gateway: {
      mercadopago: GatewaySummary;
      asaas: GatewaySummary;
      unsupported?: { total: number; skipped: number };
    };
  };
  message?: string;
  processed?: number;
  duration_ms?: number;
  error?: string;
}

// ============================================================================
// REQUEST FACTORIES
// ============================================================================

/**
 * Creates authenticated headers with internal secret
 */
export function createAuthHeaders(secret?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    [INTERNAL_SECRET_HEADER]: secret ?? TEST_INTERNAL_SECRET,
  };
}

/**
 * Creates unauthenticated headers
 */
export function createUnauthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

/**
 * Creates headers with invalid secret
 */
export function createInvalidSecretHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    [INTERNAL_SECRET_HEADER]: "invalid-secret",
  };
}

// ============================================================================
// ORDER FACTORIES
// ============================================================================

/**
 * Creates a pending order for Mercado Pago
 */
export function createMercadoPagoPendingOrder(
  orderId?: string
): PendingOrder {
  return {
    id: orderId ?? `mp-order-${Date.now()}`,
    vendor_id: "vendor-123",
    product_id: "product-123",
    gateway: "mercadopago",
    gateway_payment_id: "mp-payment-123456",
    pix_id: null,
    status: "PENDING",
    customer_email: "customer@test.com",
    customer_name: "Test Customer",
  };
}

/**
 * Creates a pending order for Asaas
 */
export function createAsaasPendingOrder(
  orderId?: string
): PendingOrder {
  return {
    id: orderId ?? `asaas-order-${Date.now()}`,
    vendor_id: "vendor-123",
    product_id: "product-123",
    gateway: "asaas",
    gateway_payment_id: "pay_asaas123456",
    pix_id: null,
    status: "PENDING",
    customer_email: "customer@test.com",
    customer_name: "Test Customer",
  };
}

/**
 * Creates a pending order for unsupported gateway
 */
export function createUnsupportedGatewayOrder(
  orderId?: string,
  gateway?: string
): PendingOrder {
  return {
    id: orderId ?? `other-order-${Date.now()}`,
    vendor_id: "vendor-123",
    product_id: "product-123",
    gateway: gateway ?? "unknown-gateway",
    gateway_payment_id: null,
    pix_id: null,
    status: "PENDING",
    customer_email: "customer@test.com",
    customer_name: "Test Customer",
  };
}

/**
 * Creates a pending order without payment ID
 */
export function createOrderWithoutPaymentId(
  gateway: string = "mercadopago"
): PendingOrder {
  return {
    id: `no-payment-id-${Date.now()}`,
    vendor_id: "vendor-123",
    product_id: "product-123",
    gateway,
    gateway_payment_id: null,
    pix_id: null,
    status: "PENDING",
    customer_email: "customer@test.com",
    customer_name: "Test Customer",
  };
}

// ============================================================================
// RESULT FACTORIES
// ============================================================================

/**
 * Creates a successful update result
 */
export function createUpdatedResult(
  orderId: string,
  newStatus: string = "PAID"
): ReconcileResult {
  return {
    order_id: orderId,
    previous_status: "PENDING",
    new_status: newStatus,
    action: "updated",
    reason: "Status synced from gateway",
  };
}

/**
 * Creates a skipped result
 */
export function createSkippedResult(
  orderId: string,
  reason: string
): ReconcileResult {
  return {
    order_id: orderId,
    previous_status: "PENDING",
    new_status: "PENDING",
    action: "skipped",
    reason,
  };
}

/**
 * Creates an error result
 */
export function createErrorResult(
  orderId: string,
  reason: string
): ReconcileResult {
  return {
    order_id: orderId,
    previous_status: "PENDING",
    new_status: "PENDING",
    action: "error",
    reason,
  };
}

// ============================================================================
// RESPONSE FACTORIES
// ============================================================================

/**
 * Creates a successful reconcile response with no pending orders
 */
export function createEmptyReconcileResponse(): ReconcileResponse {
  return {
    success: true,
    message: "Nenhum pedido pendente",
    processed: 0,
    duration_ms: 100,
  };
}

/**
 * Creates a successful reconcile response with results
 */
export function createSuccessReconcileResponse(
  results: ReconcileResult[]
): ReconcileResponse {
  const updated = results.filter(r => r.action === "updated").length;
  const skipped = results.filter(r => r.action === "skipped").length;
  const errors = results.filter(r => r.action === "error").length;

  return {
    success: true,
    version: "3.0",
    results,
    summary: {
      total: results.length,
      updated,
      skipped,
      errors,
      by_gateway: {
        mercadopago: { total: 0, updated: 0, skipped: 0, errors: 0 },
        asaas: { total: 0, updated: 0, skipped: 0, errors: 0 },
        unsupported: { total: 0, skipped: 0 },
      },
    },
    duration_ms: 500,
  };
}

/**
 * Creates an unauthorized response
 */
export function createUnauthorizedResponse(): ReconcileResponse {
  return {
    success: false,
    error: "Unauthorized",
  };
}

/**
 * Creates an error response
 */
export function createErrorReconcileResponse(error: string): ReconcileResponse {
  return {
    success: false,
    error,
    duration_ms: 50,
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Checks if order is within valid age range
 */
export function isOrderInValidAgeRange(createdAt: Date): boolean {
  const now = new Date();
  const minAge = new Date(now.getTime() - MIN_AGE_MINUTES * 60 * 1000);
  const maxAge = new Date(now.getTime() - MAX_AGE_HOURS * 60 * 60 * 1000);
  
  return createdAt < minAge && createdAt > maxAge;
}

/**
 * Checks if gateway is supported
 */
export function isGatewaySupported(gateway: string | null): boolean {
  return gateway?.toLowerCase() === "mercadopago" || 
         gateway?.toLowerCase() === "asaas";
}

/**
 * Groups orders by gateway
 */
export function groupOrdersByGateway(orders: PendingOrder[]): {
  mercadopago: PendingOrder[];
  asaas: PendingOrder[];
  unsupported: PendingOrder[];
} {
  return {
    mercadopago: orders.filter(
      o => o.gateway?.toLowerCase() === "mercadopago" && o.gateway_payment_id
    ),
    asaas: orders.filter(
      o => o.gateway?.toLowerCase() === "asaas" && o.gateway_payment_id
    ),
    unsupported: orders.filter(
      o => !isGatewaySupported(o.gateway) || !o.gateway_payment_id
    ),
  };
}
