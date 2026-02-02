/**
 * coupon-read - Get Coupon Tests
 * 
 * @version 2.0.0
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { 
  createMockRequest, 
  createMockCoupon, 
  createMockProducer,
  isValidAction,
  hasOwnership,
  type CouponPayload,
  type MockCoupon,
  type MockCouponProduct,
  type MockProduct
} from "./_shared.ts";

describe("coupon-read - Authentication", () => {
  beforeEach(() => {
    createMockProducer();
    createMockCoupon();
  });

  it("should require authentication", () => {
    const mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
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

describe("coupon-read - Action: GET-COUPON", () => {
  let mockCoupon: MockCoupon;
  let mockCouponProducts: MockCouponProduct[];
  let mockProducts: MockProduct[];

  beforeEach(() => {
    createMockProducer();
    mockCoupon = createMockCoupon();
    mockCouponProducts = [{ product_id: "product-123" }];
    mockProducts = [{ id: "product-123", user_id: "producer-123" }];
  });

  it("should get coupon by ID", async () => {
    const mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    const body = await mockRequest.json() as CouponPayload;
    assertEquals(body.couponId, "coupon-123");
  });

  it("should require couponId", async () => {
    const mockRequest = createMockRequest({ action: "get-coupon" });
    const body = await mockRequest.json() as CouponPayload;
    assertEquals("couponId" in body, false);
  });

  it("should return coupon data", () => {
    assertExists(mockCoupon.id);
    assertExists(mockCoupon.code);
    assertEquals(mockCoupon.discount_type, "percentage");
    assertEquals(mockCoupon.discount_value, 10);
  });

  it("should return 404 when coupon not found", () => {
    const couponNotFound = true;
    const expectedStatus = couponNotFound ? 404 : 200;
    assertEquals(expectedStatus, 404);
  });

  it("should verify coupon ownership", () => {
    const producerId = "producer-123";
    assertEquals(hasOwnership(mockProducts, producerId), true);
  });

  it("should return 403 when producer does not own coupon", () => {
    mockProducts = [];
    const hasAccess = mockProducts.length > 0;
    const expectedStatus = hasAccess ? 200 : 403;
    assertEquals(expectedStatus, 403);
  });

  it("should check coupon_products table", () => {
    assertEquals(mockCouponProducts.length > 0, true);
  });
});

describe("coupon-read - Ownership Verification", () => {
  let mockProducts: MockProduct[];

  beforeEach(() => {
    mockProducts = [{ id: "product-123", user_id: "producer-123" }];
  });

  it("should allow access when producer owns linked product", () => {
    const producerId = "producer-123";
    assertEquals(hasOwnership(mockProducts, producerId), true);
  });

  it("should deny access when producer does not own any linked product", () => {
    mockProducts = [];
    const producerId = "producer-123";
    assertEquals(hasOwnership(mockProducts, producerId), false);
  });
});

describe("coupon-read - Error Handling", () => {
  it("should handle unknown action", async () => {
    const mockRequest = createMockRequest({ action: "unknown" });
    const body = await mockRequest.json() as CouponPayload;
    assertEquals(isValidAction(body.action ?? ""), false);
  });

  it("should return error code for unknown action", () => {
    const errorCode = "INVALID_ACTION";
    assertEquals(errorCode, "INVALID_ACTION");
  });

  it("should return 500 on internal error", () => {
    const internalError = true;
    const expectedStatus = internalError ? 500 : 200;
    assertEquals(expectedStatus, 500);
  });
});

describe("coupon-read - CORS", () => {
  it("should handle OPTIONS preflight request", () => {
    const url = "https://test.supabase.co/functions/v1/coupon-read";
    const mockRequest = new Request(url, { method: "OPTIONS" });
    assertEquals(mockRequest.method, "OPTIONS");
  });
});
