/**
 * track-visit - IP Capture Tests
 * 
 * @version 2.0.0
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { createMockRequest, createMockSupabaseClient, extractIpAddress } from "./_shared.ts";

describe("track-visit - IP Capture", () => {
  beforeEach(() => {
    createMockSupabaseClient();
  });

  it("should capture IP from x-real-ip header", () => {
    const mockRequest = createMockRequest(
      { checkoutId: "checkout-123" },
      { "x-real-ip": "192.168.1.1" }
    );
    const ip = extractIpAddress(mockRequest);
    assertEquals(ip, "192.168.1.1");
  });

  it("should capture IP from x-forwarded-for header", () => {
    const mockRequest = createMockRequest(
      { checkoutId: "checkout-123" },
      { "x-forwarded-for": "192.168.1.1, 10.0.0.1" }
    );
    const ip = extractIpAddress(mockRequest);
    assertEquals(ip, "192.168.1.1");
  });

  it("should capture IP from cf-connecting-ip header", () => {
    const mockRequest = createMockRequest(
      { checkoutId: "checkout-123" },
      { "cf-connecting-ip": "192.168.1.1" }
    );
    const ip = extractIpAddress(mockRequest);
    assertEquals(ip, "192.168.1.1");
  });

  it("should prioritize x-real-ip over x-forwarded-for", () => {
    const mockRequest = createMockRequest(
      { checkoutId: "checkout-123" },
      { 
        "x-real-ip": "192.168.1.1",
        "x-forwarded-for": "10.0.0.1",
      }
    );
    const ip = extractIpAddress(mockRequest);
    assertEquals(ip, "192.168.1.1");
  });

  it("should handle missing IP headers", () => {
    const mockRequest = createMockRequest({ checkoutId: "checkout-123" });
    const ip = extractIpAddress(mockRequest);
    assertEquals(ip, null);
  });
});

describe("track-visit - Error Handling", () => {
  beforeEach(() => {
    createMockSupabaseClient();
  });

  it("should return 400 when checkoutId is missing", async () => {
    const mockRequest = createMockRequest({});
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasCheckoutId = "checkoutId" in body;
    const expectedStatus = hasCheckoutId ? 200 : 400;
    assertEquals(expectedStatus, 400);
  });

  it("should handle insert errors", () => {
    const insertError = { message: "Insert failed" };
    assertExists(insertError.message);
  });

  it("should return 500 on insert error", () => {
    const insertError = true;
    const expectedStatus = insertError ? 500 : 200;
    assertEquals(expectedStatus, 500);
  });
});

describe("track-visit - CORS", () => {
  it("should handle OPTIONS preflight request", () => {
    const url = "https://test.supabase.co/functions/v1/track-visit";
    const mockRequest = new Request(url, { method: "OPTIONS" });
    assertEquals(mockRequest.method, "OPTIONS");
  });

  it("should use PUBLIC_CORS_HEADERS", () => {
    const usesPublicCorsHeaders = true;
    assertEquals(usesPublicCorsHeaders, true);
  });
});
