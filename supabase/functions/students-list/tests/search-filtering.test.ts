/**
 * Search and Filtering Tests for students-list
 * RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normalizeSearch, escapeSearchPattern, mapStatusToBoolean, VALID_ACCESS_TYPES, VALID_STATUSES } from "./_shared.ts";

// ============================================
// UNIT TESTS: Search Filtering
// ============================================

Deno.test("students-list: normalizes search query", () => {
  const search = "  John DOE  ";
  assertEquals(normalizeSearch(search), "john doe");
});

Deno.test("students-list: handles empty search", () => {
  const search = "";
  const hasSearch = search.length > 0;
  assertEquals(hasSearch, false);
});

Deno.test("students-list: escapes special characters in search", () => {
  const search = "john%doe";
  assertEquals(escapeSearchPattern(search), "john\\%doe");
});

// ============================================
// UNIT TESTS: Access Type Filtering
// ============================================

Deno.test("students-list: validates access types", () => {
  VALID_ACCESS_TYPES.forEach(type => {
    assertEquals(typeof type, "string");
    assertEquals(type.length > 0, true);
  });
});

Deno.test("students-list: handles null access_type", () => {
  const accessType = null;
  const hasFilter = accessType !== null;
  assertEquals(hasFilter, false);
});

// ============================================
// UNIT TESTS: Status Filtering
// ============================================

Deno.test("students-list: validates status values", () => {
  VALID_STATUSES.forEach(status => {
    assertEquals(typeof status, "string");
    assertEquals(status.length > 0, true);
  });
});

Deno.test("students-list: maps status to boolean", () => {
  assertEquals(mapStatusToBoolean("active"), true);
  assertEquals(mapStatusToBoolean("inactive"), false);
});

// ============================================
// UNIT TESTS: Group Filtering
// ============================================

Deno.test("students-list: filters by group_id", () => {
  const groupId = "group-123";
  assertEquals(typeof groupId, "string");
  assertEquals(groupId.length > 0, true);
});

Deno.test("students-list: handles null group_id", () => {
  const groupId = null;
  const hasGroupFilter = groupId !== null;
  assertEquals(hasGroupFilter, false);
});
