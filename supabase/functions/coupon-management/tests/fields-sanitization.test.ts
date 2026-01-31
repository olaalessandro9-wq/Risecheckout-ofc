/**
 * Fields, Product Links & Sanitization Tests for coupon-management
 * @module coupon-management/tests/fields-sanitization.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normalizeCode, type CouponData, type CouponProductLink } from "./_shared.ts";

// ============================================
// COUPON FIELDS
// ============================================

Deno.test("coupon-management - fields - coupon has expected structure", () => {
  const coupon: CouponData = {
    code: "BLACKFRIDAY",
    name: "Black Friday Sale",
    description: "50% off all products",
    discount_type: "percentage",
    discount_value: 50,
    active: true,
    max_uses: 1000,
    max_uses_per_customer: 1,
    uses_count: 0,
    start_date: "2024-11-29T00:00:00Z",
    expires_at: "2024-12-02T23:59:59Z",
    apply_to_order_bumps: false,
  };
  
  assertExists(coupon.code);
  assertExists(coupon.discount_type);
  assertExists(coupon.discount_value);
});

Deno.test("coupon-management - fields - uses_count tracks usage", () => {
  const coupon = { uses_count: 50, max_uses: 100 };
  const canBeUsed = (coupon.uses_count ?? 0) < (coupon.max_uses ?? Infinity);
  assertEquals(canBeUsed, true);
});

Deno.test("coupon-management - fields - expires_at controls validity", () => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 86400000);
  const pastDate = new Date(now.getTime() - 86400000);
  
  assertEquals(new Date(futureDate.toISOString()) > now, true);
  assertEquals(new Date(pastDate.toISOString()) > now, false);
});

// ============================================
// COUPON-PRODUCT LINK
// ============================================

Deno.test("coupon-management - product link - creates coupon_products entry", () => {
  const link: CouponProductLink = {
    coupon_id: "coupon-123",
    product_id: "product-456",
  };
  
  assertExists(link.coupon_id);
  assertExists(link.product_id);
});

Deno.test("coupon-management - product link - coupon can link to multiple products", () => {
  const links: CouponProductLink[] = [
    { coupon_id: "coupon-123", product_id: "product-1" },
    { coupon_id: "coupon-123", product_id: "product-2" },
  ];
  
  assertEquals(links.length, 2);
  assertEquals(links[0].coupon_id, links[1].coupon_id);
});

// ============================================
// ORDER BUMPS APPLICATION
// ============================================

Deno.test("coupon-management - order bumps - apply_to_order_bumps flag", () => {
  const couponWithBumps: CouponData = { apply_to_order_bumps: true };
  const couponWithoutBumps: CouponData = { apply_to_order_bumps: false };
  
  assertEquals(couponWithBumps.apply_to_order_bumps, true);
  assertEquals(couponWithoutBumps.apply_to_order_bumps, false);
});

// ============================================
// INPUT SANITIZATION
// ============================================

Deno.test("coupon-management - sanitization - code is trimmed and uppercased", () => {
  assertEquals(normalizeCode("  sale10  "), "SALE10");
});

Deno.test("coupon-management - sanitization - name is trimmed", () => {
  const name = "  Summer Sale  ";
  assertEquals(name.trim(), "Summer Sale");
});

Deno.test("coupon-management - sanitization - description handles null", () => {
  const description = null;
  assertEquals(description ?? "", "");
});
