/**
 * Builder Machine Guards Tests
 * 
 * @module members-area-builder/machines/__tests__
 * @see RISE ARCHITECT PROTOCOL V3 - Testing System 10.0/10
 * 
 * Tests for all guard functions used in the Builder State Machine.
 */

import { describe, it, expect } from "vitest";
import {
  isDirty,
  canSave,
  hasSelectedSection,
  hasProduct,
} from "../builderMachine.guards";
import type { BuilderMachineContext } from "../builderMachine.types";
import type { Section, MembersAreaBuilderSettings, Viewport } from "../../types";
import { DEFAULT_BUILDER_SETTINGS } from "../../types";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createSection(overrides: Partial<Section> = {}): Section {
  return {
    id: `section-${crypto.randomUUID()}`,
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
  const defaultSections: Section[] = [];
  const defaultSettings: MembersAreaBuilderSettings = { ...DEFAULT_BUILDER_SETTINGS };

  return {
    productId: "product-1",
    desktopSections: defaultSections,
    mobileSections: defaultSections,
    activeViewport: "desktop",
    isMobileSynced: true,
    settings: defaultSettings,
    selectedSectionId: null,
    selectedMenuItemId: null,
    viewMode: "desktop",
    isPreviewMode: false,
    isMenuCollapsed: false,
    modules: [],
    selectedModuleId: null,
    isEditingModule: false,
    originalDesktopSections: defaultSections,
    originalMobileSections: defaultSections,
    originalSettings: defaultSettings,
    loadError: null,
    saveError: null,
    ...overrides,
  };
}

// ============================================================================
// isDirty GUARD TESTS
// ============================================================================

describe("isDirty guard", () => {
  it("returns false when desktop sections unchanged", () => {
    const sections = [createSection({ id: "s1", position: 0 })];
    const context = createContext({
      desktopSections: sections,
      originalDesktopSections: sections,
    });
    
    expect(isDirty({ context })).toBe(false);
  });

  it("returns true when desktop section added", () => {
    const original = [createSection({ id: "s1", position: 0 })];
    const current = [...original, createSection({ id: "s2", position: 1 })];
    const context = createContext({
      desktopSections: current,
      originalDesktopSections: original,
    });
    
    expect(isDirty({ context })).toBe(true);
  });

  it("returns true when desktop section removed", () => {
    const original = [
      createSection({ id: "s1", position: 0 }),
      createSection({ id: "s2", position: 1 }),
    ];
    const current = [createSection({ id: "s1", position: 0 })];
    const context = createContext({
      desktopSections: current,
      originalDesktopSections: original,
    });
    
    expect(isDirty({ context })).toBe(true);
  });

  it("returns true when section position changed", () => {
    const original = [createSection({ id: "s1", position: 0 })];
    const current = [createSection({ id: "s1", position: 1 })];
    const context = createContext({
      desktopSections: current,
      originalDesktopSections: original,
    });
    
    expect(isDirty({ context })).toBe(true);
  });

  it("returns true when section title changed", () => {
    const original = [createSection({ id: "s1", title: "Original" })];
    const current = [createSection({ id: "s1", title: "Modified" })];
    const context = createContext({
      desktopSections: current,
      originalDesktopSections: original,
    });
    
    expect(isDirty({ context })).toBe(true);
  });

  it("returns true when section is_active changed", () => {
    const original = [createSection({ id: "s1", is_active: true })];
    const current = [createSection({ id: "s1", is_active: false })];
    const context = createContext({
      desktopSections: current,
      originalDesktopSections: original,
    });
    
    expect(isDirty({ context })).toBe(true);
  });

  it("returns true when mobile sections changed", () => {
    const original: Section[] = [];
    const current = [createSection({ id: "m1", viewport: "mobile" })];
    const context = createContext({
      mobileSections: current,
      originalMobileSections: original,
    });
    
    expect(isDirty({ context })).toBe(true);
  });

  it("returns true when settings changed", () => {
    const original: MembersAreaBuilderSettings = { 
      ...DEFAULT_BUILDER_SETTINGS,
      primary_color: "#000000", 
    };
    const current: MembersAreaBuilderSettings = { 
      ...DEFAULT_BUILDER_SETTINGS,
      primary_color: "#FF0000",
    };
    const context = createContext({
      settings: current,
      originalSettings: original,
    });
    
    expect(isDirty({ context })).toBe(true);
  });

  it("returns false when all unchanged", () => {
    const sections = [createSection({ id: "s1" })];
    const settings = { ...DEFAULT_BUILDER_SETTINGS };
    const context = createContext({
      desktopSections: sections,
      mobileSections: [],
      settings,
      originalDesktopSections: sections,
      originalMobileSections: [],
      originalSettings: settings,
    });
    
    expect(isDirty({ context })).toBe(false);
  });
});

// ============================================================================
// canSave GUARD TESTS
// ============================================================================

describe("canSave guard", () => {
  it("returns true when dirty (same as isDirty)", () => {
    const original = [createSection({ id: "s1" })];
    const current = [...original, createSection({ id: "s2" })];
    const context = createContext({
      desktopSections: current,
      originalDesktopSections: original,
    });
    
    expect(canSave({ context })).toBe(true);
  });

  it("returns false when not dirty", () => {
    const sections = [createSection({ id: "s1" })];
    const context = createContext({
      desktopSections: sections,
      originalDesktopSections: sections,
    });
    
    expect(canSave({ context })).toBe(false);
  });
});

// ============================================================================
// hasSelectedSection GUARD TESTS
// ============================================================================

describe("hasSelectedSection guard", () => {
  it("returns true when section is selected", () => {
    const context = createContext({
      selectedSectionId: "section-123",
    });
    
    expect(hasSelectedSection({ context })).toBe(true);
  });

  it("returns false when no section selected", () => {
    const context = createContext({
      selectedSectionId: null,
    });
    
    expect(hasSelectedSection({ context })).toBe(false);
  });
});

// ============================================================================
// hasProduct GUARD TESTS
// ============================================================================

describe("hasProduct guard", () => {
  it("returns true when productId is set", () => {
    const context = createContext({
      productId: "product-123",
    });
    
    expect(hasProduct({ context })).toBe(true);
  });

  it("returns false when productId is null", () => {
    const context = createContext({
      productId: null,
    });
    
    expect(hasProduct({ context })).toBe(false);
  });
});

// ============================================================================
// COMBINED SCENARIOS
// ============================================================================

describe("combined guard scenarios", () => {
  it("dirty context with product and section selected", () => {
    const original = [createSection({ id: "s1" })];
    const current = [createSection({ id: "s1", title: "Modified" })];
    const context = createContext({
      productId: "product-1",
      desktopSections: current,
      originalDesktopSections: original,
      selectedSectionId: "s1",
    });
    
    expect(isDirty({ context })).toBe(true);
    expect(canSave({ context })).toBe(true);
    expect(hasProduct({ context })).toBe(true);
    expect(hasSelectedSection({ context })).toBe(true);
  });

  it("pristine context without selection", () => {
    const sections = [createSection({ id: "s1" })];
    const context = createContext({
      productId: "product-1",
      desktopSections: sections,
      originalDesktopSections: sections,
      selectedSectionId: null,
    });
    
    expect(isDirty({ context })).toBe(false);
    expect(canSave({ context })).toBe(false);
    expect(hasProduct({ context })).toBe(true);
    expect(hasSelectedSection({ context })).toBe(false);
  });
});
