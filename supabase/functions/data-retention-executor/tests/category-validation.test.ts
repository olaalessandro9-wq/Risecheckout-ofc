/**
 * Category Validation Tests for data-retention-executor
 * 
 * @module data-retention-executor/tests/category-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertArrayIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { VALID_CATEGORIES, isValidCategory } from "./_shared.ts";

// ============================================================================
// VALID CATEGORIES TESTS
// ============================================================================

Deno.test("Categories - should include all valid options", () => {
  assertEquals(VALID_CATEGORIES.length, 7);
  assertArrayIncludes(VALID_CATEGORIES, ['oauth']);
  assertArrayIncludes(VALID_CATEGORIES, ['sessions']);
  assertArrayIncludes(VALID_CATEGORIES, ['security']);
  assertArrayIncludes(VALID_CATEGORIES, ['gdpr']);
  assertArrayIncludes(VALID_CATEGORIES, ['rate_limit']);
  assertArrayIncludes(VALID_CATEGORIES, ['debug']);
  assertArrayIncludes(VALID_CATEGORIES, ['all']);
});

Deno.test("Categories - validation should reject invalid", () => {
  assertEquals(isValidCategory('oauth'), true);
  assertEquals(isValidCategory('invalid'), false);
  assertEquals(isValidCategory(''), false);
  assertEquals(isValidCategory('OAUTH'), false); // case sensitive
});

Deno.test("Categories - all types should be lowercase", () => {
  VALID_CATEGORIES.forEach(cat => {
    assertEquals(cat, cat.toLowerCase());
  });
});

Deno.test("Categories - should not contain duplicates", () => {
  const unique = new Set(VALID_CATEGORIES);
  assertEquals(unique.size, VALID_CATEGORIES.length);
});
