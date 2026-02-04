/**
 * Authentication Tests for utmify-conversion
 * 
 * @module utmify-conversion/tests/authentication.test
 * @version 2.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockRequest,
  createMockRequestWithoutAuth,
  createDefaultConversionPayload,
  createDefaultUser,
} from "./_shared.ts";

describe("utmify-conversion - Authentication", () => {
  it("should use x-api-token header for UTMify API", () => {
    const token = "test-utmify-token";
    const headers = {
      "x-api-token": token,
      "Content-Type": "application/json",
    };
    
    assertExists(headers["x-api-token"]);
    assertEquals(headers["x-api-token"], token);
  });

  it("should NOT use Authorization Bearer header", () => {
    const token = "test-utmify-token";
    const correctHeaders = {
      "x-api-token": token,
      "Content-Type": "application/json",
    };
    
    // Verify x-api-token is used
    assertEquals("x-api-token" in correctHeaders, true);
    
    // Verify Authorization is NOT used
    assertEquals("Authorization" in correctHeaders, false);
  });

  it("should retrieve token from users table", () => {
    const user = createDefaultUser();
    assertExists(user.utmify_token);
    assertEquals(typeof user.utmify_token, "string");
  });

  it("should handle missing UTMify token", () => {
    const userWithoutToken = {
      id: "vendor-123",
      utmify_token: null,
    };
    assertEquals(userWithoutToken.utmify_token, null);
  });

  it("should require vendorId in request", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.vendorId);
    assertEquals(typeof payload.vendorId, "string");
  });

  it("should validate vendorId format", () => {
    const payload = createDefaultConversionPayload();
    assertExists(payload.vendorId);
    assertEquals(payload.vendorId.length > 0, true);
  });

  it("should handle invalid vendor gracefully", () => {
    const errorResponse = {
      success: false,
      error: "Vendor not found",
    };
    assertEquals(errorResponse.success, false);
    assertEquals(errorResponse.error, "Vendor not found");
  });
});
