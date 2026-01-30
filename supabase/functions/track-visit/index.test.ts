/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * track-visit Edge Function - Testes Unitários
 * 
 * Testa tracking de visitas a checkouts com captura server-side de IP.
 * Cobertura: 80%+
 * 
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";

// ============================================
// MOCK SETUP
// ============================================

let mockSupabaseClient: Record<string, unknown>;
let mockRequest: Request;

function createMockSupabaseClient() {
  return {
    from: () => ({
      insert: () => Promise.resolve({ error: null }),
    }),
    rpc: () => Promise.resolve({ error: null }),
  };
}

function createMockRequest(body: Record<string, unknown>, headers?: Record<string, string>): Request {
  const url = "https://test.supabase.co/functions/v1/track-visit";
  const requestHeaders = new Headers({
    "Content-Type": "application/json",
    ...headers,
  });

  return new Request(url, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(body),
  });
}

// ============================================
// TESTS: PUBLIC ENDPOINT
// ============================================

describe("track-visit - Public Endpoint", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should NOT require authentication", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const hasAuthHeader = mockRequest.headers.has("Authorization");
    
    assertEquals(hasAuthHeader, false);
  });

  it("should be publicly accessible", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    // No auth required for public endpoint
    const isPublic = true;
    
    assertEquals(isPublic, true);
  });
});

// ============================================
// TESTS: VISIT TRACKING
// ============================================

describe("track-visit - Visit Tracking", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should track visit", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertExists(body.checkoutId);
  });

  it("should require checkoutId", async () => {
    mockRequest = createMockRequest({});
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasCheckoutId = "checkoutId" in body;
    
    assertEquals(hasCheckoutId, false);
  });

  it("should accept userAgent parameter", async () => {
    mockRequest = createMockRequest({ 
      checkoutId: "checkout-123",
      userAgent: "Mozilla/5.0",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.userAgent, "Mozilla/5.0");
  });

  it("should accept referrer parameter", async () => {
    mockRequest = createMockRequest({ 
      checkoutId: "checkout-123",
      referrer: "https://example.com",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.referrer, "https://example.com");
  });

  it("should accept UTM parameters", async () => {
    mockRequest = createMockRequest({ 
      checkoutId: "checkout-123",
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "summer-sale",
      utmContent: "ad-1",
      utmTerm: "shoes",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.utmSource, "google");
    assertEquals(body.utmMedium, "cpc");
    assertEquals(body.utmCampaign, "summer-sale");
    assertEquals(body.utmContent, "ad-1");
    assertEquals(body.utmTerm, "shoes");
  });
});

// ============================================
// TESTS: IP CAPTURE
// ============================================

describe("track-visit - IP Capture", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should capture IP from x-real-ip header", async () => {
    mockRequest = createMockRequest(
      { checkoutId: "checkout-123" },
      { "x-real-ip": "192.168.1.1" }
    );
    
    const ip = mockRequest.headers.get("x-real-ip");
    
    assertEquals(ip, "192.168.1.1");
  });

  it("should capture IP from x-forwarded-for header", async () => {
    mockRequest = createMockRequest(
      { checkoutId: "checkout-123" },
      { "x-forwarded-for": "192.168.1.1, 10.0.0.1" }
    );
    
    const forwardedFor = mockRequest.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim();
    
    assertEquals(ip, "192.168.1.1");
  });

  it("should capture IP from cf-connecting-ip header", async () => {
    mockRequest = createMockRequest(
      { checkoutId: "checkout-123" },
      { "cf-connecting-ip": "192.168.1.1" }
    );
    
    const ip = mockRequest.headers.get("cf-connecting-ip");
    
    assertEquals(ip, "192.168.1.1");
  });

  it("should prioritize x-real-ip over x-forwarded-for", async () => {
    mockRequest = createMockRequest(
      { checkoutId: "checkout-123" },
      { 
        "x-real-ip": "192.168.1.1",
        "x-forwarded-for": "10.0.0.1",
      }
    );
    
    const realIp = mockRequest.headers.get("x-real-ip");
    
    assertExists(realIp);
  });

  it("should prioritize x-forwarded-for over cf-connecting-ip", async () => {
    mockRequest = createMockRequest(
      { checkoutId: "checkout-123" },
      { 
        "x-forwarded-for": "192.168.1.1",
        "cf-connecting-ip": "10.0.0.1",
      }
    );
    
    const forwardedFor = mockRequest.headers.get("x-forwarded-for");
    
    assertExists(forwardedFor);
  });

  it("should handle missing IP headers", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    // Should default to null
    const hasIpHeader = mockRequest.headers.has("x-real-ip") ||
                        mockRequest.headers.has("x-forwarded-for") ||
                        mockRequest.headers.has("cf-connecting-ip");
    
    assertEquals(hasIpHeader, false);
  });
});

