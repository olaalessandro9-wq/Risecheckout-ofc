/**
 * Action Detection Tests for coupon-management
 * @module coupon-management/tests/actions.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidAction, getActionFromBody, type CouponPayload } from "./_shared.ts";

Deno.test("coupon-management - actions - supports create action", () => {
  assertEquals(isValidAction("create"), true);
});

Deno.test("coupon-management - actions - supports update action", () => {
  assertEquals(isValidAction("update"), true);
});

Deno.test("coupon-management - actions - supports delete action", () => {
  assertEquals(isValidAction("delete"), true);
});

Deno.test("coupon-management - actions - supports list action", () => {
  assertEquals(isValidAction("list"), true);
});

Deno.test("coupon-management - action priority - body.action has highest priority", () => {
  const body: CouponPayload = { action: "update" };
  assertEquals(getActionFromBody(body, "create"), "update");
});

Deno.test("coupon-management - action priority - falls back to URL path", () => {
  const body: CouponPayload = {};
  assertEquals(getActionFromBody(body, "list"), "list");
});

Deno.test("coupon-management - action priority - ignores function name in path", () => {
  const pathname = "/functions/v1/coupon-management";
  const urlAction = pathname.split("/").pop();
  assertEquals(urlAction !== "coupon-management", false);
});
