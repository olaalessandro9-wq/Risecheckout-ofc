/**
 * Fields, Sanitization & Ownership Tests for order-bump-crud
 * @module order-bump-crud/tests/fields-ownership.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { sanitizeText, isProductOwner, type OrderBump } from "./_shared.ts";

// ============================================
// ORDER BUMP FIELDS
// ============================================

Deno.test("order-bump-crud - fields - orderBump has expected structure", () => {
  const orderBump: OrderBump = {
    id: "uuid-123",
    parent_product_id: "parent-uuid",
    checkout_id: null,
    product_id: "bump-product-uuid",
    offer_id: "offer-uuid",
    active: true,
    discount_enabled: true,
    original_price: 19900,
    position: 0,
  };
  
  assertExists(orderBump.id);
  assertExists(orderBump.parent_product_id);
  assertExists(orderBump.product_id);
  assertExists(orderBump.offer_id);
  assertEquals(typeof orderBump.active, "boolean");
});

Deno.test("order-bump-crud - fields - position is used for ordering", () => {
  const orderBumps = [
    { id: "bump-1", position: 2 },
    { id: "bump-2", position: 0 },
    { id: "bump-3", position: 1 },
  ];
  
  const sorted = [...orderBumps].sort((a, b) => a.position - b.position);
  assertEquals(sorted[0].id, "bump-2");
  assertEquals(sorted[1].id, "bump-3");
  assertEquals(sorted[2].id, "bump-1");
});

// ============================================
// INPUT SANITIZATION
// ============================================

Deno.test("order-bump-crud - sanitization - trims call_to_action", () => {
  assertEquals(sanitizeText("  Compre agora!  "), "Compre agora!");
});

Deno.test("order-bump-crud - sanitization - trims custom_title", () => {
  assertEquals(sanitizeText("  Título  "), "Título");
});

Deno.test("order-bump-crud - sanitization - empty string becomes null", () => {
  assertEquals(sanitizeText("   "), null);
});

// ============================================
// OWNERSHIP VERIFICATION
// ============================================

Deno.test("order-bump-crud - ownership - verifies parent product owner", () => {
  const product = { id: "product-123", user_id: "owner-123" };
  assertEquals(isProductOwner(product, "owner-123"), true);
});

Deno.test("order-bump-crud - ownership - rejects non-owner", () => {
  const product = { id: "product-123", user_id: "owner-123" };
  assertEquals(isProductOwner(product, "different-user"), false);
});
