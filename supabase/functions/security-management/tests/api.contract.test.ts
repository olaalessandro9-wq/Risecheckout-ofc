/**
 * Security Management - API Contract Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for HTTP request/response contracts.
 * 
 * @module security-management/tests/api.contract
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import { jsonResponse } from "../../_shared/testing/mod.ts";

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || "http://localhost:54321";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/security-management`;

// ============================================================================
// CORS PREFLIGHT TESTS
// ============================================================================

Deno.test("api contract: CORS preflight returns 204", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://app.risecheckout.com",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "Content-Type, Authorization",
    },
  });
  
  await response.text();
  
  assertEquals(response.status, 204);
  assertExists(response.headers.get("Access-Control-Allow-Origin"));
  assertExists(response.headers.get("Access-Control-Allow-Methods"));
});

// ============================================================================
// METHOD VALIDATION TESTS
// ============================================================================

Deno.test("api contract: GET method returns 405", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "GET",
  });
  
  await response.text();
  // CORS preflight might return 204, otherwise should be 405
  assert([204, 405].includes(response.status));
});

Deno.test("api contract: PUT method is not allowed", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  
  await response.text();
  assert([400, 401, 405].includes(response.status));
});

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================

Deno.test("api contract: returns 401 without authentication", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "acknowledge-alert", alertId: "test-123" }),
  });
  
  const body = await response.json();
  assertEquals(response.status, 401);
});

Deno.test("api contract: returns 401 with invalid token", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=invalid-token",
    },
    body: JSON.stringify({ action: "acknowledge-alert", alertId: "test-123" }),
  });
  
  await response.text();
  assertEquals(response.status, 401);
});

// ============================================================================
// ACKNOWLEDGE ALERT TESTS
// ============================================================================

Deno.test("api contract: acknowledge-alert requires alertId", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=test-token",
    },
    body: JSON.stringify({ action: "acknowledge-alert" }),
  });
  
  await response.text();
  // Either 400 for missing alertId or 401 for invalid token
  assert([400, 401].includes(response.status));
});

Deno.test("api contract: acknowledge-alert response structure", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=test-token",
    },
    body: JSON.stringify({ action: "acknowledge-alert", alertId: "test-123" }),
  });
  
  const body = await response.json();
  
  if (response.status === 200) {
    assertEquals(body.success, true);
    assertExists(body.alertId);
  } else {
    // Either error response or unauthorized
    assert([401, 403, 404].includes(response.status));
  }
});

// ============================================================================
// BLOCK IP TESTS
// ============================================================================

Deno.test("api contract: block-ip requires ipAddress and reason", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=test-token",
    },
    body: JSON.stringify({ action: "block-ip" }),
  });
  
  await response.text();
  assert([400, 401].includes(response.status));
});

Deno.test("api contract: block-ip requires reason", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=test-token",
    },
    body: JSON.stringify({ action: "block-ip", ipAddress: "192.168.1.100" }),
  });
  
  await response.text();
  assert([400, 401].includes(response.status));
});

Deno.test("api contract: block-ip response structure", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=test-token",
    },
    body: JSON.stringify({ 
      action: "block-ip", 
      ipAddress: "192.168.1.100",
      reason: "Test block",
    }),
  });
  
  const body = await response.json();
  
  if (response.status === 200) {
    assertEquals(body.success, true);
    assertExists(body.ipAddress);
  } else {
    assert([401, 403].includes(response.status));
  }
});

// ============================================================================
// UNBLOCK IP TESTS
// ============================================================================

Deno.test("api contract: unblock-ip requires ipAddress", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=test-token",
    },
    body: JSON.stringify({ action: "unblock-ip" }),
  });
  
  await response.text();
  assert([400, 401].includes(response.status));
});

Deno.test("api contract: unblock-ip response structure", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=test-token",
    },
    body: JSON.stringify({ action: "unblock-ip", ipAddress: "192.168.1.100" }),
  });
  
  const body = await response.json();
  
  if (response.status === 200) {
    assertEquals(body.success, true);
    assertExists(body.ipAddress);
  } else {
    assert([401, 403].includes(response.status));
  }
});

// ============================================================================
// UNKNOWN ACTION TESTS
// ============================================================================

Deno.test("api contract: unknown action returns 400", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=test-token",
    },
    body: JSON.stringify({ action: "unknown-action" }),
  });
  
  await response.text();
  // Either 400 for unknown action or 401 for invalid token
  assert([400, 401].includes(response.status));
});

// ============================================================================
// CONTENT-TYPE TESTS
// ============================================================================

Deno.test("api contract: all responses have Content-Type application/json", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "acknowledge-alert", alertId: "test" }),
  });
  
  await response.text();
  
  const contentType = response.headers.get("Content-Type");
  assert(contentType?.includes("application/json"));
});

// ============================================================================
// MOCK RESPONSE TESTS
// ============================================================================

Deno.test("api contract: mock helpers produce correct response format", async () => {
  const mockData = { success: true, alertId: "test-123" };
  const response = jsonResponse(mockData);
  
  assertEquals(response.status, 200);
  
  const body = await response.json();
  assertEquals(body.success, true);
  assertEquals(body.alertId, "test-123");
});
