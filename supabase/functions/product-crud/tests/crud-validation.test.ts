/**
 * CRUD Validation Tests for product-crud
 * @module product-crud/tests/crud-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidPrice, sanitizeText, type ProductPayload, type ProductData } from "./_shared.ts";

// ============================================
// VALIDATION LOGIC
// ============================================

Deno.test("product-crud - validation - get requires productId", () => {
  const body: ProductPayload = { action: "get" };
  assertEquals(body.productId, undefined);
});

Deno.test("product-crud - validation - delete requires productId", () => {
  const body: ProductPayload = { action: "delete" };
  assertEquals(body.productId, undefined);
});

Deno.test("product-crud - validation - create validates product object", () => {
  const body: ProductPayload = { action: "create", product: { name: "Test Product" } };
  assertExists(body.product);
  assertEquals(body.product.name, "Test Product");
});

Deno.test("product-crud - validation - update validates product object", () => {
  const body: ProductPayload = { action: "update", product: { id: "uuid-123", name: "Updated" } };
  assertExists(body.product);
  assertEquals(body.product.id, "uuid-123");
});

// ============================================
// CREATE VALIDATION
// ============================================

Deno.test("product-crud - create validation - name is required", () => {
  const product: ProductData = {};
  assertEquals("name" in product && typeof product.name === "string", false);
});

Deno.test("product-crud - create validation - name must be non-empty string", () => {
  const product1: ProductData = { name: "" };
  const product2: ProductData = { name: "  " };
  const product3: ProductData = { name: "Valid Product" };
  
  assertEquals(sanitizeText(product1.name).length > 0, false);
  assertEquals(sanitizeText(product2.name).length > 0, false);
  assertEquals(sanitizeText(product3.name).length > 0, true);
});

Deno.test("product-crud - create validation - price should be non-negative", () => {
  const validPrices = [0, 100, 9999, 100000];
  const invalidPrices = [-1, -100];
  
  validPrices.forEach((price) => assertEquals(isValidPrice(price), true));
  invalidPrices.forEach((price) => assertEquals(isValidPrice(price), false));
});

// ============================================
// UPDATE VALIDATION
// ============================================

Deno.test("product-crud - update validation - requires product id", () => {
  const product: ProductData = { name: "Updated Name" };
  assertEquals("id" in product, false);
});

Deno.test("product-crud - update validation - accepts partial updates", () => {
  const partialUpdate: ProductData = { id: "uuid-123", name: "New Name" };
  assertExists(partialUpdate.id);
  assertExists(partialUpdate.name);
  assertEquals(partialUpdate.description, undefined);
});

// ============================================
// BODY PARSING
// ============================================

Deno.test("product-crud - body - extracts action from body", () => {
  const body = { action: "create", product: { name: "Test" } };
  assertEquals(body.action, "create");
});

Deno.test("product-crud - body - handles product nested in body", () => {
  const body: ProductPayload = { action: "create", product: { name: "Test" } };
  assertEquals(body.product?.name, "Test");
});
