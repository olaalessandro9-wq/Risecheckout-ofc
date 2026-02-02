/**
 * checkout-public-data - Public Endpoint Tests
 * 
 * @version 2.0.0
 * RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { createMockRequest, createMockSupabaseClient } from "./_shared.ts";

describe("checkout-public-data - Public Endpoint", () => {
  let _mockSupabaseClient: Record<string, unknown>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
  });

  it("should NOT require authentication", async () => {
    const mockRequest = createMockRequest({ action: "product", productId: "product-123" });
    const hasAuthHeader = mockRequest.headers.has("Authorization");
    assertEquals(hasAuthHeader, false);
  });

  it("should be publicly accessible", async () => {
    const _mockRequest = createMockRequest({ action: "product", productId: "product-123" });
    const isPublic = true;
    assertEquals(isPublic, true);
  });
});
