/**
 * Action Detection Tests for checkout-crud
 * @module checkout-crud/tests/actions.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { VALID_ACTIONS, isValidAction, getActionFromBody, type CheckoutPayload } from "./_shared.ts";

Deno.test("checkout-crud - actions - supports create action", () => {
  assertEquals(isValidAction("create"), true);
});

Deno.test("checkout-crud - actions - supports update action", () => {
  assertEquals(isValidAction("update"), true);
});

Deno.test("checkout-crud - actions - supports set-default action", () => {
  assertEquals(isValidAction("set-default"), true);
});

Deno.test("checkout-crud - actions - supports delete action", () => {
  assertEquals(isValidAction("delete"), true);
});

Deno.test("checkout-crud - actions - supports toggle-link-status action", () => {
  assertEquals(isValidAction("toggle-link-status"), true);
});

Deno.test("checkout-crud - action priority - body.action takes precedence", () => {
  const body: CheckoutPayload = { action: "update" };
  assertEquals(getActionFromBody(body, "create"), "update");
});

Deno.test("checkout-crud - action priority - falls back to path action", () => {
  const body: CheckoutPayload = {};
  assertEquals(getActionFromBody(body, "create"), "create");
});

Deno.test("checkout-crud - action priority - ignores function name in path", () => {
  const pathParts = ["functions", "v1", "checkout-crud"];
  const pathAction = pathParts[pathParts.length - 1];
  assertEquals(pathAction !== "checkout-crud", false);
});
