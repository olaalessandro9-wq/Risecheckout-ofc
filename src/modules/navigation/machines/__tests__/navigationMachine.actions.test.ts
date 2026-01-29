/**
 * Navigation Machine Actions Tests
 * 
 * @module navigation/machines/__tests__
 * @see RISE ARCHITECT PROTOCOL V3 - Testing System 10.0/10
 * 
 * Tests for action functions used in the Navigation State Machine.
 * Since XState actions are typed assign() calls, we test them via machine transitions.
 */

import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { navigationMachine } from "../navigationMachine";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createReadyMachine(initialState: "collapsed" | "expanded" | "hidden" = "collapsed") {
  const actor = createActor(navigationMachine);
  actor.start();
  actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: initialState });
  return actor;
}

// ============================================================================
// restoreFromStorage ACTION TESTS
// ============================================================================

describe("restoreFromStorage action", () => {
  it("sets sidebarState to collapsed", () => {
    const actor = createActor(navigationMachine);
    actor.start();
    
    actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "collapsed" });
    
    expect(actor.getSnapshot().context.sidebarState).toBe("collapsed");
    actor.stop();
  });

  it("sets sidebarState to expanded", () => {
    const actor = createActor(navigationMachine);
    actor.start();
    
    actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "expanded" });
    
    expect(actor.getSnapshot().context.sidebarState).toBe("expanded");
    actor.stop();
  });

  it("sets sidebarState to hidden", () => {
    const actor = createActor(navigationMachine);
    actor.start();
    
    actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "hidden" });
    
    expect(actor.getSnapshot().context.sidebarState).toBe("hidden");
    actor.stop();
  });
});

// ============================================================================
// cycleSidebar ACTION TESTS
// ============================================================================

describe("cycleSidebar action", () => {
  it("cycles from collapsed to expanded", () => {
    const actor = createReadyMachine("collapsed");
    
    actor.send({ type: "CYCLE_SIDEBAR" });
    
    expect(actor.getSnapshot().context.sidebarState).toBe("expanded");
    actor.stop();
  });

  it("cycles from expanded to hidden", () => {
    const actor = createReadyMachine("expanded");
    
    actor.send({ type: "CYCLE_SIDEBAR" });
    
    expect(actor.getSnapshot().context.sidebarState).toBe("hidden");
    actor.stop();
  });

  it("cycles from hidden to collapsed", () => {
    const actor = createReadyMachine("hidden");
    
    actor.send({ type: "CYCLE_SIDEBAR" });
    
    expect(actor.getSnapshot().context.sidebarState).toBe("collapsed");
    actor.stop();
  });

  it("completes full cycle", () => {
    const actor = createReadyMachine("collapsed");
    
    actor.send({ type: "CYCLE_SIDEBAR" }); // → expanded
    actor.send({ type: "CYCLE_SIDEBAR" }); // → hidden
    actor.send({ type: "CYCLE_SIDEBAR" }); // → collapsed
    
    expect(actor.getSnapshot().context.sidebarState).toBe("collapsed");
    actor.stop();
  });
});

// ============================================================================
// setSidebar ACTION TESTS
// ============================================================================

describe("setSidebar action", () => {
  it("sets to hidden", () => {
    const actor = createReadyMachine("collapsed");
    
    actor.send({ type: "SET_SIDEBAR", state: "hidden" });
    
    expect(actor.getSnapshot().context.sidebarState).toBe("hidden");
    actor.stop();
  });

  it("sets to expanded", () => {
    const actor = createReadyMachine("hidden");
    
    actor.send({ type: "SET_SIDEBAR", state: "expanded" });
    
    expect(actor.getSnapshot().context.sidebarState).toBe("expanded");
    actor.stop();
  });

  it("sets to collapsed", () => {
    const actor = createReadyMachine("expanded");
    
    actor.send({ type: "SET_SIDEBAR", state: "collapsed" });
    
    expect(actor.getSnapshot().context.sidebarState).toBe("collapsed");
    actor.stop();
  });
});

// ============================================================================
// HOVER ACTIONS TESTS
// ============================================================================

describe("hover actions", () => {
  it("setHoveringTrue sets isHovering to true", () => {
    const actor = createReadyMachine("collapsed");
    
    actor.send({ type: "MOUSE_ENTER" });
    
    expect(actor.getSnapshot().context.isHovering).toBe(true);
    actor.stop();
  });

  it("setHoveringFalse sets isHovering to false", () => {
    const actor = createReadyMachine("collapsed");
    actor.send({ type: "MOUSE_ENTER" });
    
    actor.send({ type: "MOUSE_LEAVE" });
    
    expect(actor.getSnapshot().context.isHovering).toBe(false);
    actor.stop();
  });
});

// ============================================================================
// setMobileOpen ACTION TESTS
// ============================================================================

