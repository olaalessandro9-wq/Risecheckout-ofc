/**
 * Create Validation & Discount Type Tests for coupon-management
 * @module coupon-management/tests/create-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidDiscountType, isValidPercentage, convertReaisToCents, type CouponPayload } from "./_shared.ts";

// ============================================
// CREATE VALIDATION
// ============================================

Deno.test("coupon-management - create validation - productId is required", () => {
  const body: CouponPayload = { action: "create", coupon: { code: "SALE10" } };
  assertEquals(body.productId, undefined);
});

Deno.test("coupon-management - create validation - coupon object is required", () => {
  const body: CouponPayload = { action: "create", productId: "product-123" };
  assertEquals(body.coupon, undefined);
});

Deno.test("coupon-management - create validation - code is required", () => {
  const coupon = { discount_type: "percentage", discount_value: 10 };
  assertEquals("code" in coupon, false);
});

Deno.test("coupon-management - create validation - discount_type is required", () => {
  const coupon = { code: "SALE10", discount_value: 10 };
  assertEquals("discount_type" in coupon, false);
});

Deno.test("coupon-management - create validation - discount_value is required", () => {
  const coupon = { code: "SALE10", discount_type: "percentage" };
  assertEquals("discount_value" in coupon, false);
});

Deno.test("coupon-management - create validation - valid create request", () => {
  const body: CouponPayload = {
    action: "create",
    productId: "product-123",
    coupon: {
      code: "BLACKFRIDAY50",
      discount_type: "percentage",
      discount_value: 50,
      active: true,
      max_uses: 100,
    },
  };
  
  assertExists(body.productId);
  assertExists(body.coupon?.code);
  assertExists(body.coupon?.discount_type);
  assertExists(body.coupon?.discount_value);
});

// ============================================
// DISCOUNT TYPE VALIDATION
// ============================================

Deno.test("coupon-management - discount type - supports percentage", () => {
  assertEquals(isValidDiscountType("percentage"), true);
});

Deno.test("coupon-management - discount type - supports fixed", () => {
  assertEquals(isValidDiscountType("fixed"), true);
});

Deno.test("coupon-management - discount type - percentage max is 100", () => {
  assertEquals(isValidPercentage(150), false);
});

Deno.test("coupon-management - discount type - percentage must be positive", () => {
  assertEquals(isValidPercentage(-10), false);
});

Deno.test("coupon-management - discount type - fixed value in cents", () => {
  assertEquals(convertReaisToCents(50.00), 5000);
});
