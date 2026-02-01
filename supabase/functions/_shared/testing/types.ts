/**
 * Testing Infrastructure - Type Definitions
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Centralized type definitions for the entire testing infrastructure.
 * All test files should import types from this module via mod.ts.
 * 
 * @module _shared/testing/types
 * @version 1.0.0
 */

// ============================================================================
// TEST ENVIRONMENT
// ============================================================================

/**
 * Test environment types:
 * - unit: No external dependencies, pure logic tests
 * - contract: Mocked external calls, validates contracts
 * - integration: Real Supabase connection required
 */
export type TestEnvironment = "unit" | "contract" | "integration";

/**
 * Test configuration returned by getTestConfig()
 */
export interface TestConfig {
  environment: TestEnvironment;
  supabaseUrl: string | null;
  hasServiceRoleKey: boolean;
  isCI: boolean;
  runIntegration: boolean;
}

// ============================================================================
// MOCK USER & SESSION
// ============================================================================

/**
 * User role types matching the database enum
 */
export type UserRole = "user" | "admin" | "owner";

/**
 * Account status types matching the database enum
 */
export type AccountStatus = "active" | "pending_setup" | "reset_required" | "suspended";

/**
 * Mock user for authentication tests
 */
export interface MockUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  account_status: AccountStatus;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Mock session for authentication tests
 */
export interface MockSession {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

// ============================================================================
// MOCK QUERY RESULTS
// ============================================================================

/**
 * Supabase-compatible error structure
 */
export interface MockError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Generic query result matching Supabase response format
 */
export interface MockQueryResult<T> {
  data: T | null;
  error: MockError | null;
  count?: number | null;
  status?: number;
  statusText?: string;
}

/**
 * Single item query result
 */
export interface MockSingleResult<T> {
  data: T | null;
  error: MockError | null;
}

// ============================================================================
// MOCK DATA STORE
// ============================================================================

/**
 * In-memory data store for mock Supabase client
 * Maps table names to arrays of records
 */
export type MockDataStore = Map<string, unknown[]>;

/**
 * Configuration for creating a mock Supabase client
 */
export interface MockSupabaseClientConfig {
  /** Initial data by table name */
  mockData?: MockDataStore;
  /** Authenticated user (null = not authenticated) */
  authUser?: MockUser | null;
  /** Active session */
  authSession?: MockSession | null;
  /** Custom RPC handlers */
  rpcHandlers?: Record<string, (params: unknown) => Promise<unknown>>;
  /** Force error on all operations */
  forceError?: MockError | null;
}

// ============================================================================
// MOCK PRODUCT & ORDER
// ============================================================================

/**
 * Mock product for e-commerce tests
 */
export interface MockProduct {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  status: "active" | "inactive" | "archived";
  members_area_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Order status matching the database
 */
export type OrderStatus = 
  | "pending" 
  | "paid" 
  | "failed" 
  | "refunded" 
  | "chargeback" 
  | "expired"
  | "cancelled";

/**
 * Payment method types
 */
export type PaymentMethod = "pix" | "credit_card" | "boleto";

/**
 * Payment gateway types
 */
export type PaymentGateway = "MERCADOPAGO" | "PUSHINPAY" | "ASAAS" | "STRIPE";

/**
 * Mock order for payment tests
 */
export interface MockOrder {
  id: string;
  vendor_id: string;
  product_id: string;
  checkout_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_cpf: string | null;
  amount_cents: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  gateway: PaymentGateway;
  gateway_payment_id: string | null;
  pix_qr_code: string | null;
  pix_code: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

// ============================================================================
// MOCK AFFILIATE & WEBHOOK
// ============================================================================

/**
 * Affiliate status types
 */
export type AffiliateStatus = "pending" | "approved" | "rejected" | "suspended";

/**
 * Mock affiliate for affiliate program tests
 */
export interface MockAffiliate {
  id: string;
  user_id: string;
  product_id: string;
  affiliate_code: string;
  commission_rate: number;
  status: AffiliateStatus;
  total_sales_count: number;
  total_sales_amount: number;
  created_at: string;
  updated_at: string;
}

/**
 * Mock webhook configuration
 */
export interface MockWebhook {
  id: string;
  user_id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// REQUEST FACTORIES
// ============================================================================

/**
 * Options for creating mock HTTP requests
 */
export interface MockRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
  headers?: Record<string, string>;
  body?: unknown;
  url?: string;
}

/**
 * Options for creating authenticated requests
 */
export interface AuthenticatedRequestOptions extends MockRequestOptions {
  /** Session token for producer auth */
  sessionToken?: string;
  /** Bearer token for API auth */
  bearerToken?: string;
  /** Internal secret for service-to-service calls */
  internalSecret?: string;
}

// ============================================================================
// GATEWAY-SPECIFIC TYPES
// ============================================================================

/**
 * PushinPay webhook event types
 */
export type PushinPayEventType = 
  | "pix.received" 
  | "pix.expired" 
  | "pix.refunded";

/**
 * MercadoPago webhook event types
 */
export type MercadoPagoEventType = 
  | "payment" 
  | "payment.created" 
  | "payment.updated";

/**
 * Asaas webhook event types
 */
export type AsaasEventType = 
  | "PAYMENT_RECEIVED" 
  | "PAYMENT_CONFIRMED" 
  | "PAYMENT_OVERDUE"
  | "PAYMENT_REFUNDED";

/**
 * Mock webhook payload for gateway tests
 */
export interface MockGatewayWebhook<T = unknown> {
  gateway: PaymentGateway;
  eventType: string;
  payload: T;
  signature?: string;
  timestamp: string;
}
