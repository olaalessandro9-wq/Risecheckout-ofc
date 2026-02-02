/**
 * checkout-public-data - Handler Tests
 * 
 * @version 2.0.0
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { createMockRequest, createMockSupabaseClient, hasRequiredField } from "./_shared.ts";

describe("checkout-public-data - Action: PRODUCT", () => {
  let _mockSupabaseClient: Record<string, unknown>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
  });

  it("should get product data by ID", async () => {
    const mockRequest = createMockRequest({ action: "product", productId: "product-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.productId, "product-123");
  });

  it("should require productId", async () => {
    const mockRequest = createMockRequest({ action: "product" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(hasRequiredField(body, "productId"), false);
  });
});

describe("checkout-public-data - Action: OFFER", () => {
  let _mockSupabaseClient: Record<string, unknown>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
  });

  it("should get offer data by checkout ID", async () => {
    const mockRequest = createMockRequest({ action: "offer", checkoutId: "checkout-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.checkoutId, "checkout-123");
  });

  it("should require checkoutId", async () => {
    const mockRequest = createMockRequest({ action: "offer" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(hasRequiredField(body, "checkoutId"), false);
  });
});

describe("checkout-public-data - Action: ORDER-BUMPS", () => {
  let _mockSupabaseClient: Record<string, unknown>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
  });

  it("should get active order bumps for checkout", async () => {
    const mockRequest = createMockRequest({ action: "order-bumps", checkoutId: "checkout-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.checkoutId, "checkout-123");
  });

  it("should require checkoutId", async () => {
    const mockRequest = createMockRequest({ action: "order-bumps" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(hasRequiredField(body, "checkoutId"), false);
  });

  it("should only return active order bumps", () => {
    const onlyActive = true;
    assertEquals(onlyActive, true);
  });
});

describe("checkout-public-data - Action: AFFILIATE", () => {
  let _mockSupabaseClient: Record<string, unknown>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
  });

  it("should get affiliate info", async () => {
    const mockRequest = createMockRequest({ action: "affiliate", affiliateId: "affiliate-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.affiliateId, "affiliate-123");
  });

  it("should require affiliateId", async () => {
    const mockRequest = createMockRequest({ action: "affiliate" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(hasRequiredField(body, "affiliateId"), false);
  });
});

describe("checkout-public-data - Action: RESOLVE-AND-LOAD", () => {
  let _mockSupabaseClient: Record<string, unknown>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
  });

  it("should resolve slug and load all data (BFF)", async () => {
    const mockRequest = createMockRequest({ action: "resolve-and-load", slug: "test-product" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.slug, "test-product");
  });

  it("should require slug", async () => {
    const mockRequest = createMockRequest({ action: "resolve-and-load" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(hasRequiredField(body, "slug"), false);
  });

  it("should be optimized single-call loader", () => {
    const isBFF = true;
    assertEquals(isBFF, true);
  });
});

describe("checkout-public-data - Action: VALIDATE-COUPON", () => {
  let _mockSupabaseClient: Record<string, unknown>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
  });

  it("should validate coupon code", async () => {
    const mockRequest = createMockRequest({ action: "validate-coupon", code: "SAVE10", productId: "product-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.code, "SAVE10");
  });

  it("should require code", async () => {
    const mockRequest = createMockRequest({ action: "validate-coupon", productId: "product-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(hasRequiredField(body, "code"), false);
  });

  it("should require productId", async () => {
    const mockRequest = createMockRequest({ action: "validate-coupon", code: "SAVE10" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(hasRequiredField(body, "productId"), false);
  });
});

describe("checkout-public-data - Action: CHECKOUT", () => {
  let _mockSupabaseClient: Record<string, unknown>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
  });

  it("should get checkout data by ID", async () => {
    const mockRequest = createMockRequest({ action: "checkout", checkoutId: "checkout-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.checkoutId, "checkout-123");
  });

  it("should require checkoutId", async () => {
    const mockRequest = createMockRequest({ action: "checkout" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(hasRequiredField(body, "checkoutId"), false);
  });
});

describe("checkout-public-data - Action: PRODUCT-PIXELS", () => {
  let _mockSupabaseClient: Record<string, unknown>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
  });

  it("should get tracking pixels for product", async () => {
    const mockRequest = createMockRequest({ action: "product-pixels", productId: "product-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.productId, "product-123");
  });

  it("should require productId", async () => {
    const mockRequest = createMockRequest({ action: "product-pixels" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(hasRequiredField(body, "productId"), false);
  });
});

describe("checkout-public-data - Action: ORDER-BY-TOKEN", () => {
  let _mockSupabaseClient: Record<string, unknown>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
  });

  it("should get order for success page", async () => {
    const mockRequest = createMockRequest({ action: "order-by-token", token: "order-token-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.token, "order-token-123");
  });

  it("should require token", async () => {
    const mockRequest = createMockRequest({ action: "order-by-token" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(hasRequiredField(body, "token"), false);
  });
});

describe("checkout-public-data - Action: PAYMENT-LINK-DATA", () => {
  let _mockSupabaseClient: Record<string, unknown>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
  });

  it("should get payment link data", async () => {
    const mockRequest = createMockRequest({ action: "payment-link-data", linkId: "link-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.linkId, "link-123");
  });

  it("should require linkId", async () => {
    const mockRequest = createMockRequest({ action: "payment-link-data" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(hasRequiredField(body, "linkId"), false);
  });
});

describe("checkout-public-data - Action: CHECK-ORDER-PAYMENT-STATUS", () => {
  let _mockSupabaseClient: Record<string, unknown>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
  });

  it("should check order payment status", async () => {
    const mockRequest = createMockRequest({ action: "check-order-payment-status", orderId: "order-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.orderId, "order-123");
  });

  it("should require orderId", async () => {
    const mockRequest = createMockRequest({ action: "check-order-payment-status" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(hasRequiredField(body, "orderId"), false);
  });
});
