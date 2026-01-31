/**
 * Filtering Tests for marketplace-public
 * 
 * @module marketplace-public/tests/filtering.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  filterByCategory, 
  filterBySearch, 
  filterByCommission, 
  filterByApproval, 
  filterByType,
  MOCK_PRODUCTS 
} from "./_shared.ts";

// ============================================================================
// CATEGORY FILTERING TESTS
// ============================================================================

Deno.test("marketplace-public - Category - filters correctly", () => {
  const result = filterByCategory(MOCK_PRODUCTS, "marketing");
  assertEquals(result.length, 1);
  assertEquals(result[0].name, "Curso de Marketing");
});

Deno.test("marketplace-public - Category - no match returns empty", () => {
  const result = filterByCategory(MOCK_PRODUCTS, "nonexistent");
  assertEquals(result.length, 0);
});

// ============================================================================
// SEARCH FILTERING TESTS
// ============================================================================

Deno.test("marketplace-public - Search - finds by name", () => {
  const result = filterBySearch(MOCK_PRODUCTS, "Marketing");
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "prod-1");
});

Deno.test("marketplace-public - Search - finds by description", () => {
  const result = filterBySearch(MOCK_PRODUCTS, "técnicas");
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "prod-2");
});

Deno.test("marketplace-public - Search - case insensitive", () => {
  const result = filterBySearch(MOCK_PRODUCTS, "MARKETING");
  assertEquals(result.length, 1);
});

Deno.test("marketplace-public - Search - no match returns empty", () => {
  const result = filterBySearch(MOCK_PRODUCTS, "xyz123");
  assertEquals(result.length, 0);
});

// ============================================================================
// COMMISSION FILTERING TESTS
// ============================================================================

Deno.test("marketplace-public - Commission - min only", () => {
  const result = filterByCommission(MOCK_PRODUCTS, 40, undefined);
  assertEquals(result.length, 2);
});

Deno.test("marketplace-public - Commission - max only", () => {
  const result = filterByCommission(MOCK_PRODUCTS, undefined, 35);
  assertEquals(result.length, 1);
  assertEquals(result[0].commission_percentage, 30);
});

Deno.test("marketplace-public - Commission - range", () => {
  const result = filterByCommission(MOCK_PRODUCTS, 35, 45);
  assertEquals(result.length, 1);
  assertEquals(result[0].commission_percentage, 40);
});

// ============================================================================
// APPROVAL FILTERING TESTS
// ============================================================================

Deno.test("marketplace-public - Approval - immediate only", () => {
  const result = filterByApproval(MOCK_PRODUCTS, true, false);
  assertEquals(result.length, 2);
  assertEquals(result.every(p => !p.requires_manual_approval), true);
});

Deno.test("marketplace-public - Approval - moderation only", () => {
  const result = filterByApproval(MOCK_PRODUCTS, false, true);
  assertEquals(result.length, 1);
  assertEquals(result[0].requires_manual_approval, true);
});

Deno.test("marketplace-public - Approval - both returns all", () => {
  const result = filterByApproval(MOCK_PRODUCTS, true, true);
  assertEquals(result.length, MOCK_PRODUCTS.length);
});

Deno.test("marketplace-public - Approval - neither returns all", () => {
  const result = filterByApproval(MOCK_PRODUCTS, false, false);
  assertEquals(result.length, MOCK_PRODUCTS.length);
});

// ============================================================================
// TYPE FILTERING TESTS
// ============================================================================

Deno.test("marketplace-public - Type - ebook only", () => {
  const result = filterByType(MOCK_PRODUCTS, true, false, false);
  assertEquals(result.length, 1);
  assertEquals(result[0].marketplace_tags.includes("ebook"), true);
});

Deno.test("marketplace-public - Type - service only", () => {
  const result = filterByType(MOCK_PRODUCTS, false, true, false);
  assertEquals(result.length, 1);
  assertEquals(result[0].marketplace_tags.includes("servico"), true);
});

Deno.test("marketplace-public - Type - course only", () => {
  const result = filterByType(MOCK_PRODUCTS, false, false, true);
  assertEquals(result.length, 1);
  assertEquals(result[0].marketplace_tags.includes("curso"), true);
});

Deno.test("marketplace-public - Type - all types returns all", () => {
  const result = filterByType(MOCK_PRODUCTS, true, true, true);
  assertEquals(result.length, MOCK_PRODUCTS.length);
});

// ============================================================================
// COMBINED FILTERS TESTS
// ============================================================================

Deno.test("marketplace-public - Combined - category + commission", () => {
  let result = filterByCategory(MOCK_PRODUCTS, "marketing");
  result = filterByCommission(result, 30, undefined);
  assertEquals(result.length, 1);
  assertEquals(result[0].name, "Curso de Marketing");
});

Deno.test("marketplace-public - Combined - search + type", () => {
  let result = filterBySearch(MOCK_PRODUCTS, "Consultoria");
  result = filterByType(result, false, true, false);
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "prod-3");
});
