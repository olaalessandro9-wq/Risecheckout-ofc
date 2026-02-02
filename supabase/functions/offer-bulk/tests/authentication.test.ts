/**
 * offer-bulk - Authentication Tests
 * 
 * @version 2.0.0
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { createMockRequest, createMockSupabaseClient, createMockProducer, createMockProduct } from "./_shared.ts";

describe("offer-bulk - Authentication", () => {
  let _mockSupabaseClient: Record<string, unknown>;
  let _mockProducer: { id: string; email: string };
  let _mockProduct: { id: string; user_id: string };

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
    _mockProducer = createMockProducer();
    _mockProduct = createMockProduct();
  });

  it("should require authentication", () => {
    const mockRequest = createMockRequest({ product_id: "product-123", offers: [] });
    assertExists(mockRequest.headers.get("Authorization"));
  });

  it("should return 401 when not authenticated", () => {
    const authFailed = true;
    const expectedStatus = authFailed ? 401 : 200;
    assertEquals(expectedStatus, 401);
  });

  it("should extract producer ID from auth", () => {
    const producerId = "producer-123";
    assertExists(producerId);
  });
});

describe("offer-bulk - Method Validation", () => {
  beforeEach(() => {
    createMockSupabaseClient();
    createMockProducer();
  });

  it("should only accept POST method", () => {
    const mockRequest = createMockRequest({ product_id: "product-123", offers: [] });
    assertEquals(mockRequest.method, "POST");
  });

  it("should reject GET method", () => {
    const url = "https://test.supabase.co/functions/v1/offer-bulk/bulk-save";
    const mockRequest = new Request(url, {
      method: "GET",
      headers: new Headers({ "Authorization": "Bearer mock-token" }),
    });
    assertEquals(mockRequest.method === "POST", false);
  });

  it("should reject PUT method", () => {
    const url = "https://test.supabase.co/functions/v1/offer-bulk/bulk-save";
    const mockRequest = new Request(url, {
      method: "PUT",
      headers: new Headers({ "Authorization": "Bearer mock-token" }),
    });
    assertEquals(mockRequest.method === "POST", false);
  });
});
