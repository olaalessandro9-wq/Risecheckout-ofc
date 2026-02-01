/**
 * Unit Tests - Payload Validation
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 1: Pure logic tests
 * Execution: ALWAYS (no infrastructure dependency)
 * 
 * @module pushinpay-validate-token/tests/validation
 * @version 1.0.0
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  unitTestOptions,
  createValidRequest,
  createSandboxRequest,
  createEmptyRequest,
  createRequestWithoutToken,
  createRequestWithInvalidEnvironment,
  PUSHINPAY_API_URLS,
} from "./_shared.ts";

// ============================================================================
// REQUEST STRUCTURE TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-validate-token/validation: valid request has all required fields",
  ...unitTestOptions,
  fn: () => {
    const request = createValidRequest();
    
    assertEquals(typeof request.api_token, "string");
    assertEquals(request.api_token.length > 0, true);
    assertEquals(["production", "sandbox"].includes(request.environment!), true);
  }
});

Deno.test({
  name: "pushinpay-validate-token/validation: sandbox request uses correct environment",
  ...unitTestOptions,
  fn: () => {
    const request = createSandboxRequest();
    
    assertEquals(request.environment, "sandbox");
    assertEquals(typeof request.api_token, "string");
  }
});

Deno.test({
  name: "pushinpay-validate-token/validation: empty request has no fields",
  ...unitTestOptions,
  fn: () => {
    const request = createEmptyRequest();
    
    assertEquals(Object.keys(request).length, 0);
  }
});

Deno.test({
  name: "pushinpay-validate-token/validation: request without token is missing api_token",
  ...unitTestOptions,
  fn: () => {
    const request = createRequestWithoutToken();
    
    assertEquals("api_token" in request, false);
    assertEquals(request.environment, "production");
  }
});

Deno.test({
  name: "pushinpay-validate-token/validation: invalid environment is detectable",
  ...unitTestOptions,
  fn: () => {
    const request = createRequestWithInvalidEnvironment();
    
    assertEquals(["production", "sandbox"].includes(request.environment), false);
  }
});

// ============================================================================
// API URL TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-validate-token/validation: production URL is correct",
  ...unitTestOptions,
  fn: () => {
    assertEquals(PUSHINPAY_API_URLS.production, "https://api.pushinpay.com.br/api/accounts/find");
  }
});

Deno.test({
  name: "pushinpay-validate-token/validation: sandbox URL is correct",
  ...unitTestOptions,
  fn: () => {
    assertEquals(PUSHINPAY_API_URLS.sandbox, "https://api-sandbox.pushinpay.com.br/api/accounts/find");
  }
});

// ============================================================================
// TOKEN FORMAT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-validate-token/validation: token can be any non-empty string",
  ...unitTestOptions,
  fn: () => {
    const shortToken = createValidRequest({ api_token: "abc" });
    const longToken = createValidRequest({ api_token: "a".repeat(100) });
    const specialToken = createValidRequest({ api_token: "token-with-dashes_and_underscores" });
    
    assertEquals(shortToken.api_token.length >= 1, true);
    assertEquals(longToken.api_token.length, 100);
    assertEquals(specialToken.api_token.includes("-"), true);
    assertEquals(specialToken.api_token.includes("_"), true);
  }
});