describe("setMobileOpen action", () => {
  it("opens mobile menu", () => {
    const actor = createReadyMachine();
    
    actor.send({ type: "SET_MOBILE_OPEN", isOpen: true });
    
    expect(actor.getSnapshot().context.mobileOpen).toBe(true);
    actor.stop();
  });

  it("closes mobile menu", () => {
    const actor = createReadyMachine();
    actor.send({ type: "SET_MOBILE_OPEN", isOpen: true });
    
    actor.send({ type: "SET_MOBILE_OPEN", isOpen: false });
    
    expect(actor.getSnapshot().context.mobileOpen).toBe(false);
    actor.stop();
  });
});

// ============================================================================
// GROUP ACTIONS TESTS
// ============================================================================

describe("toggleGroup action", () => {
  it("adds group when not present", () => {
    const actor = createReadyMachine();
    
    actor.send({ type: "TOGGLE_GROUP", groupId: "products" });
    
    expect(actor.getSnapshot().context.expandedGroups.has("products")).toBe(true);
    actor.stop();
  });

  it("removes group when present", () => {
    const actor = createReadyMachine();
    actor.send({ type: "TOGGLE_GROUP", groupId: "products" });
    
    actor.send({ type: "TOGGLE_GROUP", groupId: "products" });
    
    expect(actor.getSnapshot().context.expandedGroups.has("products")).toBe(false);
    actor.stop();
  });
});

describe("expandGroup action", () => {
  it("adds group to expanded set", () => {
    const actor = createReadyMachine();
    
    actor.send({ type: "EXPAND_GROUP", groupId: "settings" });
    
    expect(actor.getSnapshot().context.expandedGroups.has("settings")).toBe(true);
    actor.stop();
  });

  it("is idempotent (adding same group twice)", () => {
    const actor = createReadyMachine();
    actor.send({ type: "EXPAND_GROUP", groupId: "settings" });
    
    actor.send({ type: "EXPAND_GROUP", groupId: "settings" });
    
    const groups = actor.getSnapshot().context.expandedGroups;
    expect(groups.has("settings")).toBe(true);
    expect(groups.size).toBe(1);
    actor.stop();
  });
});

describe("collapseGroup action", () => {
  it("removes group from expanded set", () => {
    const actor = createReadyMachine();
    actor.send({ type: "EXPAND_GROUP", groupId: "settings" });
    
    actor.send({ type: "COLLAPSE_GROUP", groupId: "settings" });
    
    expect(actor.getSnapshot().context.expandedGroups.has("settings")).toBe(false);
    actor.stop();
  });

  it("is idempotent (collapsing non-existent group)", () => {
    const actor = createReadyMachine();
    
    actor.send({ type: "COLLAPSE_GROUP", groupId: "nonexistent" });
    
    expect(actor.getSnapshot().context.expandedGroups.size).toBe(0);
    actor.stop();
  });
});

describe("collapseAllGroups action", () => {
  it("removes all groups", () => {
    const actor = createReadyMachine();
    actor.send({ type: "EXPAND_GROUP", groupId: "products" });
    actor.send({ type: "EXPAND_GROUP", groupId: "settings" });
    actor.send({ type: "EXPAND_GROUP", groupId: "admin" });
    
    actor.send({ type: "COLLAPSE_ALL_GROUPS" });
    
    expect(actor.getSnapshot().context.expandedGroups.size).toBe(0);
    actor.stop();
  });

  it("works when no groups are expanded", () => {
    const actor = createReadyMachine();
    
    actor.send({ type: "COLLAPSE_ALL_GROUPS" });
    
    expect(actor.getSnapshot().context.expandedGroups.size).toBe(0);
    actor.stop();
  });
});

describe("initActiveGroups action", () => {
  it("adds multiple groups at once", () => {
    const actor = createReadyMachine();
    
    actor.send({ type: "INIT_ACTIVE_GROUPS", groupIds: ["products", "settings"] });
    
    const groups = actor.getSnapshot().context.expandedGroups;
    expect(groups.has("products")).toBe(true);
    expect(groups.has("settings")).toBe(true);
    expect(groups.size).toBe(2);
    actor.stop();
  });

  it("preserves existing groups", () => {
    const actor = createReadyMachine();
    actor.send({ type: "EXPAND_GROUP", groupId: "admin" });
    
    actor.send({ type: "INIT_ACTIVE_GROUPS", groupIds: ["products"] });
    
    const groups = actor.getSnapshot().context.expandedGroups;
    expect(groups.has("admin")).toBe(true);
    expect(groups.has("products")).toBe(true);
    actor.stop();
  });

  it("works with empty array", () => {
    const actor = createReadyMachine();
    
    actor.send({ type: "INIT_ACTIVE_GROUPS", groupIds: [] });
    
    expect(actor.getSnapshot().context.expandedGroups.size).toBe(0);
    actor.stop();
  });
});
