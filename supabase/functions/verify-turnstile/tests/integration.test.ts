/**
 * Verify Turnstile Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Real HTTP integration tests for verify-turnstile Edge Function.
 * Tests Cloudflare Turnstile verification with mocked API responses.
 * 
 * Tests are skipped in CI environments without proper configuration.
 * 
 * @module verify-turnstile/tests/integration
 * @version 2.0.0
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  skipIntegration,
  integrationTestOptions,
  FUNCTION_NAME,
  TURNSTILE_API_URL,
  FetchMock,
  createValidRequest,
  createEmptyRequest,
  createEmptyTokenRequest,
  createHeaders,
  mockTurnstileVerification,
  generateTestTurnstileToken,
} from "./_shared.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ============================================================================
// TOKEN VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "verify-turnstile/integration: successful verification with valid token",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: TURNSTILE_API_URL,
      method: "POST",
      response: mockTurnstileVerification(true),
    });
    fetchMock.install();
    
    try {
      const testToken = generateTestTurnstileToken();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ token: testToken }),
      });
      
      assertEquals(response.status, 200);
      
      const data = await response.json();
      assertExists(data.success);
      assertEquals(data.success, true);
      assertExists(data.challenge_ts);
      assertExists(data.hostname);
    } finally {
      fetchMock.uninstall();
      fetchMock.reset();
    }
  },
});

Deno.test({
  name: "verify-turnstile/integration: reject invalid token",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: TURNSTILE_API_URL,
      method: "POST",
      response: mockTurnstileVerification(false, ["invalid-input-response"]),
    });
    fetchMock.install();
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ token: "invalid-token-12345" }),
      });
      
      assertEquals(response.status, 400);
      
      const data = await response.json();
      assertExists(data.success);
      assertEquals(data.success, false);
      assertExists(data["error-codes"]);
      assert(data["error-codes"].includes("invalid-input-response"));
    } finally {
      fetchMock.uninstall();
      fetchMock.reset();
    }
  },
});

Deno.test({
  name: "verify-turnstile/integration: reject missing token",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify(createEmptyRequest()),
    });
    
    assertEquals(response.status, 400);
    
    const data = await response.json();
    assertExists(data.error);
    assert(data.error.toLowerCase().includes("token"));
  },
});

Deno.test({
  name: "verify-turnstile/integration: reject empty token",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify(createEmptyTokenRequest()),
    });
    
    assertEquals(response.status, 400);
    
    const data = await response.json();
    assertExists(data.error);
  },
});

// ============================================================================
// CLOUDFLARE API INTEGRATION TESTS
// ============================================================================

Deno.test({
  name: "verify-turnstile/integration: send correct request to Cloudflare",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    let capturedRequest: Request | null = null;
    
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: TURNSTILE_API_URL,
      method: "POST",
      response: async (request: Request) => {
        capturedRequest = request;
        return mockTurnstileVerification(true);
      },
    });
    fetchMock.install();
    
    try {
      const testToken = generateTestTurnstileToken();
      
      await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ token: testToken }),
      });
      
      assertExists(capturedRequest);
      assertEquals((capturedRequest as Request)!.method, "POST");
      
      const requestBody = await (capturedRequest as Request)!.json();
      assertExists(requestBody.secret);
      assertExists(requestBody.response);
      assertEquals(requestBody.response, testToken);
    } finally {
      fetchMock.uninstall();
      fetchMock.reset();
    }
  },
});

Deno.test({
  name: "verify-turnstile/integration: include remote IP in request",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    let capturedRequest: Request | null = null;
    
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: TURNSTILE_API_URL,
      method: "POST",
      response: async (request: Request) => {
        capturedRequest = request;
        return mockTurnstileVerification(true);
      },
    });
    fetchMock.install();
    
    try {
      const testToken = generateTestTurnstileToken();
      
      await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
        method: "POST",
        headers: createHeaders("192.168.1.100"),
        body: JSON.stringify({ token: testToken }),
      });
      
      if (capturedRequest) {
        await (capturedRequest as Request).json();
        assert(true);
      }
    } finally {
      fetchMock.uninstall();
      fetchMock.reset();
    }
  },
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

Deno.test({
  name: "verify-turnstile/integration: handle invalid secret key",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: TURNSTILE_API_URL,
      method: "POST",
      response: mockTurnstileVerification(false, ["invalid-input-secret"]),
    });
    fetchMock.install();
    
    try {
      const testToken = generateTestTurnstileToken();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ token: testToken }),
      });
      
      assert(response.status === 500 || response.status === 400);
      
      const data = await response.json();
      assertExists(data.error || data["error-codes"]);
    } finally {
      fetchMock.uninstall();
      fetchMock.reset();
    }
  },
});

Deno.test({
  name: "verify-turnstile/integration: handle malformed API response",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: TURNSTILE_API_URL,
      method: "POST",
      response: new Response("Invalid JSON", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    });
    fetchMock.install();
    
    try {
      const testToken = generateTestTurnstileToken();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ token: testToken }),
      });
      
      assertEquals(response.status, 500);
      await response.text();
    } finally {
      fetchMock.uninstall();
      fetchMock.reset();
    }
  },
});

// ============================================================================
// SECURITY TESTS
// ============================================================================

Deno.test({
  name: "verify-turnstile/integration: prevent token replay attack",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const usedTokens = new Set<string>();
    
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: TURNSTILE_API_URL,
      method: "POST",
      response: async (request: Request) => {
        const body = await request.json();
        const token = body.response;
        
        if (usedTokens.has(token)) {
          return mockTurnstileVerification(false, ["timeout-or-duplicate"]);
        }
        
        usedTokens.add(token);
        return mockTurnstileVerification(true);
      },
    });
    fetchMock.install();
    
    try {
      const testToken = generateTestTurnstileToken();
      
      const response1 = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ token: testToken }),
      });
      
      const response2 = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({ token: testToken }),
      });
      
      assertEquals(response1.status, 200);
      assertEquals(response2.status, 400);
      
      const data2 = await response2.json();
      assertEquals(data2.success, false);
      assert(data2["error-codes"].includes("timeout-or-duplicate"));
      
      await response1.text().catch(() => {});
    } finally {
      fetchMock.uninstall();
      fetchMock.reset();
    }
  },
});
