/**
 * Navigation Helpers Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for pure navigation helper functions including:
 * - Path matching and activation
 * - Active group discovery
 * - Sidebar width calculations
 * - User initials extraction
 * - LocalStorage state management
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isActivePath,
  hasActiveChild,
  findActiveGroups,
  getSidebarWidth,
  shouldShowLabels,
  getInitials,
  getStoredSidebarState,
  saveSidebarState,
} from "../navigationHelpers";
import type { NavItemConfig } from "../../types/navigation.types";
import { SIDEBAR_WIDTHS } from "../../types/navigation.types";
import { Package } from "lucide-react";

// ============================================
// FIXTURES
// ============================================

const createRouteItem = (id: string, path: string, exact?: boolean): NavItemConfig => ({
  id,
  label: `Item ${id}`,
  icon: Package,
  variant: { type: "route", path, exact },
});

const createGroupItem = (id: string, children: NavItemConfig[]): NavItemConfig => ({
  id,
  label: `Group ${id}`,
  icon: Package,
  variant: { type: "group", children },
});

// ============================================
// TESTS
// ============================================

describe("navigationHelpers", () => {
  describe("isActivePath()", () => {
    it("should return true for exact match on /dashboard", () => {
      expect(isActivePath("/dashboard", "/dashboard")).toBe(true);
    });

    it("should return false for /dashboard/* paths", () => {
      expect(isActivePath("/dashboard/produtos", "/dashboard")).toBe(false);
      expect(isActivePath("/dashboard/admin", "/dashboard")).toBe(false);
    });

    it("should return true for prefix match when not exact", () => {
      expect(isActivePath("/dashboard/produtos", "/dashboard/produtos")).toBe(true);
      expect(isActivePath("/dashboard/produtos/123", "/dashboard/produtos")).toBe(true);
    });

    it("should return false for non-matching paths", () => {
      expect(isActivePath("/dashboard/admin", "/dashboard/produtos")).toBe(false);
    });

    it("should respect exact parameter", () => {
      expect(isActivePath("/dashboard/produtos/123", "/dashboard/produtos", true)).toBe(false);
      expect(isActivePath("/dashboard/produtos", "/dashboard/produtos", true)).toBe(true);
    });

    it("should handle root path correctly", () => {
      expect(isActivePath("/", "/")).toBe(true);
      expect(isActivePath("/dashboard", "/")).toBe(true);
    });
  });

  describe("hasActiveChild()", () => {
    it("should return true when a child route is active", () => {
      const children = [
        createRouteItem("item1", "/dashboard/produtos"),
        createRouteItem("item2", "/dashboard/admin"),
      ];
      expect(hasActiveChild("/dashboard/produtos", children)).toBe(true);
    });

    it("should return false when no child is active", () => {
      const children = [
        createRouteItem("item1", "/dashboard/produtos"),
        createRouteItem("item2", "/dashboard/admin"),
      ];
      expect(hasActiveChild("/dashboard/financeiro", children)).toBe(false);
    });

    it("should ignore non-route children", () => {
      const children: NavItemConfig[] = [
        createRouteItem("item1", "/dashboard/produtos"),
        { id: "external", label: "External", icon: Package, variant: { type: "external", url: "https://example.com" } },
      ];
      expect(hasActiveChild("/dashboard/produtos", children)).toBe(true);
      expect(hasActiveChild("https://example.com", children)).toBe(false);
    });
  });

  describe("findActiveGroups()", () => {
    it("should return IDs of groups with active children", () => {
      const items = [
        createRouteItem("dashboard", "/dashboard"),
        createGroupItem("settings", [
          createRouteItem("pixels", "/dashboard/pixels"),
          createRouteItem("webhooks", "/dashboard/webhooks"),
        ]),
      ];
      const activeGroups = findActiveGroups(items, "/dashboard/pixels");
      expect(activeGroups).toEqual(["settings"]);
    });

    it("should return empty array when no groups have active children", () => {
      const items = [
        createRouteItem("dashboard", "/dashboard"),
        createGroupItem("settings", [createRouteItem("pixels", "/dashboard/pixels")]),
      ];
      const activeGroups = findActiveGroups(items, "/dashboard/produtos");
      expect(activeGroups).toEqual([]);
    });

    it("should handle multiple active groups", () => {
      const items = [
        createGroupItem("group1", [createRouteItem("item1", "/dashboard/produtos")]),
        createGroupItem("group2", [createRouteItem("item2", "/dashboard/produtos")]),
      ];
      const activeGroups = findActiveGroups(items, "/dashboard/produtos");
      expect(activeGroups).toEqual(["group1", "group2"]);
    });
  });

  describe("getSidebarWidth()", () => {
    it("should return 0 for hidden state", () => {
      expect(getSidebarWidth("hidden", false)).toBe(SIDEBAR_WIDTHS.hidden);
      expect(getSidebarWidth("hidden", true)).toBe(SIDEBAR_WIDTHS.hidden);
    });

    it("should return collapsed width when collapsed and not hovering", () => {
      expect(getSidebarWidth("collapsed", false)).toBe(SIDEBAR_WIDTHS.collapsed);
    });

    it("should return expanded width when collapsed and hovering", () => {
      expect(getSidebarWidth("collapsed", true)).toBe(SIDEBAR_WIDTHS.expanded);
    });

    it("should return expanded width when expanded", () => {
      expect(getSidebarWidth("expanded", false)).toBe(SIDEBAR_WIDTHS.expanded);
      expect(getSidebarWidth("expanded", true)).toBe(SIDEBAR_WIDTHS.expanded);
    });
  });

  describe("shouldShowLabels()", () => {
    it("should return true when expanded", () => {
      expect(shouldShowLabels("expanded", false)).toBe(true);
      expect(shouldShowLabels("expanded", true)).toBe(true);
    });

    it("should return false when collapsed and not hovering", () => {
      expect(shouldShowLabels("collapsed", false)).toBe(false);
    });

    it("should return true when collapsed and hovering", () => {
      expect(shouldShowLabels("collapsed", true)).toBe(true);
    });

    it("should return false when hidden", () => {
      expect(shouldShowLabels("hidden", false)).toBe(false);
      expect(shouldShowLabels("hidden", true)).toBe(false);
    });
  });

  describe("getInitials()", () => {
    it("should return first and last name initials for full name", () => {
      expect(getInitials("John Doe")).toBe("JD");
      expect(getInitials("Maria Silva Santos")).toBe("MS");
    });

    it("should return first two characters for single name", () => {
      expect(getInitials("John")).toBe("JO");
      expect(getInitials("A")).toBe("A");
    });

    it("should use email when name is null or empty", () => {
      expect(getInitials(null, "john@example.com")).toBe("JO");
      expect(getInitials("", "test@example.com")).toBe("TE");
      expect(getInitials("   ", "user@example.com")).toBe("US");
    });

    it("should return ?? when both name and email are missing", () => {
      expect(getInitials(null)).toBe("??");
      expect(getInitials(undefined)).toBe("??");
      expect(getInitials("")).toBe("??");
      expect(getInitials(null, null)).toBe("??");
    });

    it("should convert to uppercase", () => {
      expect(getInitials("john doe")).toBe("JD");
      expect(getInitials("a", "b@example.com")).toBe("A");
    });
  });

  describe("getStoredSidebarState()", () => {
    const storageKey = "test-sidebar-state";

    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it("should return stored valid state", () => {
      localStorage.setItem(storageKey, "expanded");
      expect(getStoredSidebarState(storageKey)).toBe("expanded");
      localStorage.setItem(storageKey, "collapsed");
      expect(getStoredSidebarState(storageKey)).toBe("collapsed");
      localStorage.setItem(storageKey, "hidden");
      expect(getStoredSidebarState(storageKey)).toBe("hidden");
    });

    it("should return default state for invalid stored value", () => {
      localStorage.setItem(storageKey, "invalid");
      expect(getStoredSidebarState(storageKey)).toBe("collapsed");
      expect(getStoredSidebarState(storageKey, "expanded")).toBe("expanded");
    });

    it("should return default state when nothing is stored", () => {
      expect(getStoredSidebarState(storageKey)).toBe("collapsed");
      expect(getStoredSidebarState(storageKey, "hidden")).toBe("hidden");
    });

    it("should handle SSR (window undefined)", () => {
      const originalWindow = global.window;
      // Simulate SSR by setting window to undefined
      Object.defineProperty(global, 'window', { value: undefined, writable: true });
      expect(getStoredSidebarState(storageKey)).toBe("collapsed");
      expect(getStoredSidebarState(storageKey, "expanded")).toBe("expanded");
      Object.defineProperty(global, 'window', { value: originalWindow, writable: true });
    });
  });

  describe("saveSidebarState()", () => {
    const storageKey = "test-sidebar-state";

    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it("should save state to localStorage", () => {
      saveSidebarState(storageKey, "expanded");
      expect(localStorage.getItem(storageKey)).toBe("expanded");
      saveSidebarState(storageKey, "collapsed");
      expect(localStorage.getItem(storageKey)).toBe("collapsed");
      saveSidebarState(storageKey, "hidden");
      expect(localStorage.getItem(storageKey)).toBe("hidden");
    });

    it("should handle SSR (window undefined)", () => {
      const originalWindow = global.window;
      // Simulate SSR by setting window to undefined
      Object.defineProperty(global, 'window', { value: undefined, writable: true });
      expect(() => saveSidebarState(storageKey, "expanded")).not.toThrow();
      Object.defineProperty(global, 'window', { value: originalWindow, writable: true });
    });
  });
});
