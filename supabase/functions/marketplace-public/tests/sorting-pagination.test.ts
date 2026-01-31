/**
 * Sorting & Pagination Tests for marketplace-public
 * 
 * @module marketplace-public/tests/sorting-pagination.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { sortProducts, paginateProducts, MOCK_PRODUCTS, MOCK_CATEGORIES } from "./_shared.ts";

// ============================================================================
// SORTING TESTS
// ============================================================================

Deno.test("marketplace-public - Sort - by recent (default)", () => {
  const result = sortProducts(MOCK_PRODUCTS, "recent");
  assertEquals(result[0].id, "prod-2");
});

Deno.test("marketplace-public - Sort - by popular", () => {
  const result = sortProducts(MOCK_PRODUCTS, "popular");
  assertEquals(result[0].id, "prod-1");
  assertEquals(result[0].popularity_score, 100);
});

Deno.test("marketplace-public - Sort - by commission", () => {
  const result = sortProducts(MOCK_PRODUCTS, "commission");
  assertEquals(result[0].id, "prod-2");
  assertEquals(result[0].commission_percentage, 50);
});

Deno.test("marketplace-public - Sort - undefined uses recent", () => {
  const result = sortProducts(MOCK_PRODUCTS, undefined);
  assertEquals(result[0].id, "prod-2");
});

// ============================================================================
// PAGINATION TESTS
// ============================================================================

Deno.test("marketplace-public - Pagination - limit only", () => {
  const result = paginateProducts(MOCK_PRODUCTS, 2, undefined);
  assertEquals(result.length, 2);
});

Deno.test("marketplace-public - Pagination - offset only", () => {
  const result = paginateProducts(MOCK_PRODUCTS, undefined, 1);
  assertEquals(result.length, 2);
  assertEquals(result[0].id, "prod-2");
});

Deno.test("marketplace-public - Pagination - limit and offset", () => {
  const result = paginateProducts(MOCK_PRODUCTS, 1, 1);
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "prod-2");
});

Deno.test("marketplace-public - Pagination - no params returns all", () => {
  const result = paginateProducts(MOCK_PRODUCTS, undefined, undefined);
  assertEquals(result.length, MOCK_PRODUCTS.length);
});

// ============================================================================
// CATEGORIES TESTS
// ============================================================================

Deno.test("marketplace-public - Categories - active only", () => {
  const activeCategories = MOCK_CATEGORIES.filter(c => c.active);
  assertEquals(activeCategories.length, 3);
});

Deno.test("marketplace-public - Categories - ordered by display_order", () => {
  const sorted = [...MOCK_CATEGORIES].sort((a, b) => a.display_order - b.display_order);
  assertEquals(sorted[0].slug, "marketing");
  assertEquals(sorted[1].slug, "vendas");
  assertEquals(sorted[2].slug, "negocios");
});
