/**
 * Rate Limiting Service Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for rate limiting utilities (IP extraction, identifier generation).
 * CRITICAL: Rate limiting protects against abuse and DDoS attacks.
 * 
 * @module _shared/rate-limiting/service.test
 */

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  getClientIP,
  getIdentifier,
  createRateLimitResponse,
} from "./service.ts";
import type { RateLimitResult } from "./types.ts";

// ============================================================================
// getClientIP Tests
// ============================================================================

Deno.test("getClientIP: should extract IP from cf-connecting-ip", () => {
  const req = new Request("http://test.com", {
    headers: { "cf-connecting-ip": "192.168.1.1" },
  });
  
  assertEquals(getClientIP(req), "192.168.1.1");
});

Deno.test("getClientIP: should extract IP from x-real-ip", () => {
  const req = new Request("http://test.com", {
    headers: { "x-real-ip": "10.0.0.1" },
  });
  
  assertEquals(getClientIP(req), "10.0.0.1");
});

Deno.test("getClientIP: should extract IP from x-forwarded-for", () => {
  const req = new Request("http://test.com", {
    headers: { "x-forwarded-for": "203.0.113.1" },
  });
  
  assertEquals(getClientIP(req), "203.0.113.1");
});

Deno.test("getClientIP: should extract first IP from x-forwarded-for chain", () => {
  const req = new Request("http://test.com", {
    headers: { "x-forwarded-for": "203.0.113.1, 70.41.3.18, 150.172.238.178" },
  });
  
  assertEquals(getClientIP(req), "203.0.113.1");
});

Deno.test("getClientIP: should extract IP from x-client-ip", () => {
  const req = new Request("http://test.com", {
    headers: { "x-client-ip": "172.16.0.1" },
  });
  
  assertEquals(getClientIP(req), "172.16.0.1");
});

Deno.test("getClientIP: should prioritize cf-connecting-ip over others", () => {
  const req = new Request("http://test.com", {
    headers: {
      "cf-connecting-ip": "192.168.1.1",
      "x-real-ip": "10.0.0.1",
      "x-forwarded-for": "203.0.113.1",
    },
  });
  
  assertEquals(getClientIP(req), "192.168.1.1");
});

Deno.test("getClientIP: should prioritize x-real-ip over x-forwarded-for", () => {
  const req = new Request("http://test.com", {
    headers: {
      "x-real-ip": "10.0.0.1",
      "x-forwarded-for": "203.0.113.1",
    },
  });
  
  assertEquals(getClientIP(req), "10.0.0.1");
});

Deno.test("getClientIP: should return 'unknown' when no IP headers", () => {
  const req = new Request("http://test.com");
  
  assertEquals(getClientIP(req), "unknown");
});

Deno.test("getClientIP: should handle empty header value", () => {
  const req = new Request("http://test.com", {
    headers: { "cf-connecting-ip": "" },
  });
  
  assertEquals(getClientIP(req), "unknown");
});

Deno.test("getClientIP: should handle 'unknown' header value", () => {
  const req = new Request("http://test.com", {
    headers: { "cf-connecting-ip": "unknown" },
  });
  
  assertEquals(getClientIP(req), "unknown");
});

Deno.test("getClientIP: should trim whitespace", () => {
  const req = new Request("http://test.com", {
    headers: { "cf-connecting-ip": "  192.168.1.1  " },
  });
  
  assertEquals(getClientIP(req), "192.168.1.1");
});

Deno.test("getClientIP: should handle IPv6 address", () => {
  const req = new Request("http://test.com", {
    headers: { "cf-connecting-ip": "2001:0db8:85a3:0000:0000:8a2e:0370:7334" },
  });
  
  assertEquals(getClientIP(req), "2001:0db8:85a3:0000:0000:8a2e:0370:7334");
});

// ============================================================================
// getIdentifier Tests
// ============================================================================

Deno.test("getIdentifier: should return user identifier when userId provided", () => {
  const req = new Request("http://test.com", {
    headers: { "cf-connecting-ip": "192.168.1.1" },
  });
  
  const result = getIdentifier(req, "user-123");
  
  assertEquals(result, "user:user-123");
});

Deno.test("getIdentifier: should return IP identifier when no userId", () => {
  const req = new Request("http://test.com", {
    headers: { "cf-connecting-ip": "192.168.1.1" },
  });
  
  const result = getIdentifier(req);
  
  assertEquals(result, "ip:192.168.1.1");
});

Deno.test("getIdentifier: should prefer userId when preferUserId=true", () => {
  const req = new Request("http://test.com", {
    headers: { "cf-connecting-ip": "192.168.1.1" },
  });
  
  const result = getIdentifier(req, "user-456", true);
  
  assertEquals(result, "user:user-456");
});

