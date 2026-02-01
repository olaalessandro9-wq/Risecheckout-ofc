/**
 * Unified Auth Tests - Shared Utilities
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Type-safe mocks and utilities for unified-auth tests.
 * 
 * @module unified-auth/tests/_shared
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  createMockUser,
  createMockSession,
  createMockRequest,
  createMockSupabaseClient,
  createEmptyDataStore,
  jsonResponse,
  defaultCorsHeaders,
} from "../../_shared/testing/mod.ts";
import type { MockUser, MockSession, MockDataStore } from "../../_shared/testing/mod.ts";

// ============================================================================
// RE-EXPORTS
// ============================================================================

export {
  createMockUser,
  createMockSession,
  createMockRequest,
  createMockSupabaseClient,
  createEmptyDataStore,
  jsonResponse,
  defaultCorsHeaders,
};

export type { MockUser, MockSession, MockDataStore };

// ============================================================================
// AUTH-SPECIFIC TYPES
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  preferredRole?: "buyer" | "seller" | "admin" | "owner";
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  registrationType?: "producer" | "affiliate" | "buyer";
}

export interface ValidateResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    timezone?: string;
  };
  roles?: string[];
  activeRole?: string;
  expiresIn?: number;
}

export interface AuthSuccessResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  roles: string[];
  activeRole: string;
  expiresIn: number;
  expiresAt: string;
}

// ============================================================================
// AUTH USER TYPE (Extended for auth tests)
// ============================================================================

/**
 * Extended user type with password_hash for auth tests
 */
export interface AuthMockUser extends MockUser {
  password_hash?: string;
}

// ============================================================================
// AUTH-SPECIFIC FACTORIES
// ============================================================================

/**
 * Creates a mock user with valid bcrypt password hash
 * Hash is for password "Test123456"
 */
export function createMockAuthUser(overrides: Partial<AuthMockUser> = {}): AuthMockUser {
  const baseUser = createMockUser(overrides);
  
  return {
    ...baseUser,
    password_hash: overrides.password_hash ?? "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  };
}

/**
 * Creates a login request
 */
export function createLoginRequest(overrides: Partial<LoginRequest> = {}): LoginRequest {
  return {
    email: "test@example.com",
    password: "Test123456",
    ...overrides,
  };
}

/**
 * Creates a register request
 */
export function createRegisterRequest(overrides: Partial<RegisterRequest> = {}): RegisterRequest {
  return {
    email: `newuser-${Date.now()}@example.com`,
    password: "SecurePass123",
    name: "New User",
    ...overrides,
  };
}

/**
 * Creates a mock HTTP request for unified-auth endpoints
 */
export function createAuthRequest(
  action: string,
  body: unknown,
  options: { headers?: Record<string, string>; cookies?: string } = {}
): Request {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  if (options.cookies) {
    headers["Cookie"] = options.cookies;
  }
  
  return new Request(`https://localhost/functions/v1/unified-auth/${action}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * Creates a mock authenticated request with access token cookie
 */
export function createAuthenticatedAuthRequest(
  action: string,
  body: unknown,
  accessToken: string
): Request {
  return createAuthRequest(action, body, {
    cookies: `__Secure-rise_access=${accessToken}`,
  });
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Asserts that a response is a successful auth response
 */
export async function assertAuthSuccess(
  response: Response,
  expectedUserId?: string
): Promise<AuthSuccessResponse> {
  assertEquals(response.status, 200, "Expected status 200");
  
  const body = await response.json();
  assertEquals(body.success, true, "Expected success: true");
  assertEquals(typeof body.user, "object", "Expected user object");
  assertEquals(typeof body.user.id, "string", "Expected user.id string");
  assertEquals(typeof body.user.email, "string", "Expected user.email string");
  assertEquals(Array.isArray(body.roles), true, "Expected roles array");
  assertEquals(typeof body.activeRole, "string", "Expected activeRole string");
  
  if (expectedUserId) {
    assertEquals(body.user.id, expectedUserId, "User ID mismatch");
  }
  
  return body as AuthSuccessResponse;
}

/**
 * Asserts that a response is an error response
 */
export async function assertAuthError(
  response: Response,
  expectedStatus: number,
  expectedMessage?: string
): Promise<{ error: string }> {
  assertEquals(response.status, expectedStatus, `Expected status ${expectedStatus}`);
  
  const body = await response.json();
  assertEquals(typeof body.error, "string", "Expected error string");
  
  if (expectedMessage) {
    assertEquals(body.error, expectedMessage, "Error message mismatch");
  }
  
  return body;
}

// ============================================================================
// SECURITY TEST PAYLOADS
// ============================================================================

export const sqlInjectionPayloads = [
  "' OR '1'='1",
  "admin'--",
  "' OR 1=1--",
  "'; DROP TABLE users--",
  "' UNION SELECT * FROM users--",
  "1' AND '1'='1",
];

export const xssPayloads = [
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert('XSS')>",
  "javascript:alert('XSS')",
];

export const oversizedPayloads = {
  longEmail: "a".repeat(300) + "@example.com",
  longPassword: "A".repeat(1000) + "1",
  longName: "A".repeat(500),
};

// ============================================================================
// ENDPOINT CONSTANTS
// ============================================================================

export const AUTH_ENDPOINTS = {
  LOGIN: "login",
  REGISTER: "register",
  LOGOUT: "logout",
  VALIDATE: "validate",
  REFRESH: "refresh",
  REQUEST_REFRESH: "request-refresh",
  SWITCH_CONTEXT: "switch-context",
  PASSWORD_RESET_REQUEST: "password-reset-request",
  PASSWORD_RESET_VERIFY: "password-reset-verify",
  PASSWORD_RESET: "password-reset",
  CHECK_EMAIL: "check-email",
  CHECK_PRODUCER_BUYER: "check-producer-buyer",
  ENSURE_PRODUCER_ACCESS: "ensure-producer-access",
  PRODUCER_LOGIN: "producer-login",
} as const;

export type AuthEndpoint = typeof AUTH_ENDPOINTS[keyof typeof AUTH_ENDPOINTS];
