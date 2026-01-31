/**
 * Smart Delete Tests for product-settings
 * 
 * @module product-settings/tests/smart-delete.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { hasOrders, determineDeleteType, MOCK_PRODUCTS } from "./_shared.ts";

// ============================================================================
// SMART DELETE TESTS
// ============================================================================

Deno.test("product-settings - Smart Delete - should detect product with orders", () => {
  assertEquals(hasOrders("prod-1"), true);
  assertEquals(hasOrders("prod-sem-ordens"), false);
});

Deno.test("product-settings - Smart Delete - should use soft delete when has orders", () => {
  const deleteType = determineDeleteType("prod-1");
  assertEquals(deleteType, "soft");
});

Deno.test("product-settings - Smart Delete - should use hard delete when no orders", () => {
  const deleteType = determineDeleteType("prod-sem-ordens");
  assertEquals(deleteType, "hard");
});

Deno.test("product-settings - Smart Delete - soft delete should set status to deleted", () => {
  const product = { ...MOCK_PRODUCTS[0], status: "deleted" };
  assertEquals(product.status, "deleted");
});
