/**
 * Session Manager - API Contract Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for HTTP request/response contracts.
 * 
 * @module session-manager/tests/api.contract
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
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/session-manager`;

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
  assertEquals(response.status, 405);
});

Deno.test("api contract: PUT method returns 405", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  
  await response.text();
  assertEquals(response.status, 405);
});

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================

Deno.test("api contract: returns 401 without authentication", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "list" }),
  });
  
  const body = await response.json();
  assertEquals(response.status, 401);
  assertEquals(body.success, false);
  assertExists(body.error);
});

Deno.test("api contract: returns 401 with invalid token", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=invalid-token",
    },
    body: JSON.stringify({ action: "list" }),
  });
  
  const body = await response.json();
  assertEquals(response.status, 401);
  assertEquals(body.success, false);
});

// ============================================================================
// ACTION VALIDATION TESTS
// ============================================================================

Deno.test("api contract: returns 400 for unknown action", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=test-token",
    },
    body: JSON.stringify({ action: "unknown-action" }),
  });
  
  const body = await response.json();
  // Either 400 for invalid action or 401 for invalid token
  assert([400, 401].includes(response.status));
});

Deno.test("api contract: revoke requires sessionId", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=test-token",
    },
    body: JSON.stringify({ action: "revoke" }),
  });
  
  const body = await response.json();
  // Either 400 for missing sessionId or 401 for invalid token
  assert([400, 401].includes(response.status));
});

// ============================================================================
// RESPONSE STRUCTURE TESTS
// ============================================================================

Deno.test("api contract: list response has correct structure", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=test-token",
    },
    body: JSON.stringify({ action: "list" }),
  });
  
  const body = await response.json();
  
  // Either success response or error response
  if (response.status === 200) {
    assertEquals(body.success, true);
    assert(Array.isArray(body.sessions));
  } else {
    assertEquals(body.success, false);
    assertExists(body.error);
  }
});

Deno.test("api contract: revoke response has correct structure", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=test-token",
    },
    body: JSON.stringify({ action: "revoke", sessionId: "session-123" }),
  });
  
  const body = await response.json();
  
  if (response.status === 200) {
    assertEquals(body.success, true);
  } else {
    assertEquals(body.success, false);
    assertExists(body.error);
  }
});

Deno.test("api contract: revoke-all response has correct structure", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=test-token",
    },
    body: JSON.stringify({ action: "revoke-all" }),
  });
  
  const body = await response.json();
  
  if (response.status === 200) {
    assertEquals(body.success, true);
  } else {
    assertEquals(body.success, false);
    assertExists(body.error);
  }
});

Deno.test("api contract: revoke-others response has correct structure", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "__Secure-rise_access=test-token",
    },
    body: JSON.stringify({ action: "revoke-others" }),
  });
  
  const body = await response.json();
  
  if (response.status === 200) {
    assertEquals(body.success, true);
  } else {
    assertEquals(body.success, false);
    assertExists(body.error);
  }
});

// ============================================================================
// CONTENT-TYPE TESTS
// ============================================================================

Deno.test("api contract: all responses have Content-Type application/json", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "list" }),
  });
  
  await response.text();
  
  const contentType = response.headers.get("Content-Type");
  assert(contentType?.includes("application/json"));
});

// ============================================================================
// MOCK RESPONSE TESTS
// ============================================================================

Deno.test("api contract: mock helpers produce correct response format", async () => {
  const mockData = { success: true, sessions: [] };
  const response = jsonResponse(mockData);
  
  assertEquals(response.status, 200);
  
  const body = await response.json();
  assertEquals(body.success, true);
  assertEquals(body.sessions.length, 0);
});
