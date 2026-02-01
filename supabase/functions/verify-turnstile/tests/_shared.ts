/**
 * Shared Test Utilities - verify-turnstile
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Centralized test utilities for verify-turnstile Edge Function.
 * 
 * @module verify-turnstile/tests/_shared
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
  
  // Mock HTTP
  FetchMock,
  
  // Mock responses
  jsonResponse,
  successResponse,
  badRequestResponse,
  serverErrorResponse,
  corsOptionsResponse,
  createCorsHeaders,
  defaultCorsHeaders,
} from "../../_shared/testing/mod.ts";

// ============================================================================
// FUNCTION-SPECIFIC CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "verify-turnstile";
export const TURNSTILE_API_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// ============================================================================
// TYPES
// ============================================================================

export interface TurnstileVerifyRequest {
  token: string;
  remoteip?: string;
}

export interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

// ============================================================================
// PAYLOAD FACTORIES
// ============================================================================

/**
 * Generates a test Turnstile token
 */
export function generateTestTurnstileToken(): string {
  return `test_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Creates a valid verification request
 */
export function createValidRequest(overrides?: Partial<TurnstileVerifyRequest>): TurnstileVerifyRequest {
  return {
    token: generateTestTurnstileToken(),
    ...overrides,
  };
}

/**
 * Creates an empty request (for validation testing)
 */
export function createEmptyRequest(): Record<string, never> {
  return {};
}

/**
 * Creates a request with empty token
 */
export function createEmptyTokenRequest(): TurnstileVerifyRequest {
  return { token: "" };
}

// ============================================================================
// MOCK RESPONSE FACTORIES
// ============================================================================

/**
 * Creates a mock Turnstile API success response
 */
export function createMockTurnstileSuccess(hostname?: string): TurnstileVerifyResponse {
  return {
    success: true,
    challenge_ts: new Date().toISOString(),
    hostname: hostname ?? "localhost",
  };
}

/**
 * Creates a mock Turnstile API error response
 */
export function createMockTurnstileError(errorCodes: string[]): TurnstileVerifyResponse {
  return {
    success: false,
    "error-codes": errorCodes,
  };
}

/**
 * Creates a mock Turnstile verification response (for FetchMock)
 */
export function mockTurnstileVerification(
  success: boolean,
  errorCodes?: string[]
): Response {
  const body = success
    ? createMockTurnstileSuccess()
    : createMockTurnstileError(errorCodes ?? ["invalid-input-response"]);
  
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// ============================================================================
// HEADER FACTORIES
// ============================================================================

/**
 * Creates standard headers for Turnstile verification
 */
export function createHeaders(remoteIp?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Origin": "http://localhost:5173",
  };
  
  if (remoteIp) {
    headers["X-Forwarded-For"] = remoteIp;
  }
  
  return headers;
}
