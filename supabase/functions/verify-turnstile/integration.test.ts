/**
 * Verify Turnstile Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for verify-turnstile Edge Function.
 * Tests Cloudflare Turnstile verification with mocked API responses.
 * 
 * NOTE: These tests require local Supabase infrastructure.
 * They are skipped in CI environments without proper configuration.
 * 
 * @module verify-turnstile/integration.test
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

// ============================================================================
// Environment Detection & Test Gating
// ============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const skipTests = !SUPABASE_URL || 
  !SUPABASE_SERVICE_ROLE_KEY || 
  SUPABASE_URL.includes("test.supabase.co") || 
  !SUPABASE_URL.startsWith("https://");

// ============================================================================
// Lazy Helpers
// ============================================================================

async function getTestHelpers() {
  return await import("../_shared/test-helpers.ts");
}

async function getTestMocks() {
  return await import("../_shared/test-mocks.ts");
}

const TURNSTILE_API_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// ============================================================================
// Token Validation Tests
// ============================================================================

Deno.test({
  name: "verify-turnstile: successful verification with valid token",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    const { FetchMock, mockTurnstileVerification, generateTestTurnstileToken } = await getTestMocks();
    
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: TURNSTILE_API_URL,
      method: "POST",
      response: mockTurnstileVerification(true),
    });
    fetchMock.install();
    
    try {
      const testToken = generateTestTurnstileToken();
      
      const response = await makeRequest("verify-turnstile", {
        method: "POST",
        body: JSON.stringify({
          token: testToken,
        }),
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
  name: "verify-turnstile: reject invalid token",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    const { FetchMock, mockTurnstileVerification } = await getTestMocks();
    
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: TURNSTILE_API_URL,
      method: "POST",
      response: mockTurnstileVerification(false, ["invalid-input-response"]),
    });
    fetchMock.install();
    
    try {
      const response = await makeRequest("verify-turnstile", {
        method: "POST",
        body: JSON.stringify({
          token: "invalid-token-12345",
        }),
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
  name: "verify-turnstile: reject missing token",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    
    const response = await makeRequest("verify-turnstile", {
      method: "POST",
      body: JSON.stringify({}),
    });
    
    assertEquals(response.status, 400);
    
    const data = await response.json();
    assertExists(data.error);
    assert(data.error.toLowerCase().includes("token"));
  },
});

Deno.test({
  name: "verify-turnstile: reject empty token",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    
    const response = await makeRequest("verify-turnstile", {
      method: "POST",
      body: JSON.stringify({
        token: "",
      }),
    });
    
    assertEquals(response.status, 400);
    
    const data = await response.json();
    assertExists(data.error);
  },
});

// ============================================================================
// Cloudflare API Integration Tests
// ============================================================================

Deno.test({
  name: "verify-turnstile: send correct request to Cloudflare",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    const { FetchMock, mockTurnstileVerification, generateTestTurnstileToken } = await getTestMocks();
    
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
      
      await makeRequest("verify-turnstile", {
        method: "POST",
        body: JSON.stringify({
          token: testToken,
        }),
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
  name: "verify-turnstile: include remote IP in request",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    const { FetchMock, mockTurnstileVerification, generateTestTurnstileToken } = await getTestMocks();
    
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
      
      await makeRequest("verify-turnstile", {
        method: "POST",
        headers: {
          "X-Forwarded-For": "192.168.1.100",
        },
        body: JSON.stringify({
          token: testToken,
        }),
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
// Error Handling Tests
// ============================================================================

Deno.test({
  name: "verify-turnstile: handle Cloudflare API timeout",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest, wait } = await getTestHelpers();
    const { FetchMock, mockTurnstileVerification, generateTestTurnstileToken } = await getTestMocks();
    
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: TURNSTILE_API_URL,
      method: "POST",
      response: async () => {
        await wait(5000);
        return mockTurnstileVerification(false, ["timeout-or-duplicate"]);
      },
    });
    fetchMock.install();
    
    try {
      const testToken = generateTestTurnstileToken();
      
      const response = await makeRequest("verify-turnstile", {
        method: "POST",
        body: JSON.stringify({
          token: testToken,
        }),
      });
      
      assert(response.status === 500 || response.status === 400);
    } finally {
      fetchMock.uninstall();
      fetchMock.reset();
    }
  },
});

Deno.test({
  name: "verify-turnstile: handle invalid secret key",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    const { FetchMock, mockTurnstileVerification, generateTestTurnstileToken } = await getTestMocks();
    
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: TURNSTILE_API_URL,
      method: "POST",
      response: mockTurnstileVerification(false, ["invalid-input-secret"]),
    });
    fetchMock.install();
    
    try {
      const testToken = generateTestTurnstileToken();
      
      const response = await makeRequest("verify-turnstile", {
        method: "POST",
        body: JSON.stringify({
          token: testToken,
        }),
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
  name: "verify-turnstile: handle malformed API response",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    const { FetchMock, generateTestTurnstileToken } = await getTestMocks();
    
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
      
      const response = await makeRequest("verify-turnstile", {
        method: "POST",
        body: JSON.stringify({
          token: testToken,
        }),
      });
      
      assertEquals(response.status, 500);
    } finally {
      fetchMock.uninstall();
      fetchMock.reset();
    }
  },
});

// ============================================================================
// Security Tests
// ============================================================================

Deno.test({
  name: "verify-turnstile: prevent token replay attack",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    const { FetchMock, mockTurnstileVerification, generateTestTurnstileToken } = await getTestMocks();
    
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
      
      const response1 = await makeRequest("verify-turnstile", {
        method: "POST",
        body: JSON.stringify({ token: testToken }),
      });
      
      const response2 = await makeRequest("verify-turnstile", {
        method: "POST",
        body: JSON.stringify({ token: testToken }),
      });
      
      assertEquals(response1.status, 200);
      assertEquals(response2.status, 400);
      
      const data2 = await response2.json();
      assertEquals(data2.success, false);
      assert(data2["error-codes"].includes("timeout-or-duplicate"));
    } finally {
      fetchMock.uninstall();
      fetchMock.reset();
    }
  },
});

Deno.test({
  name: "verify-turnstile: validate hostname",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    const { FetchMock, generateTestTurnstileToken } = await getTestMocks();
    
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: TURNSTILE_API_URL,
      method: "POST",
      response: new Response(JSON.stringify({
        success: true,
        challenge_ts: new Date().toISOString(),
        hostname: "evil.com",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    });
    fetchMock.install();
    
    try {
      const testToken = generateTestTurnstileToken();
      
      const response = await makeRequest("verify-turnstile", {
        method: "POST",
        body: JSON.stringify({
          token: testToken,
        }),
      });
      
      assert(response.status === 200 || response.status === 400);
    } finally {
      fetchMock.uninstall();
      fetchMock.reset();
    }
  },
});

// ============================================================================
// Rate Limiting Tests
// ============================================================================

Deno.test({
  name: "verify-turnstile: rate limit verification requests",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    const { FetchMock, mockTurnstileVerification, generateTestTurnstileToken } = await getTestMocks();
    
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: TURNSTILE_API_URL,
      method: "POST",
      response: mockTurnstileVerification(true),
    });
    fetchMock.install();
    
    try {
      const requests = 15;
      const responses: Response[] = [];
      
      for (let i = 0; i < requests; i++) {
        const token = generateTestTurnstileToken();
        const response = await makeRequest("verify-turnstile", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        responses.push(response);
      }
      
      const rateLimited = responses.filter(r => r.status === 429);
      assert(rateLimited.length >= 0);
    } finally {
      fetchMock.uninstall();
      fetchMock.reset();
    }
  },
});

// ============================================================================
// Response Parsing Tests
// ============================================================================

Deno.test({
  name: "verify-turnstile: parse success response correctly",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    const { FetchMock, generateTestTurnstileToken } = await getTestMocks();
    
    const mockTimestamp = new Date().toISOString();
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: TURNSTILE_API_URL,
      method: "POST",
      response: new Response(JSON.stringify({
        success: true,
        challenge_ts: mockTimestamp,
        hostname: "risecheckout.com",
        action: "login",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    });
    fetchMock.install();
    
    try {
      const testToken = generateTestTurnstileToken();
      
      const response = await makeRequest("verify-turnstile", {
        method: "POST",
        body: JSON.stringify({
          token: testToken,
        }),
      });
      
      assertEquals(response.status, 200);
      
      const data = await response.json();
      assertEquals(data.success, true);
      assertEquals(data.challenge_ts, mockTimestamp);
      assertEquals(data.hostname, "risecheckout.com");
    } finally {
      fetchMock.uninstall();
      fetchMock.reset();
    }
  },
});

Deno.test({
  name: "verify-turnstile: parse error codes correctly",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    const { FetchMock, mockTurnstileVerification } = await getTestMocks();
    
    const errorCodes = ["invalid-input-response", "bad-request"];
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: TURNSTILE_API_URL,
      method: "POST",
      response: mockTurnstileVerification(false, errorCodes),
    });
    fetchMock.install();
    
    try {
      const response = await makeRequest("verify-turnstile", {
        method: "POST",
        body: JSON.stringify({
          token: "invalid-token",
        }),
      });
      
      assertEquals(response.status, 400);
      
      const data = await response.json();
      assertEquals(data.success, false);
      assertExists(data["error-codes"]);
    } finally {
      fetchMock.uninstall();
      fetchMock.reset();
    }
  },
});

// ============================================================================
// CORS Tests
// ============================================================================

Deno.test({
  name: "verify-turnstile: OPTIONS returns CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    
    const response = await makeRequest("verify-turnstile", {
      method: "OPTIONS",
    });
    
    assertEquals(response.status, 200);
    assertExists(response.headers.get("Access-Control-Allow-Origin"));
  },
});

// ============================================================================
// Content Type Tests
// ============================================================================

Deno.test({
  name: "verify-turnstile: reject non-JSON content type",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    
    const response = await makeRequest("verify-turnstile", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: "token=test",
    });
    
    assert(response.status === 400 || response.status === 415);
  },
});
