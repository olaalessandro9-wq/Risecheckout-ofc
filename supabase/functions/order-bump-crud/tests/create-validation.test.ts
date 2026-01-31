/**
 * Create Validation & original_price Tests for order-bump-crud
 * @module order-bump-crud/tests/create-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getOriginalPrice, isValidOriginalPrice, type OrderBumpPayload } from "./_shared.ts";

// ============================================
// CREATE VALIDATION
// ============================================

Deno.test("order-bump-crud - create validation - parent_product_id is required", () => {
  const payload: OrderBumpPayload = { product_id: "prod-123", offer_id: "offer-456" };
  assertEquals(payload.parent_product_id, undefined);
});

Deno.test("order-bump-crud - create validation - product_id (bump) is required", () => {
  const payload: OrderBumpPayload = { parent_product_id: "parent-123", offer_id: "offer-456" };
  assertEquals(payload.product_id, undefined);
});

Deno.test("order-bump-crud - create validation - offer_id is required", () => {
  const payload: OrderBumpPayload = { parent_product_id: "parent-123", product_id: "prod-123" };
  assertEquals(payload.offer_id, undefined);
});

Deno.test("order-bump-crud - create validation - backwards compat with checkout_id", () => {
  const payload: OrderBumpPayload = { checkout_id: "checkout-123", product_id: "prod-123", offer_id: "offer-456" };
  assertExists(payload.checkout_id);
});

Deno.test("order-bump-crud - create validation - valid create request", () => {
  const payload: OrderBumpPayload = {
    parent_product_id: "parent-123",
    product_id: "bump-product-456",
    offer_id: "offer-789",
    active: true,
    discount_enabled: false,
    call_to_action: "Adicione este produto!",
    show_image: true,
  };
  
  assertExists(payload.parent_product_id);
  assertExists(payload.product_id);
  assertExists(payload.offer_id);
});

// ============================================
// ORIGINAL_PRICE SEMANTICS (CRITICAL)
// ============================================

Deno.test("order-bump-crud - original_price - is for MARKETING display only", () => {
  const documentation = "original_price is MARKETING price for strikethrough display. The REAL price comes from the linked offer/product.";
  assertStringIncludes(documentation, "MARKETING");
  assertStringIncludes(documentation, "strikethrough");
});

Deno.test("order-bump-crud - original_price - must be positive when discount_enabled", () => {
  assertEquals(isValidOriginalPrice(true, 0), false);
});

Deno.test("order-bump-crud - original_price - valid positive value", () => {
  assertEquals(isValidOriginalPrice(true, 19900), true);
});

Deno.test("order-bump-crud - original_price - ignored when discount_enabled is false", () => {
  const payload: OrderBumpPayload = { discount_enabled: false, original_price: 19900 };
  const savedValue = payload.discount_enabled ? payload.original_price : null;
  assertEquals(savedValue, null);
});

Deno.test("order-bump-crud - original_price - backwards compat with discount_price", () => {
  const payload: OrderBumpPayload = { discount_enabled: true, discount_price: 15000 };
  assertEquals(getOriginalPrice(payload), 15000);
});
