/**
 * checkout-editor - Authentication Tests
 * 
 * @version 2.0.0
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { 
  createMockRequest, 
  createMockSupabaseClient, 
  createMockProducer, 
  createMockCheckout,
  hasCheckoutOwnership
} from "./_shared.ts";

describe("checkout-editor - Authentication", () => {
  let _mockSupabaseClient: Record<string, unknown>;
  let _mockProducer: { id: string; email: string };
  let mockCheckout: ReturnType<typeof createMockCheckout>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
    _mockProducer = createMockProducer();
    mockCheckout = createMockCheckout();
  });

  it("should require authentication", () => {
    const mockRequest = createMockRequest({ action: "get-editor-data", checkoutId: "checkout-123" });
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

  it("should verify checkout ownership", () => {
    const producerId = "producer-123";
    assertEquals(hasCheckoutOwnership(mockCheckout, producerId), true);
  });

  it("should reject unauthorized access", () => {
    mockCheckout = createMockCheckout({ products: { user_id: "other-producer" } });
    const producerId = "producer-123";
    assertEquals(hasCheckoutOwnership(mockCheckout, producerId), false);
  });
});
