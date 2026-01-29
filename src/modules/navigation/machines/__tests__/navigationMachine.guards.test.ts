/**
 * Navigation Machine Guards Tests
 * 
 * @module navigation/machines/__tests__
 * @see RISE ARCHITECT PROTOCOL V3 - Testing System 10.0/10
 * 
 * Tests for all guard functions used in the Navigation State Machine.
 */

import { describe, it, expect } from "vitest";
import {
  isCollapsed,
  hasExpandedGroups,
  isGroupExpanded,
  isHovering,
  isNotCollapsed,
} from "../navigationMachine.guards";
import type { NavigationMachineContext } from "../navigationMachine.types";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createContext(overrides: Partial<NavigationMachineContext> = {}): NavigationMachineContext {
  return {
    sidebarState: "collapsed",
    isHovering: false,
    mobileOpen: false,
    expandedGroups: new Set<string>(),
    ...overrides,
  };
}

// ============================================================================
// isCollapsed GUARD TESTS
// ============================================================================

describe("isCollapsed guard", () => {
  it("returns true when sidebarState is collapsed", () => {
    const context = createContext({ sidebarState: "collapsed" });
    expect(isCollapsed(context)).toBe(true);
  });

  it("returns false when sidebarState is expanded", () => {
    const context = createContext({ sidebarState: "expanded" });
    expect(isCollapsed(context)).toBe(false);
  });

  it("returns false when sidebarState is hidden", () => {
    const context = createContext({ sidebarState: "hidden" });
    expect(isCollapsed(context)).toBe(false);
  });
});

// ============================================================================
// isNotCollapsed GUARD TESTS
// ============================================================================

describe("isNotCollapsed guard", () => {
  it("returns false when sidebarState is collapsed", () => {
    const context = createContext({ sidebarState: "collapsed" });
    expect(isNotCollapsed(context)).toBe(false);
  });

  it("returns true when sidebarState is expanded", () => {
    const context = createContext({ sidebarState: "expanded" });
    expect(isNotCollapsed(context)).toBe(true);
  });

  it("returns true when sidebarState is hidden", () => {
    const context = createContext({ sidebarState: "hidden" });
    expect(isNotCollapsed(context)).toBe(true);
  });
});

// ============================================================================
// hasExpandedGroups GUARD TESTS
// ============================================================================

describe("hasExpandedGroups guard", () => {
  it("returns false when no groups are expanded", () => {
    const context = createContext({ expandedGroups: new Set() });
    expect(hasExpandedGroups(context)).toBe(false);
  });

  it("returns true when one group is expanded", () => {
    const context = createContext({ expandedGroups: new Set(["products"]) });
    expect(hasExpandedGroups(context)).toBe(true);
  });

  it("returns true when multiple groups are expanded", () => {
    const context = createContext({ 
      expandedGroups: new Set(["products", "settings", "admin"]) 
    });
    expect(hasExpandedGroups(context)).toBe(true);
  });
});

// ============================================================================
// isGroupExpanded GUARD TESTS
// ============================================================================

describe("isGroupExpanded guard", () => {
  it("returns true when specific group is expanded", () => {
    const context = createContext({ expandedGroups: new Set(["products"]) });
    const event = { type: "TOGGLE_GROUP" as const, groupId: "products" };
    
    expect(isGroupExpanded(context, event)).toBe(true);
  });

  it("returns false when specific group is not expanded", () => {
    const context = createContext({ expandedGroups: new Set(["settings"]) });
    const event = { type: "TOGGLE_GROUP" as const, groupId: "products" };
    
    expect(isGroupExpanded(context, event)).toBe(false);
  });

  it("returns false when no groups are expanded", () => {
    const context = createContext({ expandedGroups: new Set() });
    const event = { type: "EXPAND_GROUP" as const, groupId: "products" };
    
    expect(isGroupExpanded(context, event)).toBe(false);
  });

  it("works with COLLAPSE_GROUP event", () => {
    const context = createContext({ expandedGroups: new Set(["admin"]) });
    const event = { type: "COLLAPSE_GROUP" as const, groupId: "admin" };
    
    expect(isGroupExpanded(context, event)).toBe(true);
  });
});

// ============================================================================
// isHovering GUARD TESTS
// ============================================================================

describe("isHovering guard", () => {
  it("returns true when isHovering is true", () => {
    const context = createContext({ isHovering: true });
    expect(isHovering(context)).toBe(true);
  });

  it("returns false when isHovering is false", () => {
    const context = createContext({ isHovering: false });
    expect(isHovering(context)).toBe(false);
  });
});

// ============================================================================
// COMBINED GUARD SCENARIOS
// ============================================================================

describe("combined guard scenarios", () => {
  it("collapsed + hovering scenario", () => {
    const context = createContext({ 
      sidebarState: "collapsed", 
      isHovering: true 
    });
    
    expect(isCollapsed(context)).toBe(true);
    expect(isHovering(context)).toBe(true);
  });

  it("expanded + groups scenario", () => {
    const context = createContext({ 
      sidebarState: "expanded", 
      expandedGroups: new Set(["products", "settings"]) 
    });
    
    expect(isNotCollapsed(context)).toBe(true);
    expect(hasExpandedGroups(context)).toBe(true);
  });

  it("hidden + no groups scenario", () => {
    const context = createContext({ 
      sidebarState: "hidden", 
      expandedGroups: new Set() 
    });
    
    expect(isCollapsed(context)).toBe(false);
    expect(isNotCollapsed(context)).toBe(true);
    expect(hasExpandedGroups(context)).toBe(false);
  });
});
