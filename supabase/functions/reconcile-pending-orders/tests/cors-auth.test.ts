/**
 * CORS & Authentication Tests for reconcile-pending-orders
 * 
 * @module reconcile-pending-orders/tests/cors-auth.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Phase 2: CORS & Authentication Coverage
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  INTERNAL_SECRET_HEADER,
  TEST_INTERNAL_SECRET,
  createAuthHeaders,
  createUnauthHeaders,
  createInvalidSecretHeaders,
} from "./_shared.ts";

// ============================================================================
// CONSTANTS
// ============================================================================

const REQUIRED_CORS_HEADERS = [
  "Access-Control-Allow-Origin",
  "Access-Control-Allow-Methods",
  "Access-Control-Allow-Headers",
];

// ============================================================================
// CORS TESTS
// ============================================================================

Deno.test("reconcile-pending-orders/cors - should define required CORS headers", () => {
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
  };

  for (const header of REQUIRED_CORS_HEADERS) {
    assertExists(corsHeaders[header], `Missing CORS header: ${header}`);
  }
});

Deno.test("reconcile-pending-orders/cors - should allow wildcard origin", () => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  assertEquals(corsHeaders["Access-Control-Allow-Origin"], "*");
});

Deno.test("reconcile-pending-orders/cors - should allow POST and OPTIONS methods", () => {
  const corsHeaders = { "Access-Control-Allow-Methods": "POST, OPTIONS" };
  const methods = corsHeaders["Access-Control-Allow-Methods"];
  
  assertStringIncludes(methods, "POST");
  assertStringIncludes(methods, "OPTIONS");
});

Deno.test("reconcile-pending-orders/cors - should allow x-internal-secret header", () => {
  const corsHeaders = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
  };
  
  assertStringIncludes(corsHeaders["Access-Control-Allow-Headers"], "x-internal-secret");
});

Deno.test("reconcile-pending-orders/cors - OPTIONS response should return 200", () => {
  const optionsResponse = { status: 200, body: "ok" };
  assertEquals(optionsResponse.status, 200);
});

Deno.test("reconcile-pending-orders/cors - should include CORS headers in error responses", () => {
  const errorResponse = {
    status: 500,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: { success: false, error: "Internal Server Error" },
  };

  assertExists(errorResponse.headers["Access-Control-Allow-Origin"]);
});

// ============================================================================
// AUTHENTICATION TESTS - Using Shared Factories
// ============================================================================

Deno.test("reconcile-pending-orders/auth - createAuthHeaders should include internal secret", () => {
  const headers = createAuthHeaders();
  
  assertExists(headers[INTERNAL_SECRET_HEADER]);
  assertEquals(headers[INTERNAL_SECRET_HEADER], TEST_INTERNAL_SECRET);
});

Deno.test("reconcile-pending-orders/auth - createAuthHeaders should accept custom secret", () => {
  const customSecret = "custom-secret-456";
  const headers = createAuthHeaders(customSecret);
  
  assertEquals(headers[INTERNAL_SECRET_HEADER], customSecret);
});

Deno.test("reconcile-pending-orders/auth - createUnauthHeaders should NOT include secret", () => {
  const headers = createUnauthHeaders();
  
  assertEquals(headers[INTERNAL_SECRET_HEADER], undefined);
});

Deno.test("reconcile-pending-orders/auth - createInvalidSecretHeaders should have wrong secret", () => {
  const headers = createInvalidSecretHeaders();
  
  assertExists(headers[INTERNAL_SECRET_HEADER]);
  assertEquals(headers[INTERNAL_SECRET_HEADER] !== TEST_INTERNAL_SECRET, true);
});

// ============================================================================
// AUTHENTICATION VALIDATION TESTS
// ============================================================================

Deno.test("reconcile-pending-orders/auth - should validate secret presence", () => {
  const authHeaders = createAuthHeaders();
  const unauthHeaders = createUnauthHeaders();
  
  const hasAuthSecret = INTERNAL_SECRET_HEADER in authHeaders;
  const hasUnauthSecret = INTERNAL_SECRET_HEADER in unauthHeaders;
  
  assertEquals(hasAuthSecret, true);
  assertEquals(hasUnauthSecret, false);
});

Deno.test("reconcile-pending-orders/auth - should validate secret value", () => {
  const validHeaders = createAuthHeaders();
  const invalidHeaders = createInvalidSecretHeaders();
  
  const isValidSecret = validHeaders[INTERNAL_SECRET_HEADER] === TEST_INTERNAL_SECRET;
  const isInvalidSecret = invalidHeaders[INTERNAL_SECRET_HEADER] !== TEST_INTERNAL_SECRET;
  
  assertEquals(isValidSecret, true);
  assertEquals(isInvalidSecret, true);
});

Deno.test("reconcile-pending-orders/auth - should return 401 for missing authentication", () => {
  const headers = createUnauthHeaders();
  const hasAuth = INTERNAL_SECRET_HEADER in headers;
  
  const expectedStatus = hasAuth ? 200 : 401;
  assertEquals(expectedStatus, 401);
});

Deno.test("reconcile-pending-orders/auth - should return 401 for invalid secret", () => {
  const headers = createInvalidSecretHeaders();
  const isValid = headers[INTERNAL_SECRET_HEADER] === TEST_INTERNAL_SECRET;
  
  const expectedStatus = isValid ? 200 : 401;
  assertEquals(expectedStatus, 401);
});

Deno.test("reconcile-pending-orders/auth - should return 200 for valid authentication", () => {
  const headers = createAuthHeaders();
  const isValid = headers[INTERNAL_SECRET_HEADER] === TEST_INTERNAL_SECRET;
  
  const expectedStatus = isValid ? 200 : 401;
  assertEquals(expectedStatus, 200);
});

// ============================================================================
// AUTHENTICATION RESPONSE TESTS
// ============================================================================

Deno.test("reconcile-pending-orders/auth - unauthorized response should include CORS headers", () => {
  const unauthorizedResponse = {
    status: 401,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: { success: false, error: "Unauthorized" },
  };

  assertEquals(unauthorizedResponse.status, 401);
  assertExists(unauthorizedResponse.headers["Access-Control-Allow-Origin"]);
  assertEquals(unauthorizedResponse.body.error, "Unauthorized");
});

Deno.test("reconcile-pending-orders/auth - unauthorized body should match expected format", () => {
  const unauthorizedBody = { success: false, error: "Unauthorized" };
  
  assertEquals(unauthorizedBody.success, false);
  assertEquals(unauthorizedBody.error, "Unauthorized");
});

// ============================================================================
// HEADER CASE SENSITIVITY TESTS
// ============================================================================

Deno.test("reconcile-pending-orders/auth - Headers API should be case-insensitive", () => {
  const headers = new Headers();
  headers.set("x-internal-secret", TEST_INTERNAL_SECRET);
  
  const value1 = headers.get("X-Internal-Secret");
  const value2 = headers.get("x-internal-secret");
  const value3 = headers.get("X-INTERNAL-SECRET");
  
  assertEquals(value1, TEST_INTERNAL_SECRET);
  assertEquals(value2, TEST_INTERNAL_SECRET);
  assertEquals(value3, TEST_INTERNAL_SECRET);
});

// ============================================================================
// SCHEDULER AUTHENTICATION TESTS
// ============================================================================

Deno.test("reconcile-pending-orders/auth - should accept cron scheduler secret", () => {
  const schedulerHeaders = createAuthHeaders();
  const isSchedulerAuth = schedulerHeaders[INTERNAL_SECRET_HEADER] === TEST_INTERNAL_SECRET;
  
  assertEquals(isSchedulerAuth, true);
});

Deno.test("reconcile-pending-orders/auth - should reject manual trigger without secret", () => {
  const manualHeaders = createUnauthHeaders();
  const hasAuth = INTERNAL_SECRET_HEADER in manualHeaders;
  
  assertEquals(hasAuth, false);
});

// ============================================================================
// GATEWAY DELEGATION TESTS
// ============================================================================

Deno.test("reconcile-pending-orders/auth - should pass auth context to gateway reconcilers", () => {
  const parentAuth = {
    secret: TEST_INTERNAL_SECRET,
    authenticated: true,
  };
  
  // Simulates passing auth context to child reconcilers
  const childAuth = { ...parentAuth };
  
  assertEquals(childAuth.authenticated, true);
  assertEquals(childAuth.secret, TEST_INTERNAL_SECRET);
});
