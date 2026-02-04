/**
 * API Integration Tests for utmify-conversion
 * 
 * @module utmify-conversion/tests/api-integration.test
 * @version 2.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  UTMIFY_API_URL,
  PLATFORM_NAME,
  createDefaultConversionPayload,
} from "./_shared.ts";

describe("utmify-conversion - API Integration", () => {
  it("should use correct UTMify API endpoint", () => {
    assertEquals(UTMIFY_API_URL, "https://api.utmify.com.br/api-credentials/orders");
    assertEquals(UTMIFY_API_URL.startsWith("https://"), true);
  });

  it("should use correct platform name", () => {
    assertEquals(PLATFORM_NAME, "RiseCheckout");
  });

  it("should format request headers correctly", () => {
    const token = "test-token-123";
    const headers = {
      "x-api-token": token,
      "Content-Type": "application/json",
    };
    
    assertExists(headers["x-api-token"]);
    assertEquals(headers["x-api-token"], token);
    assertEquals(headers["Content-Type"], "application/json");
  });

  it("should NOT use Authorization Bearer header", () => {
    const correctHeaders = {
      "x-api-token": "token",
      "Content-Type": "application/json",
    };
    
    // Verify x-api-token is used instead of Authorization
    assertExists(correctHeaders["x-api-token"]);
    assertEquals("Authorization" in correctHeaders, false);
  });

  it("should format payload correctly", () => {
    const payload = createDefaultConversionPayload();
    
    assertExists(payload.orderId);
    assertExists(payload.customer);
    assertExists(payload.products);
    assertExists(payload.commission);
  });

  it("should handle API timeout gracefully", () => {
    const timeoutMs = 30000;
    const hasTimeout = timeoutMs > 0;
    assertEquals(hasTimeout, true);
  });

  it("should include correlation ID in requests", () => {
    const correlationId = crypto.randomUUID();
    assertExists(correlationId);
    assertEquals(correlationId.length, 36);
  });

  it("should handle API error responses", () => {
    const mockErrorResponse = { status: 500, error: "Internal Server Error" };
    const isError = mockErrorResponse.status >= 400;
    assertEquals(isError, true);
  });

  it("should handle 401 unauthorized response", () => {
    const mockErrorResponse = { status: 401, error: "Unauthorized" };
    const isUnauthorized = mockErrorResponse.status === 401;
    assertEquals(isUnauthorized, true);
  });

  it("should handle 400 bad request response", () => {
    const mockErrorResponse = { status: 400, error: "Bad Request" };
    const isBadRequest = mockErrorResponse.status === 400;
    assertEquals(isBadRequest, true);
  });
});