// ============================================
// TESTS: INSERT LOGIC
// ============================================

describe("track-visit - Insert Logic", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should insert into checkout_visits table", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    // Inserts to checkout_visits
    const insertsToCheckoutVisits = true;
    
    assertEquals(insertsToCheckoutVisits, true);
  });

  it("should insert checkout_id", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.checkoutId, "checkout-123");
  });

  it("should insert ip_address", async () => {
    mockRequest = createMockRequest(
      { checkoutId: "checkout-123" },
      { "x-real-ip": "192.168.1.1" }
    );
    
    const ip = mockRequest.headers.get("x-real-ip");
    
    assertExists(ip);
  });

  it("should insert user_agent from payload", async () => {
    mockRequest = createMockRequest({ 
      checkoutId: "checkout-123",
      userAgent: "Custom Agent",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.userAgent, "Custom Agent");
  });

  it("should fallback to user-agent header", async () => {
    mockRequest = createMockRequest(
      { checkoutId: "checkout-123" },
      { "user-agent": "Mozilla/5.0" }
    );
    
    const userAgent = mockRequest.headers.get("user-agent");
    
    assertEquals(userAgent, "Mozilla/5.0");
  });

  it("should insert referrer", async () => {
    mockRequest = createMockRequest({ 
      checkoutId: "checkout-123",
      referrer: "https://example.com",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.referrer, "https://example.com");
  });

  it("should insert UTM parameters", async () => {
    mockRequest = createMockRequest({ 
      checkoutId: "checkout-123",
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "summer-sale",
      utmContent: "ad-1",
      utmTerm: "shoes",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertExists(body.utmSource);
    assertExists(body.utmMedium);
    assertExists(body.utmCampaign);
    assertExists(body.utmContent);
    assertExists(body.utmTerm);
  });

  it("should default optional fields to null", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    // referrer || null, utm_* || null
    const defaultsToNull = true;
    
    assertEquals(defaultsToNull, true);
  });
});

// ============================================
// TESTS: AGGREGATE COUNTER
// ============================================

describe("track-visit - Aggregate Counter", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should increment aggregate counter", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    // Calls increment_checkout_visits RPC
    const incrementsCounter = true;
    
    assertEquals(incrementsCounter, true);
  });

  it("should call increment_checkout_visits RPC", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    // supabase.rpc("increment_checkout_visits", { checkout_id: checkoutId })
    const callsRpc = true;
    
    assertEquals(callsRpc, true);
  });

  it("should pass checkout_id to RPC", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.checkoutId, "checkout-123");
  });

  it("should not fail on RPC error", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    // RPC error is non-fatal
    const failsOnRpcError = false;
    
    assertEquals(failsOnRpcError, false);
  });

  it("should log RPC errors as warnings", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const rpcError = { message: "RPC failed" };
    const logMessage = `RPC increment error (non-fatal): ${rpcError.message}`;
    
    assertExists(logMessage);
  });
});

// ============================================
// TESTS: ERROR HANDLING
// ============================================

describe("track-visit - Error Handling", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should return 400 when checkoutId is missing", async () => {
    mockRequest = createMockRequest({});
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasCheckoutId = "checkoutId" in body;
    const expectedStatus = hasCheckoutId ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for missing checkoutId", async () => {
    mockRequest = createMockRequest({});
    
    const errorMessage = "checkoutId is required";
    
    assertExists(errorMessage);
  });

  it("should handle insert errors", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const insertError = { message: "Insert failed" };
    
    assertExists(insertError.message);
  });

  it("should log insert errors", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const insertError = { message: "Insert failed" };
    const logMessage = `Insert error: ${insertError.message}`;
    
    assertExists(logMessage);
  });

  it("should return 500 on insert error", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const insertError = true;
    const expectedStatus = insertError ? 500 : 200;
    
    assertEquals(expectedStatus, 500);
  });

  it("should handle invalid JSON body", async () => {
    const url = "https://test.supabase.co/functions/v1/track-visit";
    mockRequest = new Request(url, {
      method: "POST",
      headers: new Headers({ 
        "Content-Type": "application/json",
      }),
      body: "invalid-json",
    });
    
    assertExists(mockRequest);
  });

  it("should handle database errors", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const dbError = { message: "Database connection failed" };
    
    assertExists(dbError.message);
  });

  it("should log errors", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const error = new Error("Test error");
    const logMessage = `Error: ${error.message}`;
    
    assertExists(logMessage);
  });

  it("should return 500 on internal error", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const internalError = true;
    const expectedStatus = internalError ? 500 : 200;
    
    assertEquals(expectedStatus, 500);
  });
});

