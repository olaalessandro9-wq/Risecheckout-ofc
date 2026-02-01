/**
 * Shared Test Utilities - pushinpay-validate-token
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module pushinpay-validate-token/tests/_shared
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
  
  // Mock HTTP
  FetchMock,
  
  // Mock responses
  jsonResponse,
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
  serverErrorResponse,
  corsOptionsResponse,
  createCorsHeaders,
} from "../../_shared/testing/mod.ts";

// ============================================================================
// FUNCTION-SPECIFIC CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "pushinpay-validate-token";

export const PUSHINPAY_API_URLS = {
  production: "https://api.pushinpay.com.br/api/accounts/find",
  sandbox: "https://api-sandbox.pushinpay.com.br/api/accounts/find",
} as const;

// ============================================================================
// TYPES
// ============================================================================

export type PushinPayEnvironment = "production" | "sandbox";

export interface ValidateTokenRequest {
  api_token: string;
  environment?: PushinPayEnvironment;
}

export interface PushinPayAccountInfo {
  id: string;
  name: string;
  email: string;
  document?: string;
}

export interface ValidationResult {
  valid: boolean;
  account?: PushinPayAccountInfo;
  error?: string;
}

// ============================================================================
// PAYLOAD FACTORIES
// ============================================================================

/**
 * Creates a valid token validation request
 */
export function createValidRequest(overrides?: Partial<ValidateTokenRequest>): ValidateTokenRequest {
  return {
    api_token: "test-api-token-123456",
    environment: "production",
    ...overrides,
  };
}

/**
 * Creates a sandbox request
 */
export function createSandboxRequest(token?: string): ValidateTokenRequest {
  return {
    api_token: token ?? "sandbox-token-123",
    environment: "sandbox",
  };
}

/**
 * Creates an empty request (for validation testing)
 */
export function createEmptyRequest(): Record<string, never> {
  return {};
}

/**
 * Creates a request with missing token
 */
export function createRequestWithoutToken(): { environment: PushinPayEnvironment } {
  return { environment: "production" };
}

/**
 * Creates a request with invalid environment
 */
export function createRequestWithInvalidEnvironment(): { api_token: string; environment: string } {
  return {
    api_token: "test-token",
    environment: "invalid",
  };
}

// ============================================================================
// MOCK RESPONSE FACTORIES
// ============================================================================

/**
 * Creates a successful account info response from PushinPay API
 */
export function createMockAccountResponse(overrides?: Partial<PushinPayAccountInfo>): PushinPayAccountInfo {
  return {
    id: "account-123",
    name: "Test Account",
    email: "test@pushinpay.com",
    document: "12345678901",
    ...overrides,
  };
}

/**
 * Creates a valid validation result
 */
export function createValidResult(account?: Partial<PushinPayAccountInfo>): ValidationResult {
  return {
    valid: true,
    account: createMockAccountResponse(account),
  };
}

/**
 * Creates an invalid validation result
 */
export function createInvalidResult(error?: string): ValidationResult {
  return {
    valid: false,
    error: error ?? "Token inválido ou expirado",
  };
}
