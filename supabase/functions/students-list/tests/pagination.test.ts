/**
 * Pagination Tests for students-list
 * RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { calculateOffset, calculateTotalPages, clampLimit, MAX_LIMIT, MIN_LIMIT } from "./_shared.ts";

// ============================================
// UNIT TESTS: Pagination
// ============================================

Deno.test("students-list: calculates pagination offset", () => {
  const testCases = [
    { page: 1, limit: 20, expectedOffset: 0 },
    { page: 2, limit: 20, expectedOffset: 20 },
    { page: 3, limit: 10, expectedOffset: 20 },
    { page: 5, limit: 25, expectedOffset: 100 },
  ];

  testCases.forEach(({ page, limit, expectedOffset }) => {
    assertEquals(calculateOffset(page, limit), expectedOffset);
  });
});

Deno.test("students-list: enforces maximum limit", () => {
  const actualLimit = clampLimit(500);
  assertEquals(actualLimit, MAX_LIMIT);
});

Deno.test("students-list: enforces minimum limit", () => {
  const actualLimit = clampLimit(-5);
  assertEquals(actualLimit, MIN_LIMIT);
});

Deno.test("students-list: calculates total pages", () => {
  const testCases = [
    { total: 100, limit: 20, expectedPages: 5 },
    { total: 101, limit: 20, expectedPages: 6 },
    { total: 0, limit: 20, expectedPages: 0 },
    { total: 19, limit: 20, expectedPages: 1 },
    { total: 20, limit: 20, expectedPages: 1 },
  ];

  testCases.forEach(({ total, limit, expectedPages }) => {
    assertEquals(calculateTotalPages(total, limit), expectedPages);
  });
});