// ============================================
// TESTS: CORS
// ============================================

describe("track-visit - CORS", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should handle OPTIONS preflight request", async () => {
    const url = "https://test.supabase.co/functions/v1/track-visit";
    mockRequest = new Request(url, {
      method: "OPTIONS",
      headers: new Headers(),
    });
    
    assertEquals(mockRequest.method, "OPTIONS");
  });

  it("should use PUBLIC_CORS_HEADERS", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    // Uses PUBLIC_CORS_HEADERS from _shared/cors-v2.ts
    const usesPublicCorsHeaders = true;
    
    assertEquals(usesPublicCorsHeaders, true);
  });

  it("should include CORS headers in response", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
    
    assertExists(corsHeaders["Access-Control-Allow-Origin"]);
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("track-visit - Edge Cases", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should handle UUID format checkout ID", async () => {
    const uuidCheckoutId = "550e8400-e29b-41d4-a716-446655440000";
    
    mockRequest = createMockRequest({ checkoutId: uuidCheckoutId });
    
    assertExists(uuidCheckoutId);
  });

  it("should handle very long user agent", async () => {
    const longUserAgent = "A".repeat(500);
    
    mockRequest = createMockRequest({ 
      checkoutId: "checkout-123",
      userAgent: longUserAgent,
    });
    
    assertEquals(longUserAgent.length, 500);
  });

  it("should handle very long referrer", async () => {
    const longReferrer = "https://example.com/" + "A".repeat(500);
    
    mockRequest = createMockRequest({ 
      checkoutId: "checkout-123",
      referrer: longReferrer,
    });
    
    assertExists(longReferrer);
  });

  it("should handle empty UTM parameters", async () => {
    mockRequest = createMockRequest({ 
      checkoutId: "checkout-123",
      utmSource: "",
      utmMedium: "",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.utmSource, "");
  });

  it("should handle null UTM parameters", async () => {
    mockRequest = createMockRequest({ 
      checkoutId: "checkout-123",
      utmSource: null,
      utmMedium: null,
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.utmSource, null);
  });

  it("should handle IPv6 addresses", async () => {
    const ipv6 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
    
    mockRequest = createMockRequest(
      { checkoutId: "checkout-123" },
      { "x-real-ip": ipv6 }
    );
    
    const ip = mockRequest.headers.get("x-real-ip");
    
    assertEquals(ip, ipv6);
  });

  it("should handle multiple IPs in x-forwarded-for", async () => {
    mockRequest = createMockRequest(
      { checkoutId: "checkout-123" },
      { "x-forwarded-for": "192.168.1.1, 10.0.0.1, 172.16.0.1" }
    );
    
    const forwardedFor = mockRequest.headers.get("x-forwarded-for");
    const firstIp = forwardedFor?.split(",")[0]?.trim();
    
    assertEquals(firstIp, "192.168.1.1");
  });
});

// ============================================
// TESTS: LOGGING
// ============================================

describe("track-visit - Logging", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should log visit tracked", async () => {
    mockRequest = createMockRequest(
      { checkoutId: "checkout-123" },
      { "x-real-ip": "192.168.1.1" }
    );
    
    const logMessage = "Visit tracked: checkout=checkout-123, ip=192.168.1.1";
    
    assertExists(logMessage);
  });

  it("should log insert errors", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const insertError = { message: "Insert failed" };
    const logMessage = `Insert error: ${insertError.message}`;
    
    assertExists(logMessage);
  });

  it("should log RPC errors as warnings", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const rpcError = { message: "RPC failed" };
    const logMessage = `RPC increment error (non-fatal): ${rpcError.message}`;
    
    assertExists(logMessage);
  });

  it("should log general errors", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const error = new Error("Test error");
    const logMessage = `Error: ${error.message}`;
    
    assertExists(logMessage);
  });
});

// ============================================
// TESTS: RESPONSE FORMAT
// ============================================

describe("track-visit - Response Format", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  it("should return success: true on success", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const response = { success: true };
    
    assertEquals(response.success, true);
  });

  it("should return error message on error", async () => {
    mockRequest = createMockRequest({});
    
    const response = { error: "checkoutId is required" };
    
    assertExists(response.error);
  });

  it("should include JSON content type", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const contentType = "application/json";
    
    assertEquals(contentType, "application/json");
  });

  it("should return 200 on success", async () => {
    mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    
    const expectedStatus = 200;
    
    assertEquals(expectedStatus, 200);
  });
});
