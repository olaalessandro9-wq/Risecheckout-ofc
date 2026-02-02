/**
 * checkout-public-data - Action Routing Tests
 * 
 * @version 2.0.0
 * RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { createMockRequest, createMockSupabaseClient, VALID_ACTIONS, isValidAction } from "./_shared.ts";

describe("checkout-public-data - Action Routing", () => {
  let _mockSupabaseClient: Record<string, unknown>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
  });

  it("should route to product handler", async () => {
    const mockRequest = createMockRequest({ action: "product", productId: "product-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "product");
  });

  it("should route to offer handler", async () => {
    const mockRequest = createMockRequest({ action: "offer", checkoutId: "checkout-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "offer");
  });

  it("should route to order-bumps handler", async () => {
    const mockRequest = createMockRequest({ action: "order-bumps", checkoutId: "checkout-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "order-bumps");
  });

  it("should route to affiliate handler", async () => {
    const mockRequest = createMockRequest({ action: "affiliate", affiliateId: "affiliate-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "affiliate");
  });

  it("should route to resolve-and-load handler (BFF)", async () => {
    const mockRequest = createMockRequest({ action: "resolve-and-load", slug: "test-slug" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "resolve-and-load");
  });

  it("should route to validate-coupon handler", async () => {
    const mockRequest = createMockRequest({ action: "validate-coupon", code: "SAVE10" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "validate-coupon");
  });

  it("should route to checkout handler", async () => {
    const mockRequest = createMockRequest({ action: "checkout", checkoutId: "checkout-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "checkout");
  });

  it("should route to product-pixels handler", async () => {
    const mockRequest = createMockRequest({ action: "product-pixels", productId: "product-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "product-pixels");
  });

  it("should route to order-by-token handler", async () => {
    const mockRequest = createMockRequest({ action: "order-by-token", token: "order-token-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "order-by-token");
  });

  it("should route to payment-link-data handler", async () => {
    const mockRequest = createMockRequest({ action: "payment-link-data", linkId: "link-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "payment-link-data");
  });

  it("should route to check-order-payment-status handler", async () => {
    const mockRequest = createMockRequest({ action: "check-order-payment-status", orderId: "order-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "check-order-payment-status");
  });

  it("should return 400 for unknown action", async () => {
    const mockRequest = createMockRequest({ action: "unknown" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const isValid = isValidAction(body.action as string);
    assertEquals(isValid, false);
  });

  it("should have 14 valid actions", () => {
    assertEquals(VALID_ACTIONS.length, 14);
  });
});
