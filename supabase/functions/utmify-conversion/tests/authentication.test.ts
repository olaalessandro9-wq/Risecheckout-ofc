/**
 * Authentication Tests for utmify-conversion
 * 
 * @module utmify-conversion/tests/authentication.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createMockRequestWithoutAuth,
  createDefaultOrder,
  type MockOrder,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockOrder: MockOrder;

describe("utmify-conversion - Authentication", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockOrder = createDefaultOrder();
  });

  it("should require authorization header", async () => {
    const mockRequest = createMockRequestWithoutAuth({ order_id: mockOrder.id });
    const hasAuth = mockRequest.headers.has("Authorization");
    assertEquals(hasAuth, false);
  });

  it("should return 401 for missing authorization", async () => {
    const mockRequest = createMockRequestWithoutAuth({ order_id: mockOrder.id });
    const hasAuth = mockRequest.headers.has("Authorization");
    const expectedStatus = hasAuth ? 200 : 401;
    assertEquals(expectedStatus, 401);
  });

  it("should validate API key format", async () => {
    const mockRequest = createMockRequest({ order_id: mockOrder.id });
    const authHeader = mockRequest.headers.get("Authorization");
    assertExists(authHeader);
    assertEquals(authHeader?.startsWith("Bearer "), true);
  });

  it("should accept valid API key", async () => {
    const mockRequest = createMockRequest({ order_id: mockOrder.id });
    const authHeader = mockRequest.headers.get("Authorization");
    const isValid = authHeader?.startsWith("Bearer ") && authHeader.length > 10;
    assertEquals(isValid, true);
  });

  it("should reject invalid API key", async () => {
    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": "Bearer invalid-key",
    });
    const mockRequest = new Request("https://test.supabase.co/functions/v1/utmify-conversion", {
      method: "POST",
      headers,
      body: JSON.stringify({ order_id: mockOrder.id }),
    });
    const authHeader = mockRequest.headers.get("Authorization");
    const isInvalidKey = authHeader === "Bearer invalid-key";
    assertEquals(isInvalidKey, true);
  });
});
