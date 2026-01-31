/**
 * Actions & List Parameters Tests for product-crud
 * @module product-crud/tests/actions-list.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidAction, getPage, getPageSize, getSortOrder, type ProductPayload } from "./_shared.ts";

// ============================================
// ACTION DETECTION
// ============================================

Deno.test("product-crud - actions - supports list action", () => {
  assertEquals(isValidAction("list"), true);
});

Deno.test("product-crud - actions - supports get action", () => {
  assertEquals(isValidAction("get"), true);
});

Deno.test("product-crud - actions - supports create action", () => {
  assertEquals(isValidAction("create"), true);
});

Deno.test("product-crud - actions - supports update action", () => {
  assertEquals(isValidAction("update"), true);
});

Deno.test("product-crud - actions - supports delete action", () => {
  assertEquals(isValidAction("delete"), true);
});

// ============================================
// LIST PARAMETERS
// ============================================

Deno.test("product-crud - list params - page defaults to 1", () => {
  const body: ProductPayload = { action: "list" };
  assertEquals(getPage(body), 1);
});

Deno.test("product-crud - list params - pageSize defaults to 20", () => {
  const body: ProductPayload = { action: "list" };
  assertEquals(getPageSize(body), 20);
});

Deno.test("product-crud - list params - respects custom page", () => {
  const body: ProductPayload = { action: "list", page: 3 };
  assertEquals(getPage(body), 3);
});

Deno.test("product-crud - list params - respects custom pageSize", () => {
  const body: ProductPayload = { action: "list", pageSize: 50 };
  assertEquals(getPageSize(body), 50);
});

Deno.test("product-crud - list params - search is optional string", () => {
  const body: ProductPayload = { action: "list", search: "curso" };
  assertEquals(body.search, "curso");
});

Deno.test("product-crud - list params - status is optional string", () => {
  const body: ProductPayload = { action: "list", status: "active" };
  assertEquals(body.status, "active");
});

Deno.test("product-crud - list params - sortBy is optional string", () => {
  const body: ProductPayload = { action: "list", sortBy: "created_at" };
  assertEquals(body.sortBy, "created_at");
});

Deno.test("product-crud - list params - sortOrder accepts asc or desc", () => {
  assertEquals(getSortOrder("asc"), "asc");
  assertEquals(getSortOrder("desc"), "desc");
});

Deno.test("product-crud - list params - invalid sortOrder becomes undefined", () => {
  assertEquals(getSortOrder("invalid"), undefined);
});