Deno.test("getIdentifier: should fallback to IP when preferUserId=true but no userId", () => {
  const req = new Request("http://test.com", {
    headers: { "cf-connecting-ip": "192.168.1.1" },
  });
  
  const result = getIdentifier(req, undefined, true);
  
  assertEquals(result, "ip:192.168.1.1");
});

Deno.test("getIdentifier: should handle unknown IP with no userId", () => {
  const req = new Request("http://test.com");
  
  const result = getIdentifier(req);
  
  assertEquals(result, "ip:unknown");
});

// ============================================================================
// createRateLimitResponse Tests
// ============================================================================

Deno.test("createRateLimitResponse: should return 429 status", async () => {
  const result: RateLimitResult = {
    allowed: false,
    remaining: 0,
    retryAfter: "2024-01-15T12:00:00Z",
    error: "Too many requests",
  };
  
  const corsHeaders = { "Access-Control-Allow-Origin": "*" };
  const response = createRateLimitResponse(result, corsHeaders);
  
  assertEquals(response.status, 429);
});

Deno.test("createRateLimitResponse: should include CORS headers", async () => {
  const result: RateLimitResult = {
    allowed: false,
    remaining: 0,
    error: "Rate limit exceeded",
  };
  
  const corsHeaders = { "Access-Control-Allow-Origin": "https://example.com" };
  const response = createRateLimitResponse(result, corsHeaders);
  
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "https://example.com");
});

Deno.test("createRateLimitResponse: should include Retry-After header", async () => {
  const result: RateLimitResult = {
    allowed: false,
    remaining: 0,
    retryAfter: "2024-01-15T12:00:00Z",
    error: "Rate limit exceeded",
  };
  
  const corsHeaders = {};
  const response = createRateLimitResponse(result, corsHeaders);
  
  assertEquals(response.headers.get("Retry-After"), "2024-01-15T12:00:00Z");
});

Deno.test("createRateLimitResponse: should default Retry-After to 60", async () => {
  const result: RateLimitResult = {
    allowed: false,
    remaining: 0,
    error: "Rate limit exceeded",
  };
  
  const corsHeaders = {};
  const response = createRateLimitResponse(result, corsHeaders);
  
  assertEquals(response.headers.get("Retry-After"), "60");
});

Deno.test("createRateLimitResponse: should include error message in body", async () => {
  const result: RateLimitResult = {
    allowed: false,
    remaining: 0,
    error: "Custom error message",
  };
  
  const corsHeaders = {};
  const response = createRateLimitResponse(result, corsHeaders);
  const body = await response.json();
  
  assertEquals(body.success, false);
  assertEquals(body.error, "Custom error message");
});

Deno.test("createRateLimitResponse: should use default error message", async () => {
  const result: RateLimitResult = {
    allowed: false,
    remaining: 0,
  };
  
  const corsHeaders = {};
  const response = createRateLimitResponse(result, corsHeaders);
  const body = await response.json();
  
  assertStringIncludes(body.error, "Muitas requisições");
});

Deno.test("createRateLimitResponse: should include retryAfter in body", async () => {
  const result: RateLimitResult = {
    allowed: false,
    remaining: 0,
    retryAfter: "2024-01-15T12:00:00Z",
    error: "Rate limit exceeded",
  };
  
  const corsHeaders = {};
  const response = createRateLimitResponse(result, corsHeaders);
  const body = await response.json();
  
  assertEquals(body.retryAfter, "2024-01-15T12:00:00Z");
});

// ============================================================================
// Edge Cases
// ============================================================================

Deno.test("Edge Case: getClientIP with malformed x-forwarded-for", () => {
  const req = new Request("http://test.com", {
    headers: { "x-forwarded-for": ",,,192.168.1.1,," },
  });
  
  // Should handle gracefully
  const ip = getClientIP(req);
  assertExists(ip);
});

Deno.test("Edge Case: getIdentifier with empty string userId", () => {
  const req = new Request("http://test.com", {
    headers: { "cf-connecting-ip": "192.168.1.1" },
  });
  
  const result = getIdentifier(req, "");
  
  // Empty string is falsy, should fallback to IP
  assertEquals(result, "ip:192.168.1.1");
});

Deno.test("Edge Case: getIdentifier with null userId", () => {
  const req = new Request("http://test.com", {
    headers: { "cf-connecting-ip": "192.168.1.1" },
  });
  
  const result = getIdentifier(req, null as unknown as string);
  
  assertEquals(result, "ip:192.168.1.1");
});

Deno.test("Edge Case: createRateLimitResponse with empty corsHeaders", async () => {
  const result: RateLimitResult = {
    allowed: false,
    remaining: 0,
    error: "Test error",
  };
  
  const response = createRateLimitResponse(result, {});
  
  assertEquals(response.status, 429);
  assertEquals(response.headers.get("Content-Type"), "application/json");
});
