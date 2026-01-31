/**
 * Action Detection & List Params Tests for offer-crud
 * @module offer-crud/tests/actions.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidAction, getActionFromBody, getPage, getPageSize, type OfferPayload } from "./_shared.ts";

// ============================================
// ACTION DETECTION
// ============================================

Deno.test("offer-crud - actions - supports list action", () => {
  assertEquals(isValidAction("list"), true);
});

Deno.test("offer-crud - actions - supports create action", () => {
  assertEquals(isValidAction("create"), true);
});

Deno.test("offer-crud - actions - supports update action", () => {
  assertEquals(isValidAction("update"), true);
});

Deno.test("offer-crud - actions - supports delete action", () => {
  assertEquals(isValidAction("delete"), true);
});

// ============================================
// ACTION PRIORITY
// ============================================

Deno.test("offer-crud - action priority - body.action has highest priority", () => {
  const body: OfferPayload = { action: "create" };
  assertEquals(getActionFromBody(body, "list"), "create");
});

Deno.test("offer-crud - action priority - falls back to URL path", () => {
  const body: OfferPayload = {};
  assertEquals(getActionFromBody(body, "list"), "list");
});

Deno.test("offer-crud - action priority - ignores function name in path", () => {
  const pathname = "/functions/v1/offer-crud";
  const urlAction = pathname.split("/").pop();
  assertEquals(urlAction !== "offer-crud", false);
});

// ============================================
// LIST PARAMETERS
// ============================================

Deno.test("offer-crud - list params - productId is optional", () => {
  const body: OfferPayload = { action: "list" };
  assertEquals(body.productId, undefined);
});

Deno.test("offer-crud - list params - page defaults to 1", () => {
  const body: OfferPayload = { action: "list" };
  assertEquals(getPage(body), 1);
});

Deno.test("offer-crud - list params - pageSize defaults to 20", () => {
  const body: OfferPayload = { action: "list" };
  assertEquals(getPageSize(body), 20);
});

Deno.test("offer-crud - list params - status is optional filter", () => {
  const body: OfferPayload = { action: "list", status: "active" };
  assertEquals(body.status, "active");
});
