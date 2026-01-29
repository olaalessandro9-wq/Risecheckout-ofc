/**
 * Builder Machine Actions Tests
 * 
 * @module members-area-builder/machines/__tests__
 * @see RISE ARCHITECT PROTOCOL V3 - Testing System 10.0/10
 * 
 * Tests for pure action helper functions used in the Builder State Machine.
 * These are pure functions that can be tested directly without the machine.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getActiveSections,
  setActiveSections,
  cloneDesktopToMobile,
  addSectionToList,
  updateSectionInList,
  updateSectionSettingsInList,
  deleteSectionFromList,
  reorderSectionsInList,
  duplicateSectionInList,
  getSelectedSectionAfterDelete,
} from "../builderMachine.actions";
import type { BuilderMachineContext } from "../builderMachine.types";
import type { Section, Viewport, SectionSettings } from "../../types";
import { DEFAULT_BUILDER_SETTINGS } from "../../types";

// ============================================================================
// MOCKS
// ============================================================================

beforeEach(() => {
  vi.stubGlobal("crypto", {
    randomUUID: () => "test-uuid-12345",
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createSection(overrides: Partial<Section> = {}): Section {
  return {
    id: `section-${Math.random().toString(36).slice(2)}`,
    product_id: "product-1",
    type: "text",
    viewport: "desktop" as Viewport,
    title: "Test Section",
    position: 0,
    settings: { type: "text", content: "Test content", alignment: "left" },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createContext(overrides: Partial<BuilderMachineContext> = {}): BuilderMachineContext {
  return {
    productId: "product-1",
    desktopSections: [],
    mobileSections: [],
    activeViewport: "desktop",
    isMobileSynced: true,
    settings: { ...DEFAULT_BUILDER_SETTINGS },
    selectedSectionId: null,
    selectedMenuItemId: null,
    viewMode: "desktop",
    isPreviewMode: false,
    isMenuCollapsed: false,
    modules: [],
    selectedModuleId: null,
    isEditingModule: false,
    originalDesktopSections: [],
    originalMobileSections: [],
    originalSettings: { ...DEFAULT_BUILDER_SETTINGS },
    loadError: null,
    saveError: null,
    ...overrides,
  };
}

// ============================================================================
// getActiveSections TESTS
// ============================================================================

describe("getActiveSections", () => {
  it("returns desktop sections when activeViewport is desktop", () => {
    const desktopSections = [createSection({ id: "d1" })];
    const mobileSections = [createSection({ id: "m1" })];
    const context = createContext({ 
      desktopSections, 
      mobileSections,
      activeViewport: "desktop" 
    });
    
    expect(getActiveSections(context)).toEqual(desktopSections);
  });

  it("returns mobile sections when activeViewport is mobile", () => {
    const desktopSections = [createSection({ id: "d1" })];
    const mobileSections = [createSection({ id: "m1" })];
    const context = createContext({ 
      desktopSections, 
      mobileSections,
      activeViewport: "mobile" 
    });
    
    expect(getActiveSections(context)).toEqual(mobileSections);
  });
});

// ============================================================================
// setActiveSections TESTS
// ============================================================================

describe("setActiveSections", () => {
  it("updates desktop sections when activeViewport is desktop", () => {
    const context = createContext({ activeViewport: "desktop", isMobileSynced: false });
    const newSections = [createSection({ id: "new1" })];
    
    const result = setActiveSections(context, newSections);
    
    expect(result.desktopSections).toEqual(newSections);
    expect(result.mobileSections).toBeUndefined();
  });

  it("updates mobile sections when activeViewport is mobile", () => {
    const context = createContext({ activeViewport: "mobile" });
    const newSections = [createSection({ id: "new1" })];
    
    const result = setActiveSections(context, newSections);
    
    expect(result.mobileSections).toEqual(newSections);
    expect(result.desktopSections).toBeUndefined();
  });

  it("syncs desktop to mobile when isMobileSynced is true", () => {
    const context = createContext({ activeViewport: "desktop", isMobileSynced: true });
    const newSections = [createSection({ id: "d1", viewport: "desktop" })];
    
    const result = setActiveSections(context, newSections);
    
    expect(result.desktopSections).toEqual(newSections);
    expect(result.mobileSections).toBeDefined();
    expect(result.mobileSections?.[0].viewport).toBe("mobile");
  });
});

// ============================================================================
// cloneDesktopToMobile TESTS
// ============================================================================

describe("cloneDesktopToMobile", () => {
  it("creates mobile copies with new IDs", () => {
    const desktopSections = [
      createSection({ id: "d1", viewport: "desktop" }),
      createSection({ id: "d2", viewport: "desktop" }),
    ];
    
    const result = cloneDesktopToMobile(desktopSections);
    
    expect(result.length).toBe(2);
    expect(result[0].id).not.toBe("d1");
    expect(result[0].id.startsWith("temp_")).toBe(true);
  });

  it("sets viewport to mobile", () => {
    const desktopSections = [createSection({ viewport: "desktop" })];
    
    const result = cloneDesktopToMobile(desktopSections);
    
    expect(result[0].viewport).toBe("mobile");
  });

  it("updates timestamps", () => {
    const oldDate = "2020-01-01T00:00:00.000Z";
    const desktopSections = [createSection({ created_at: oldDate, updated_at: oldDate })];
    
    const result = cloneDesktopToMobile(desktopSections);
    
    expect(result[0].created_at).not.toBe(oldDate);
    expect(result[0].updated_at).not.toBe(oldDate);
  });

  it("handles empty array", () => {
    const result = cloneDesktopToMobile([]);
    expect(result).toEqual([]);
  });
});

// ============================================================================
// addSectionToList TESTS
// ============================================================================

describe("addSectionToList", () => {
  it("adds section to empty list", () => {
    const newSection = createSection({ id: "s1", position: 0 });
    
    const result = addSectionToList([], newSection);
    
    expect(result.length).toBe(1);
    expect(result[0]).toEqual(newSection);
  });

  it("maintains position order after adding", () => {
    const existing = [
      createSection({ id: "s1", position: 0 }),
      createSection({ id: "s3", position: 2 }),
    ];
    const newSection = createSection({ id: "s2", position: 1 });
    
    const result = addSectionToList(existing, newSection);
    
    expect(result.map(s => s.id)).toEqual(["s1", "s2", "s3"]);
  });
});

// ============================================================================
// updateSectionInList TESTS
// ============================================================================

describe("updateSectionInList", () => {
  it("updates specified section", () => {
    const sections = [createSection({ id: "s1", title: "Original" })];
    
    const result = updateSectionInList(sections, "s1", { title: "Updated" });
    
    expect(result[0].title).toBe("Updated");
  });

  it("updates timestamp", () => {
    const oldDate = "2020-01-01T00:00:00.000Z";
    const sections = [createSection({ id: "s1", updated_at: oldDate })];
    
    const result = updateSectionInList(sections, "s1", { title: "New" });
    
    expect(result[0].updated_at).not.toBe(oldDate);
  });

  it("leaves other sections unchanged", () => {
    const sections = [
      createSection({ id: "s1", title: "First" }),
      createSection({ id: "s2", title: "Second" }),
    ];
    
    const result = updateSectionInList(sections, "s1", { title: "Updated" });
    
    expect(result[1].title).toBe("Second");
  });

  it("handles non-existent ID gracefully", () => {
    const sections = [createSection({ id: "s1" })];
    
    const result = updateSectionInList(sections, "non-existent", { title: "New" });
    
    expect(result).toEqual(sections);
  });
});

// ============================================================================
// updateSectionSettingsInList TESTS
// ============================================================================

describe("updateSectionSettingsInList", () => {
  it("merges settings for specified section", () => {
    const sections = [createSection({ 
      id: "s1", 
      settings: { type: "text", content: "Old", alignment: "left" } 
    })];
    
    const result = updateSectionSettingsInList(sections, "s1", { content: "New" } as Partial<SectionSettings>);
    
    expect((result[0].settings as { content: string }).content).toBe("New");
    expect((result[0].settings as { alignment: string }).alignment).toBe("left");
  });

  it("updates timestamp", () => {
    const oldDate = "2020-01-01T00:00:00.000Z";
    const sections = [createSection({ id: "s1", updated_at: oldDate })];
    
    const result = updateSectionSettingsInList(sections, "s1", {} as Partial<SectionSettings>);
    
    expect(result[0].updated_at).not.toBe(oldDate);
  });
});

// ============================================================================
// deleteSectionFromList TESTS
// ============================================================================

describe("deleteSectionFromList", () => {
  it("removes specified section", () => {
    const sections = [
      createSection({ id: "s1" }),
      createSection({ id: "s2" }),
    ];
    
    const result = deleteSectionFromList(sections, "s1");
    
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("s2");
  });

  it("handles non-existent ID", () => {
    const sections = [createSection({ id: "s1" })];
    
    const result = deleteSectionFromList(sections, "non-existent");
    
    expect(result).toEqual(sections);
  });

  it("handles empty array", () => {
    const result = deleteSectionFromList([], "s1");
    expect(result).toEqual([]);
  });
});

// ============================================================================
// reorderSectionsInList TESTS
// ============================================================================

describe("reorderSectionsInList", () => {
  it("reorders sections based on ID array", () => {
    const sections = [
      createSection({ id: "a", position: 0 }),
      createSection({ id: "b", position: 1 }),
      createSection({ id: "c", position: 2 }),
    ];
    
    const result = reorderSectionsInList(sections, ["c", "a", "b"]);
    
    expect(result.map(s => s.id)).toEqual(["c", "a", "b"]);
  });

  it("updates positions to match new order", () => {
    const sections = [
      createSection({ id: "a", position: 0 }),
      createSection({ id: "b", position: 1 }),
    ];
    
    const result = reorderSectionsInList(sections, ["b", "a"]);
    
    expect(result[0].position).toBe(0);
    expect(result[1].position).toBe(1);
  });

  it("updates timestamps", () => {
    const oldDate = "2020-01-01T00:00:00.000Z";
    const sections = [createSection({ id: "a", updated_at: oldDate })];
    
    const result = reorderSectionsInList(sections, ["a"]);
    
    expect(result[0].updated_at).not.toBe(oldDate);
  });
});

// ============================================================================
// duplicateSectionInList TESTS
// ============================================================================

describe("duplicateSectionInList", () => {
  it("adds duplicate after original", () => {
    const sections = [
      createSection({ id: "a", position: 0 }),
      createSection({ id: "b", position: 1 }),
    ];
    const original = sections[0];
    const duplicate = createSection({ id: "a-copy", position: 1 });
    
    const result = duplicateSectionInList(sections, original, duplicate);
    
    expect(result.length).toBe(3);
    expect(result.map(s => s.id)).toEqual(["a", "a-copy", "b"]);
  });

  it("shifts positions of sections after original", () => {
    const sections = [
      createSection({ id: "a", position: 0 }),
      createSection({ id: "b", position: 1 }),
    ];
    const original = sections[0];
    const duplicate = createSection({ id: "a-copy", position: 1 });
    
    const result = duplicateSectionInList(sections, original, duplicate);
    
    // b should now be at position 2
    const bSection = result.find(s => s.id === "b");
    expect(bSection?.position).toBe(2);
  });
});

// ============================================================================
// getSelectedSectionAfterDelete TESTS
// ============================================================================

describe("getSelectedSectionAfterDelete", () => {
  it("returns null when deleted section was selected", () => {
    const result = getSelectedSectionAfterDelete("s1", "s1");
    expect(result).toBeNull();
  });

  it("returns current selection when different section deleted", () => {
    const result = getSelectedSectionAfterDelete("s1", "s2");
    expect(result).toBe("s1");
  });

  it("returns null when no section was selected", () => {
    const result = getSelectedSectionAfterDelete(null, "s1");
    expect(result).toBeNull();
  });
});
