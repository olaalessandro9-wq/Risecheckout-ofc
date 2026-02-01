/**
 * Testing Infrastructure - Barrel Export
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Single entry point for all testing utilities.
 * Import everything from this module via:
 * 
 * ```typescript
 * import { createMockUser, createMockSupabaseClient, skipIntegration } from "../_shared/testing/mod.ts";
 * ```
 * 
 * @module _shared/testing/mod
 * @version 1.0.0
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Environment
  TestEnvironment,
  TestConfig,
  
  // User & Session
  UserRole,
  AccountStatus,
  MockUser,
  MockSession,
  
  // Query Results
  MockError,
  MockQueryResult,
  MockSingleResult,
  
  // Data Store
  MockDataStore,
  MockSupabaseClientConfig,
  
  // Business Entities
  MockProduct,
  OrderStatus,
  PaymentMethod,
  PaymentGateway,
  MockOrder,
  AffiliateStatus,
  MockAffiliate,
  MockWebhook,
  
  // Requests
  MockRequestOptions,
  AuthenticatedRequestOptions,
  
  // Gateway Types
  PushinPayEventType,
  MercadoPagoEventType,
  AsaasEventType,
  MockGatewayWebhook,
} from "./types.ts";

// ============================================================================
// TEST CONFIG EXPORTS
// ============================================================================

export {
  getTestConfig,
  skipIntegration,
  skipContract,
  isCI,
  runUnit,
  isEnvironment,
  unitTestOptions,
  integrationTestOptions,
  getTestOptions,
} from "./test-config.ts";

// ============================================================================
// MOCK SUPABASE CLIENT EXPORTS
// ============================================================================

export {
  createMockSupabaseClient,
  createEmptyDataStore,
  createMockDataStore,
} from "./mock-supabase-client.ts";

export type { MockSupabaseClient } from "./mock-supabase-client.ts";

// ============================================================================
// MOCK RESPONSES EXPORTS
// ============================================================================

export {
  // CORS
  defaultCorsHeaders,
  createCorsHeaders,
  
  // Success responses
  jsonResponse,
  successResponse,
  createdResponse,
  noContentResponse,
  
  // Error responses
  errorResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  validationErrorResponse,
  rateLimitResponse,
  serverErrorResponse,
  
  // CORS preflight
  corsOptionsResponse,
  
  // Gateway-specific
  PushinPayResponses,
  MercadoPagoResponses,
  AsaasResponses,
  StripeResponses,
  GatewayResponses,
} from "./mock-responses.ts";

// ============================================================================
// TEST FACTORIES EXPORTS
// ============================================================================

export {
  // IDs
  generateId,
  generatePrefixedId,
  
  // Users
  createMockUser,
  createMockProducer,
  createMockAdmin,
  createMockOwner,
  createMockInactiveUser,
  createMockPendingUser,
  
  // Sessions
  createMockSession,
  createMockExpiredSession,
  
  // Products
  createMockProduct,
  createMockCourseProduct,
  
  // Orders
  createMockOrder,
  createMockPaidOrder,
  createMockPixOrder,
  createMockCreditCardOrder,
  
  // Affiliates
  createMockAffiliate,
  createMockPendingAffiliate,
  
  // Webhooks
  createMockWebhook,
  
  // Requests
  createMockRequest,
  createAuthenticatedRequest,
  createInternalRequest,
  
  // Gateway Webhooks
  createPushinPayWebhookRequest,
  createMercadoPagoWebhookRequest,
  createAsaasWebhookRequest,
} from "./test-factories.ts";

// ============================================================================
// RE-EXPORT EXISTING MOCKS
// ============================================================================

export {
  FetchMock,
  EmailServiceMock,
  CloudflareTurnstileMock,
} from "../test-mocks.ts";
