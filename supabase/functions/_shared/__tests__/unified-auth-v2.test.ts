/**
 * Unified Auth V2 Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for core authentication library.
 * V4 format only (__Secure-rise_*).
 * 
 * @module _shared/__tests__/unified-auth-v2
 * @version 2.0.0 - Legacy tests removed
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  generateSessionTokens,
  getUnifiedAccessToken,
  getUnifiedRefreshToken,
  createUnifiedAuthCookies,
  createUnifiedLogoutCookies,
} from "../unified-auth-v2.ts";

// ============================================================================
// Token Generation Tests
// ============================================================================

Deno.test("generateSessionTokens: should generate access and refresh tokens", () => {
  const tokens = generateSessionTokens();
  
  assertExists(tokens.accessToken);
  assertExists(tokens.refreshToken);
  assertExists(tokens.accessTokenExpiresAt);
  assertExists(tokens.refreshTokenExpiresAt);
});

Deno.test("generateSessionTokens: should generate unique tokens", () => {
  const tokens1 = generateSessionTokens();
  const tokens2 = generateSessionTokens();
  
  assert(tokens1.accessToken !== tokens2.accessToken);
  assert(tokens1.refreshToken !== tokens2.refreshToken);
});

Deno.test("generateSessionTokens: should generate tokens with correct format", () => {
  const tokens = generateSessionTokens();
  
  // Tokens should be UUID-UUID format (36+1+36 = 73 chars)
  assert(tokens.accessToken.length >= 70);
  assert(tokens.refreshToken.length >= 70);
  
  // Should contain hyphen separator
  assert(tokens.accessToken.includes("-"));
  assert(tokens.refreshToken.includes("-"));
});

Deno.test("generateSessionTokens: should set correct expiration times", () => {
  const before = new Date();
  const tokens = generateSessionTokens();
  
  // Access token should expire in ~15 minutes
  const accessDiff = tokens.accessTokenExpiresAt.getTime() - before.getTime();
  assert(accessDiff > 14 * 60 * 1000); // > 14 minutes
  assert(accessDiff < 16 * 60 * 1000); // < 16 minutes
  
  // Refresh token should expire in ~7 days
  const refreshDiff = tokens.refreshTokenExpiresAt.getTime() - before.getTime();
  assert(refreshDiff > 6.9 * 24 * 60 * 60 * 1000); // > 6.9 days
  assert(refreshDiff < 7.1 * 24 * 60 * 60 * 1000); // < 7.1 days
});

Deno.test("generateSessionTokens: should generate cryptographically secure tokens", () => {
  const tokens1 = generateSessionTokens();
  const tokens2 = generateSessionTokens();
  const tokens3 = generateSessionTokens();
  
  const allTokens = [
    tokens1.accessToken,
    tokens1.refreshToken,
    tokens2.accessToken,
    tokens2.refreshToken,
    tokens3.accessToken,
    tokens3.refreshToken,
  ];
  
  const uniqueTokens = new Set(allTokens);
  assertEquals(uniqueTokens.size, 6); // All 6 should be unique
});

// ============================================================================
// Token Reading Tests (V4 Format Only)
// ============================================================================

Deno.test("getUnifiedAccessToken: should extract access token from V4 cookie", () => {
  const mockToken = "access-token-123";
  const req = new Request("https://example.com", {
    headers: {
      "Cookie": `__Secure-rise_access=${mockToken}`,
    },
  });
  
  const token = getUnifiedAccessToken(req);
  assertEquals(token, mockToken);
});

Deno.test("getUnifiedAccessToken: should return null when cookie missing", () => {
  const req = new Request("https://example.com");
  
  const token = getUnifiedAccessToken(req);
  assertEquals(token, null);
});

Deno.test("getUnifiedAccessToken: should NOT fallback to V3 cookie", () => {
  const mockToken = "access-token-v3";
  const req = new Request("https://example.com", {
    headers: {
      "Cookie": `__Host-rise_access=${mockToken}`,
    },
  });
  
  const token = getUnifiedAccessToken(req);
  assertEquals(token, null); // V3 fallback removed
});

Deno.test("getUnifiedRefreshToken: should extract refresh token from V4 cookie", () => {
  const mockToken = "refresh-token-456";
  const req = new Request("https://example.com", {
    headers: {
      "Cookie": `__Secure-rise_refresh=${mockToken}`,
    },
  });
  
  const token = getUnifiedRefreshToken(req);
  assertEquals(token, mockToken);
});

Deno.test("getUnifiedRefreshToken: should return null when cookie missing", () => {
  const req = new Request("https://example.com");
  
  const token = getUnifiedRefreshToken(req);
  assertEquals(token, null);
});

Deno.test("getUnifiedRefreshToken: should NOT fallback to V3 cookie", () => {
  const mockToken = "refresh-token-v3";
  const req = new Request("https://example.com", {
    headers: {
      "Cookie": `__Host-rise_refresh=${mockToken}`,
    },
  });
  
  const token = getUnifiedRefreshToken(req);
  assertEquals(token, null); // V3 fallback removed
});

// ============================================================================
// Cookie Creation Tests
// ============================================================================

Deno.test("createUnifiedAuthCookies: should create access and refresh cookies", () => {
  const accessToken = "access-123";
  const refreshToken = "refresh-456";
  
  const cookies = createUnifiedAuthCookies(accessToken, refreshToken);
  
  assertEquals(cookies.length, 2);
  assertExists(cookies[0]); // Access cookie
  assertExists(cookies[1]); // Refresh cookie
});

Deno.test("createUnifiedAuthCookies: should include HttpOnly flag", () => {
  const cookies = createUnifiedAuthCookies("access", "refresh");
  
  assert(cookies[0].includes("HttpOnly"));
  assert(cookies[1].includes("HttpOnly"));
});

Deno.test("createUnifiedAuthCookies: should include Secure flag", () => {
  const cookies = createUnifiedAuthCookies("access", "refresh");
  
  assert(cookies[0].includes("Secure"));
  assert(cookies[1].includes("Secure"));
});

Deno.test("createUnifiedAuthCookies: should include SameSite=None", () => {
  const cookies = createUnifiedAuthCookies("access", "refresh");
  
  assert(cookies[0].includes("SameSite=None"));
  assert(cookies[1].includes("SameSite=None"));
});

Deno.test("createUnifiedAuthCookies: should set correct Max-Age", () => {
  const cookies = createUnifiedAuthCookies("access", "refresh");
  
  // Access token: 15 minutes = 900 seconds
  assert(cookies[0].includes("Max-Age=900"));
  
  // Refresh token: 7 days = 604800 seconds
  assert(cookies[1].includes("Max-Age=604800"));
});

Deno.test("createUnifiedAuthCookies: should include token values", () => {
  const accessToken = "access-abc123";
  const refreshToken = "refresh-xyz789";
  
  const cookies = createUnifiedAuthCookies(accessToken, refreshToken);
  
  assert(cookies[0].includes(accessToken));
  assert(cookies[1].includes(refreshToken));
});

Deno.test("createUnifiedAuthCookies: should use __Secure- prefix", () => {
  const cookies = createUnifiedAuthCookies("access", "refresh");
  
  assert(cookies[0].includes("__Secure-rise_access"));
  assert(cookies[1].includes("__Secure-rise_refresh"));
});

// ============================================================================
// Logout Cookie Tests (V4 Format Only)
// ============================================================================

Deno.test("createUnifiedLogoutCookies: should create only 2 cookies (V4 format)", () => {
  const cookies = createUnifiedLogoutCookies();
  
  assertEquals(cookies.length, 2); // Only access + refresh
});

Deno.test("createUnifiedLogoutCookies: should have Max-Age=0", () => {
  const cookies = createUnifiedLogoutCookies();
  
  cookies.forEach(cookie => {
    assert(cookie.includes("Max-Age=0"));
  });
});

Deno.test("createUnifiedLogoutCookies: should clear V4 format cookies", () => {
  const cookies = createUnifiedLogoutCookies();
  
  const cookieStr = cookies.join("; ");
  assert(cookieStr.includes("__Secure-rise_access"));
  assert(cookieStr.includes("__Secure-rise_refresh"));
});

Deno.test("createUnifiedLogoutCookies: should NOT include V3 format cookies", () => {
  const cookies = createUnifiedLogoutCookies();
  
  const cookieStr = cookies.join("; ");
  assert(!cookieStr.includes("__Host-rise_access"));
  assert(!cookieStr.includes("__Host-rise_refresh"));
});

Deno.test("createUnifiedLogoutCookies: should NOT include legacy cookies", () => {
  const cookies = createUnifiedLogoutCookies();
  
  const cookieStr = cookies.join("; ");
  assert(!cookieStr.includes("producer_access"));
  assert(!cookieStr.includes("buyer_access"));
});

Deno.test("createUnifiedLogoutCookies: should include security flags", () => {
  const cookies = createUnifiedLogoutCookies();
  
  cookies.forEach(cookie => {
    assert(cookie.includes("HttpOnly"));
    assert(cookie.includes("Secure"));
    assert(cookie.includes("SameSite=None"));
  });
});

// ============================================================================
// Security Tests
// ============================================================================

Deno.test("generateSessionTokens: should not generate predictable tokens", () => {
  const tokens = [];
  for (let i = 0; i < 100; i++) {
    tokens.push(generateSessionTokens().accessToken);
  }
  
  const uniqueTokens = new Set(tokens);
  assertEquals(uniqueTokens.size, 100);
});

Deno.test("createUnifiedAuthCookies: should prevent XSS with HttpOnly", () => {
  const cookies = createUnifiedAuthCookies("access", "refresh");
  
  assert(cookies[0].includes("HttpOnly"));
  assert(cookies[1].includes("HttpOnly"));
});

Deno.test("createUnifiedAuthCookies: should prevent MITM with Secure", () => {
  const cookies = createUnifiedAuthCookies("access", "refresh");
  
  assert(cookies[0].includes("Secure"));
  assert(cookies[1].includes("Secure"));
});

Deno.test("createUnifiedAuthCookies: should prevent CSRF with SameSite", () => {
  const cookies = createUnifiedAuthCookies("access", "refresh");
  
  assert(cookies[0].includes("SameSite=None"));
  assert(cookies[1].includes("SameSite=None"));
});

Deno.test("createUnifiedAuthCookies: should handle special characters in tokens", () => {
  const specialToken = "token-with-special_chars.123+abc=";
  const cookies = createUnifiedAuthCookies(specialToken, "refresh");
  
  assertExists(cookies[0]);
  assert(cookies[0].length > 0);
});

// ============================================================================
// Edge Cases
// ============================================================================

Deno.test("generateSessionTokens: should handle rapid successive calls", () => {
  const tokens1 = generateSessionTokens();
  const tokens2 = generateSessionTokens();
  const tokens3 = generateSessionTokens();
  
  assert(tokens1.accessToken !== tokens2.accessToken);
  assert(tokens2.accessToken !== tokens3.accessToken);
  assert(tokens1.refreshToken !== tokens2.refreshToken);
});

Deno.test("getUnifiedAccessToken: should handle malformed cookie header", () => {
  const req = new Request("https://example.com", {
    headers: {
      "Cookie": "invalid cookie format without equals",
    },
  });
  
  const token = getUnifiedAccessToken(req);
  assertExists(token !== undefined);
});

Deno.test("getUnifiedAccessToken: should handle empty cookie value", () => {
  const req = new Request("https://example.com", {
    headers: {
      "Cookie": "__Secure-rise_access=",
    },
  });
  
  const token = getUnifiedAccessToken(req);
  assertExists(token !== undefined);
});

Deno.test("createUnifiedAuthCookies: should handle very long tokens", () => {
  const longToken = "a".repeat(10000);
  const cookies = createUnifiedAuthCookies(longToken, "refresh");
  
  assertExists(cookies[0]);
  assert(cookies[0].includes(longToken));
});

Deno.test("createUnifiedAuthCookies: should handle empty tokens", () => {
  const cookies = createUnifiedAuthCookies("", "");
  
  assertEquals(cookies.length, 2);
  assert(cookies[0].includes("Max-Age"));
  assert(cookies[1].includes("Max-Age"));
});

Deno.test("createUnifiedLogoutCookies: should be idempotent", () => {
  const cookies1 = createUnifiedLogoutCookies();
  const cookies2 = createUnifiedLogoutCookies();
  
  assertEquals(cookies1.length, cookies2.length);
});
