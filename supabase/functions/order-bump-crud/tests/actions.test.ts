/**
 * Action Detection Tests for order-bump-crud
 * @module order-bump-crud/tests/actions.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidAction, getActionFromBody, type OrderBumpPayload } from "./_shared.ts";

Deno.test("order-bump-crud - actions - supports create action", () => {
  assertEquals(isValidAction("create"), true);
});

Deno.test("order-bump-crud - actions - supports update action", () => {
  assertEquals(isValidAction("update"), true);
});

Deno.test("order-bump-crud - actions - supports delete action", () => {
  assertEquals(isValidAction("delete"), true);
});

Deno.test("order-bump-crud - actions - supports reorder action", () => {
  assertEquals(isValidAction("reorder"), true);
});

// ============================================
// ACTION PRIORITY
// ============================================

Deno.test("order-bump-crud - action priority - body.action takes precedence", () => {
  const body: OrderBumpPayload = { action: "update" };
  assertEquals(getActionFromBody(body, "create"), "update");
});

Deno.test("order-bump-crud - action priority - falls back to path action", () => {
  const body: OrderBumpPayload = {};
  assertEquals(getActionFromBody(body, "create"), "create");
});
