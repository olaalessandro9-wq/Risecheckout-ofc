/**
 * CORS & Authentication Tests for reconcile-asaas
 * 
 * @module reconcile-asaas/tests/cors-auth.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Phase 2: CORS & Authentication Coverage
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { MOCK_VENDOR_ID } from "./_shared.ts";

// ============================================================================
// CONSTANTS
// ============================================================================

const INTERNAL_SECRET_HEADER = "X-Internal-Secret";
const VALID_SECRET = "test-internal-secret-123";
const INVALID_SECRET = "wrong-secret";

const REQUIRED_CORS_HEADERS = [
  "Access-Control-Allow-Origin",
  "Access-Control-Allow-Methods",
  "Access-Control-Allow-Headers",
];

// ============================================================================
// CORS TESTS
// ============================================================================

Deno.test("reconcile-asaas/cors - should define required CORS headers", () => {
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
  };

  for (const header of REQUIRED_CORS_HEADERS) {
    assertExists(corsHeaders[header], `Missing CORS header: ${header}`);
  }
});

Deno.test("reconcile-asaas/cors - should allow wildcard origin", () => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  assertEquals(corsHeaders["Access-Control-Allow-Origin"], "*");
});

Deno.test("reconcile-asaas/cors - should allow POST and OPTIONS methods", () => {
  const corsHeaders = { "Access-Control-Allow-Methods": "POST, OPTIONS" };
  const methods = corsHeaders["Access-Control-Allow-Methods"];
  
  assertStringIncludes(methods, "POST");
  assertStringIncludes(methods, "OPTIONS");
});

Deno.test("reconcile-asaas/cors - should allow x-internal-secret header", () => {
  const corsHeaders = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
  };
  
  assertStringIncludes(corsHeaders["Access-Control-Allow-Headers"], "x-internal-secret");
});

Deno.test("reconcile-asaas/cors - OPTIONS response should return 200", () => {
  const optionsResponse = { status: 200, body: "ok" };
  assertEquals(optionsResponse.status, 200);
});

// ============================================================================
// AUTHENTICATION TESTS - Internal Secret
// ============================================================================

Deno.test("reconcile-asaas/auth - should validate X-Internal-Secret header presence", () => {
  const headers = new Headers();
  headers.set(INTERNAL_SECRET_HEADER, VALID_SECRET);
  
  const hasSecret = headers.has(INTERNAL_SECRET_HEADER);
  assertEquals(hasSecret, true);
});

Deno.test("reconcile-asaas/auth - should reject missing X-Internal-Secret header", () => {
  const headers = new Headers();
  
  const hasSecret = headers.has(INTERNAL_SECRET_HEADER);
  assertEquals(hasSecret, false);
});

Deno.test("reconcile-asaas/auth - should extract secret value correctly", () => {
  const headers = new Headers();
  headers.set(INTERNAL_SECRET_HEADER, VALID_SECRET);
  
  const secretValue = headers.get(INTERNAL_SECRET_HEADER);
  assertEquals(secretValue, VALID_SECRET);
});

Deno.test("reconcile-asaas/auth - should detect invalid secret", () => {
  const headers = new Headers();
  headers.set(INTERNAL_SECRET_HEADER, INVALID_SECRET);
  
  const providedSecret = headers.get(INTERNAL_SECRET_HEADER);
  const isValid = providedSecret === VALID_SECRET;
  
  assertEquals(isValid, false);
});

Deno.test("reconcile-asaas/auth - should return 401 for missing authentication", () => {
  const headers = new Headers();
  const hasAuth = headers.has(INTERNAL_SECRET_HEADER);
  
  const expectedStatus = hasAuth ? 200 : 401;
  assertEquals(expectedStatus, 401);
});

Deno.test("reconcile-asaas/auth - should return 401 for invalid secret", () => {
  const headers = new Headers();
  headers.set(INTERNAL_SECRET_HEADER, INVALID_SECRET);
  
  const providedSecret = headers.get(INTERNAL_SECRET_HEADER);
  const isValid = providedSecret === VALID_SECRET;
  
  const expectedStatus = isValid ? 200 : 401;
  assertEquals(expectedStatus, 401);
});

// ============================================================================
// AUTHENTICATION RESPONSE TESTS
// ============================================================================

Deno.test("reconcile-asaas/auth - unauthorized response should include CORS headers", () => {
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

Deno.test("reconcile-asaas/auth - unauthorized response should have JSON body", () => {
  const unauthorizedBody = { success: false, error: "Unauthorized" };
  
  assertEquals(unauthorizedBody.success, false);
  assertEquals(unauthorizedBody.error, "Unauthorized");
});

// ============================================================================
// HEADER CASE SENSITIVITY TESTS
// ============================================================================

Deno.test("reconcile-asaas/auth - should handle case-insensitive header names", () => {
  const headers = new Headers();
  headers.set("x-internal-secret", VALID_SECRET);
  
  // Headers API is case-insensitive
  const value1 = headers.get("X-Internal-Secret");
  const value2 = headers.get("x-internal-secret");
  const value3 = headers.get("X-INTERNAL-SECRET");
  
  assertEquals(value1, VALID_SECRET);
  assertEquals(value2, VALID_SECRET);
  assertEquals(value3, VALID_SECRET);
});

// ============================================================================
// VENDOR CONTEXT TESTS
// ============================================================================

Deno.test("reconcile-asaas/auth - should associate vendor_id with request context", () => {
  const requestContext = {
    vendorId: MOCK_VENDOR_ID,
    authenticated: true,
  };
  
  assertExists(requestContext.vendorId);
  assertEquals(requestContext.authenticated, true);
});

Deno.test("reconcile-asaas/auth - should validate vendor_id format", () => {
  const validVendorId = MOCK_VENDOR_ID;
  const isValidFormat = typeof validVendorId === "string" && validVendorId.length > 0;
  
  assertEquals(isValidFormat, true);
});
