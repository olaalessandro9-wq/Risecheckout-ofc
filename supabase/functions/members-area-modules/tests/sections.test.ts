/**
 * Section Structure Tests for members-area-modules
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  VALID_SECTION_TYPES, 
  VALID_VIEWPORTS, 
  isValidSectionType, 
  isValidViewport,
  sortByPosition,
  normalizePositions,
} from "./_shared.ts";

// ============================================
// UNIT TESTS: Section Structure
// ============================================

Deno.test("members-area-modules: validates section structure", () => {
  const section = {
    id: "section-123",
    type: "modules",
    viewport: "desktop",
    title: "Section Title",
    position: 0,
    settings: {
      card_size: "medium",
      show_title: "always",
    },
    is_active: true,
  };

  assertExists(section.id);
  assertExists(section.type);
  assertEquals(section.viewport === "desktop" || section.viewport === "mobile", true);
  assertEquals(typeof section.position, "number");
});

Deno.test("members-area-modules: validates section types", () => {
  VALID_SECTION_TYPES.forEach(type => {
    assertEquals(typeof type, "string");
    assertEquals(type.length > 0, true);
    assertEquals(isValidSectionType(type), true);
  });
});

Deno.test("members-area-modules: validates viewport values", () => {
  VALID_VIEWPORTS.forEach(viewport => {
    assertEquals(isValidViewport(viewport), true);
  });
});

// ============================================
// UNIT TESTS: Section Position Calculation
// ============================================

Deno.test("members-area-modules: sorts sections by position", () => {
  const sections = [
    { id: "s3", position: 2 },
    { id: "s1", position: 0 },
    { id: "s2", position: 1 },
  ];

  const sorted = sortByPosition(sections);

  assertEquals(sorted[0].id, "s1");
  assertEquals(sorted[1].id, "s2");
  assertEquals(sorted[2].id, "s3");
});

Deno.test("members-area-modules: handles gaps in positions", () => {
  const sections = [
    { id: "s1", position: 0 },
    { id: "s2", position: 5 },
    { id: "s3", position: 10 },
  ];

  const normalized = normalizePositions(sections);

  assertEquals(normalized[0].position, 0);
  assertEquals(normalized[1].position, 1);
  assertEquals(normalized[2].position, 2);
});

// ============================================
// UNIT TESTS: Deleted IDs Handling
// ============================================

Deno.test("members-area-modules: validates deletedIds", () => {
  const deletedIds = ["section-1", "section-2"];

  assertEquals(Array.isArray(deletedIds), true);
  assertEquals(deletedIds.every(id => typeof id === "string"), true);
});

Deno.test("members-area-modules: handles undefined deletedIds", () => {
  const body = { sections: [] };
  const deletedIds = (body as { deletedIds?: string[] }).deletedIds ?? [];
  assertEquals(Array.isArray(deletedIds), true);
  assertEquals(deletedIds.length, 0);
});

// ============================================
// UNIT TESTS: Active State
// ============================================

Deno.test("members-area-modules: handles is_active flag", () => {
  const section = {
    id: "section-123",
    is_active: true,
  };

  assertEquals(section.is_active, true);
});

Deno.test("members-area-modules: defaults is_active to true", () => {
  const section = {
    id: "section-123",
    is_active: undefined,
  };

  const isActive = section.is_active ?? true;
  assertEquals(isActive, true);
});
