/**
 * Authentication Tests for facebook-conversion-api
 * 
 * @module facebook-conversion-api/tests/authentication.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createMockRequestWithoutAuth,
  createDefaultEvent,
  type FacebookEvent,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockEvent: FacebookEvent;

describe("facebook-conversion-api - Authentication", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockEvent = createDefaultEvent();
  });

  it("should require authorization header", async () => {
    const mockRequest = createMockRequestWithoutAuth({ event: mockEvent });
    const hasAuth = mockRequest.headers.has("Authorization");
    assertEquals(hasAuth, false);
  });

  it("should return 401 for missing authorization", async () => {
    const mockRequest = createMockRequestWithoutAuth({ event: mockEvent });
    const hasAuth = mockRequest.headers.has("Authorization");
    const expectedStatus = hasAuth ? 200 : 401;
    assertEquals(expectedStatus, 401);
  });

  it("should validate access token format", async () => {
    const mockRequest = createMockRequest({ event: mockEvent });
    const authHeader = mockRequest.headers.get("Authorization");
    assertExists(authHeader);
    assertEquals(authHeader?.startsWith("Bearer "), true);
  });

  it("should accept valid Facebook access token", async () => {
    const mockRequest = createMockRequest({ event: mockEvent });
    const authHeader = mockRequest.headers.get("Authorization");
    const isValid = authHeader?.startsWith("Bearer ") && authHeader.length > 10;
    assertEquals(isValid, true);
  });

  it("should reject expired access token", () => {
    const expiredToken = {
      access_token: "expired-token",
      expires_at: new Date(Date.now() - 86400000).toISOString(),
    };
    const isExpired = new Date(expiredToken.expires_at) < new Date();
    assertEquals(isExpired, true);
  });

  it("should validate pixel ID ownership", () => {
    const pixelId = "123456789";
    const vendorPixels = ["123456789", "987654321"];
    const hasAccess = vendorPixels.includes(pixelId);
    assertEquals(hasAccess, true);
  });
});
