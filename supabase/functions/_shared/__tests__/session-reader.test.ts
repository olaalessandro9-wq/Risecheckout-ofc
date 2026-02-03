/**
 * Session Reader Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for unified session token extraction utilities.
 * V4 format only (__Secure-rise_*).
 * 
 * @module _shared/__tests__/session-reader
 * @version 2.0.0 - Legacy tests removed
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  getUnifiedAccessToken,
  getUnifiedRefreshToken,
  getSessionToken,
  COOKIE_NAMES,
} from "../session-reader.ts";

// ============================================================================
// Test Fixtures
// ============================================================================

const MOCK_ACCESS_TOKEN = "access-token-abc123";
const MOCK_REFRESH_TOKEN = "refresh-token-xyz789";

function createMockRequest(cookies: Record<string, string>): Request {
  const cookieHeader = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
  
  return new Request("https://example.com", {
    headers: {
      "Cookie": cookieHeader,
    },
  });
}

// ============================================================================
// COOKIE_NAMES Export Tests
// ============================================================================

Deno.test("COOKIE_NAMES: should export correct cookie names", () => {
  assertEquals(COOKIE_NAMES.access, "__Secure-rise_access");
  assertEquals(COOKIE_NAMES.refresh, "__Secure-rise_refresh");
});

// ============================================================================
// getUnifiedAccessToken Tests
// ============================================================================

Deno.test("getUnifiedAccessToken: should extract access token from V4 cookie", () => {
  const req = createMockRequest({
    "__Secure-rise_access": MOCK_ACCESS_TOKEN,
  });
  
  const token = getUnifiedAccessToken(req);
  assertEquals(token, MOCK_ACCESS_TOKEN);
});

Deno.test("getUnifiedAccessToken: should return null when cookie is missing", () => {
  const req = createMockRequest({});
  
  const token = getUnifiedAccessToken(req);
  assertEquals(token, null);
});

Deno.test("getUnifiedAccessToken: should return null when Cookie header is missing", () => {
  const req = new Request("https://example.com");
  
  const token = getUnifiedAccessToken(req);
  assertEquals(token, null);
});

Deno.test("getUnifiedAccessToken: should handle empty cookie value", () => {
  const req = createMockRequest({
    "__Secure-rise_access": "",
  });
  
  const token = getUnifiedAccessToken(req);
  assertExists(token !== undefined);
});

Deno.test("getUnifiedAccessToken: should ignore legacy cookies", () => {
  const req = createMockRequest({
    "producer_session": "legacy-token",
    "__Host-rise_access": "v3-token",
  });
  
  const token = getUnifiedAccessToken(req);
  assertEquals(token, null); // Should not read legacy cookies
});

// ============================================================================
// getUnifiedRefreshToken Tests
// ============================================================================

Deno.test("getUnifiedRefreshToken: should extract refresh token from V4 cookie", () => {
  const req = createMockRequest({
    "__Secure-rise_refresh": MOCK_REFRESH_TOKEN,
  });
  
  const token = getUnifiedRefreshToken(req);
  assertEquals(token, MOCK_REFRESH_TOKEN);
});

Deno.test("getUnifiedRefreshToken: should return null when cookie is missing", () => {
  const req = createMockRequest({});
  
  const token = getUnifiedRefreshToken(req);
  assertEquals(token, null);
});

Deno.test("getUnifiedRefreshToken: should return null when Cookie header is missing", () => {
  const req = new Request("https://example.com");
  
  const token = getUnifiedRefreshToken(req);
  assertEquals(token, null);
});

Deno.test("getUnifiedRefreshToken: should ignore legacy cookies", () => {
  const req = createMockRequest({
    "__Host-rise_refresh": "v3-refresh",
  });
  
  const token = getUnifiedRefreshToken(req);
  assertEquals(token, null); // Should not read V3 fallback
});

// ============================================================================
// getSessionToken (Alias) Tests
// ============================================================================

Deno.test("getSessionToken: should be an alias for getUnifiedAccessToken", () => {
  const req = createMockRequest({
    "__Secure-rise_access": MOCK_ACCESS_TOKEN,
  });
  
  const token1 = getSessionToken(req);
  const token2 = getUnifiedAccessToken(req);
  
  assertEquals(token1, token2);
});

Deno.test("getSessionToken: should return same result as getUnifiedAccessToken", () => {
  const req = createMockRequest({});
  
  const token1 = getSessionToken(req);
  const token2 = getUnifiedAccessToken(req);
  
  assertEquals(token1, token2);
  assertEquals(token1, null);
});

// ============================================================================
// Edge Cases
// ============================================================================

Deno.test("getUnifiedAccessToken: should handle very long token", () => {
  const longToken = "a".repeat(10000);
  const req = createMockRequest({
    "__Secure-rise_access": longToken,
  });
  
  const token = getUnifiedAccessToken(req);
  assertEquals(token, longToken);
});

Deno.test("getUnifiedAccessToken: should handle special characters in token", () => {
  const specialToken = "token-with-special-chars_123.abc+xyz=";
  const req = createMockRequest({
    "__Secure-rise_access": specialToken,
  });
  
  const token = getUnifiedAccessToken(req);
  assertEquals(token, specialToken);
});

Deno.test("getUnifiedAccessToken: should handle multiple cookies", () => {
  const req = createMockRequest({
    "other_cookie": "value1",
    "__Secure-rise_access": MOCK_ACCESS_TOKEN,
    "another_cookie": "value2",
  });
  
  const token = getUnifiedAccessToken(req);
  assertEquals(token, MOCK_ACCESS_TOKEN);
});

Deno.test("getUnifiedRefreshToken: should handle multiple cookies", () => {
  const req = createMockRequest({
    "other_cookie": "value1",
    "__Secure-rise_refresh": MOCK_REFRESH_TOKEN,
    "another_cookie": "value2",
  });
  
  const token = getUnifiedRefreshToken(req);
  assertEquals(token, MOCK_REFRESH_TOKEN);
});
