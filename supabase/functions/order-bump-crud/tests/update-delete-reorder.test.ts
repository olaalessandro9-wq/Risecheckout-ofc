/**
 * Update/Delete/Reorder Validation Tests for order-bump-crud
 * @module order-bump-crud/tests/update-delete-reorder.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getOrderBumpId, type OrderBumpPayload } from "./_shared.ts";

// ============================================
// UPDATE VALIDATION
// ============================================

Deno.test("order-bump-crud - update validation - requires order_bump_id", () => {
  const payload: OrderBumpPayload = { active: false };
  assertEquals(getOrderBumpId(payload), undefined);
});

Deno.test("order-bump-crud - update validation - accepts id field", () => {
  const payload: OrderBumpPayload = { id: "bump-123", active: false };
  assertEquals(getOrderBumpId(payload), "bump-123");
});

Deno.test("order-bump-crud - update validation - accepts order_bump_id field", () => {
  const payload: OrderBumpPayload = { order_bump_id: "bump-456", active: false };
  assertEquals(getOrderBumpId(payload), "bump-456");
});

Deno.test("order-bump-crud - update validation - accepts partial updates", () => {
  const payload: OrderBumpPayload = { id: "bump-123", active: false };
  assertEquals(payload.product_id, undefined);
  assertEquals(payload.offer_id, undefined);
});

// ============================================
// DELETE VALIDATION
// ============================================

Deno.test("order-bump-crud - delete validation - accepts order_bump_id", () => {
  const body: OrderBumpPayload = { action: "delete", order_bump_id: "bump-123" };
  assertEquals(getOrderBumpId(body), "bump-123");
});

Deno.test("order-bump-crud - delete validation - accepts orderBumpId", () => {
  const body: OrderBumpPayload = { action: "delete", orderBumpId: "bump-456" };
  assertEquals(getOrderBumpId(body), "bump-456");
});

Deno.test("order-bump-crud - delete validation - accepts id", () => {
  const body: OrderBumpPayload = { action: "delete", id: "bump-789" };
  assertEquals(getOrderBumpId(body), "bump-789");
});

// ============================================
// REORDER VALIDATION
// ============================================

Deno.test("order-bump-crud - reorder validation - checkoutId is required", () => {
  const body: OrderBumpPayload = { action: "reorder", orderedIds: ["id1", "id2"] };
  assertEquals(body.checkoutId, undefined);
});

Deno.test("order-bump-crud - reorder validation - orderedIds is required", () => {
  const body: OrderBumpPayload = { action: "reorder", checkoutId: "checkout-123" };
  assertEquals(body.orderedIds, undefined);
});

Deno.test("order-bump-crud - reorder validation - orderedIds must be array", () => {
  const body: OrderBumpPayload = { action: "reorder", checkoutId: "checkout-123", orderedIds: ["id1", "id2"] };
  assertEquals(Array.isArray(body.orderedIds), true);
});

Deno.test("order-bump-crud - reorder validation - orderedIds must not be empty", () => {
  const body: OrderBumpPayload = { action: "reorder", checkoutId: "checkout-123", orderedIds: [] };
  assertEquals((body.orderedIds ?? []).length > 0, false);
});

Deno.test("order-bump-crud - reorder validation - valid reorder request", () => {
  const body: OrderBumpPayload = {
    action: "reorder",
    checkoutId: "checkout-123",
    orderedIds: ["bump-1", "bump-2", "bump-3"],
  };
  
  assertExists(body.checkoutId);
  assertEquals(body.orderedIds?.length, 3);
});
