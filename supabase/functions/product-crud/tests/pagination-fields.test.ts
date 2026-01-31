/**
 * Pagination, Status & Fields Tests for product-crud
 * @module product-crud/tests/pagination-fields.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { calculateOffset, calculateTotalPages, convertReaisToCents, sanitizeText, VALID_STATUSES, DEFAULT_STATUS, type ProductData } from "./_shared.ts";

// ============================================
// PAGINATION CALCULATION
// ============================================

Deno.test("product-crud - pagination - calculates offset correctly", () => {
  assertEquals(calculateOffset(3, 20), 40);
});

Deno.test("product-crud - pagination - page 1 has offset 0", () => {
  assertEquals(calculateOffset(1, 20), 0);
});

Deno.test("product-crud - pagination - calculates total pages correctly", () => {
  assertEquals(calculateTotalPages(55, 20), 3);
});

// ============================================
// STATUS VALUES
// ============================================

Deno.test("product-crud - status - valid product statuses", () => {
  assertEquals(VALID_STATUSES.includes("active"), true);
  assertEquals(VALID_STATUSES.includes("inactive"), true);
});

Deno.test("product-crud - status - default status for new products", () => {
  assertEquals(DEFAULT_STATUS, "draft");
});

// ============================================
// PRODUCT FIELDS
// ============================================

Deno.test("product-crud - fields - product has expected structure", () => {
  const product: ProductData = {
    id: "uuid-123",
    name: "Test Product",
    description: "Description",
    price: 9900,
    status: "active",
    user_id: "user-uuid",
  };
  
  assertExists(product.id);
  assertExists(product.name);
  assertExists(product.user_id);
});

Deno.test("product-crud - fields - price is in cents", () => {
  assertEquals(convertReaisToCents(99.00), 9900);
});

// ============================================
// SANITIZATION
// ============================================

Deno.test("product-crud - sanitization - trims product name", () => {
  assertEquals(sanitizeText("  Product Name  "), "Product Name");
});

Deno.test("product-crud - sanitization - trims product description", () => {
  assertEquals(sanitizeText("  Product description with spaces  "), "Product description with spaces");
});
