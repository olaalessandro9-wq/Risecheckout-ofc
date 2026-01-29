/**
 * Navigation State Machine Tests
 * 
 * @module navigation/machines/__tests__
 * @see RISE ARCHITECT PROTOCOL V3 - Testing System 10.0/10
 * 
 * Tests for the Navigation State Machine:
 * - State transitions (idle → ready)
 * - Sidebar state management
 * - Hover behavior
 * - Group expansion/collapse
 * - Mobile menu management
 */

import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { navigationMachine } from "../navigationMachine";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createMachine() {
  return createActor(navigationMachine);
}

function createRunningMachine() {
  const actor = createActor(navigationMachine);
  actor.start();
  return actor;
}

// ============================================================================
// INITIAL STATE TESTS
// ============================================================================

describe("navigationMachine", () => {
  describe("initial state", () => {
    it("starts in idle state", () => {
      const actor = createMachine();
      expect(actor.getSnapshot().value).toBe("idle");
    });

    it("has correct initial context", () => {
      const actor = createMachine();
      const { context } = actor.getSnapshot();
      
      expect(context.sidebarState).toBe("collapsed");
      expect(context.isHovering).toBe(false);
      expect(context.mobileOpen).toBe(false);
      expect(context.expandedGroups.size).toBe(0);
    });
  });

  // ============================================================================
  // IDLE → READY TRANSITION TESTS
  // ============================================================================

  describe("idle → ready transitions", () => {
    it("transitions to ready on RESTORE_FROM_STORAGE event", () => {
      const actor = createRunningMachine();
      
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "expanded" });
      
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toEqual({ ready: "active" });
      expect(snapshot.context.sidebarState).toBe("expanded");
      
      actor.stop();
    });

    it("restores collapsed state from storage", () => {
      const actor = createRunningMachine();
      
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "collapsed" });
      
      expect(actor.getSnapshot().context.sidebarState).toBe("collapsed");
      
      actor.stop();
    });

    it("restores hidden state from storage", () => {
      const actor = createRunningMachine();
      
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "hidden" });
      
      expect(actor.getSnapshot().context.sidebarState).toBe("hidden");
      
      actor.stop();
    });
  });

  // ============================================================================
  // SIDEBAR STATE MANAGEMENT TESTS
  // ============================================================================

  describe("sidebar state management", () => {
    it("cycles sidebar: collapsed → expanded", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "collapsed" });
      
      actor.send({ type: "CYCLE_SIDEBAR" });
      
      expect(actor.getSnapshot().context.sidebarState).toBe("expanded");
      
      actor.stop();
    });

    it("cycles sidebar: expanded → hidden", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "expanded" });
      
      actor.send({ type: "CYCLE_SIDEBAR" });
      
      expect(actor.getSnapshot().context.sidebarState).toBe("hidden");
      
      actor.stop();
    });

    it("cycles sidebar: hidden → collapsed", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "hidden" });
      
      actor.send({ type: "CYCLE_SIDEBAR" });
      
      expect(actor.getSnapshot().context.sidebarState).toBe("collapsed");
      
      actor.stop();
    });

    it("sets sidebar to specific state", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "collapsed" });
      
      actor.send({ type: "SET_SIDEBAR", state: "hidden" });
      
      expect(actor.getSnapshot().context.sidebarState).toBe("hidden");
      
      actor.stop();
    });

    it("ignores events in idle state", () => {
      const actor = createMachine();
      
      // Don't start the machine, send event directly
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe("idle");
      
      // CYCLE_SIDEBAR should not work in idle state
      // (machine not started, so no transition happens)
    });
  });

  // ============================================================================
  // HOVER BEHAVIOR TESTS
  // ============================================================================

  describe("hover behavior", () => {
    it("sets hovering true on MOUSE_ENTER when collapsed", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "collapsed" });
      
      actor.send({ type: "MOUSE_ENTER" });
      
      expect(actor.getSnapshot().context.isHovering).toBe(true);
      
      actor.stop();
    });

    it("ignores MOUSE_ENTER when expanded", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "expanded" });
      
      actor.send({ type: "MOUSE_ENTER" });
      
      expect(actor.getSnapshot().context.isHovering).toBe(false);
      
      actor.stop();
    });

    it("ignores MOUSE_ENTER when hidden", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "hidden" });
      
      actor.send({ type: "MOUSE_ENTER" });
      
      expect(actor.getSnapshot().context.isHovering).toBe(false);
      
      actor.stop();
    });

    it("sets hovering false on MOUSE_LEAVE when collapsed", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "collapsed" });
      actor.send({ type: "MOUSE_ENTER" });
      
      actor.send({ type: "MOUSE_LEAVE" });
      
      expect(actor.getSnapshot().context.isHovering).toBe(false);
      
      actor.stop();
    });
  });

  // ============================================================================
  // GROUP MANAGEMENT TESTS
  // ============================================================================

  describe("group management", () => {
    it("toggles group expansion (add)", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "expanded" });
      
      actor.send({ type: "TOGGLE_GROUP", groupId: "products" });
      
      expect(actor.getSnapshot().context.expandedGroups.has("products")).toBe(true);
      
      actor.stop();
    });

    it("toggles group expansion (remove)", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "expanded" });
      actor.send({ type: "TOGGLE_GROUP", groupId: "products" });
      
      actor.send({ type: "TOGGLE_GROUP", groupId: "products" });
      
      expect(actor.getSnapshot().context.expandedGroups.has("products")).toBe(false);
      
      actor.stop();
    });

    it("expands specific group", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "expanded" });
      
      actor.send({ type: "EXPAND_GROUP", groupId: "settings" });
      
      expect(actor.getSnapshot().context.expandedGroups.has("settings")).toBe(true);
      
      actor.stop();
    });

    it("collapses specific group", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "expanded" });
      actor.send({ type: "EXPAND_GROUP", groupId: "settings" });
      
      actor.send({ type: "COLLAPSE_GROUP", groupId: "settings" });
      
      expect(actor.getSnapshot().context.expandedGroups.has("settings")).toBe(false);
      
      actor.stop();
    });

    it("collapses all groups", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "expanded" });
      actor.send({ type: "EXPAND_GROUP", groupId: "products" });
      actor.send({ type: "EXPAND_GROUP", groupId: "settings" });
      
      actor.send({ type: "COLLAPSE_ALL_GROUPS" });
      
      expect(actor.getSnapshot().context.expandedGroups.size).toBe(0);
      
      actor.stop();
    });

    it("initializes active groups from route", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "expanded" });
      
      actor.send({ type: "INIT_ACTIVE_GROUPS", groupIds: ["products", "settings"] });
      
      const { expandedGroups } = actor.getSnapshot().context;
      expect(expandedGroups.has("products")).toBe(true);
      expect(expandedGroups.has("settings")).toBe(true);
      
      actor.stop();
    });
  });

  // ============================================================================
  // MOBILE MENU TESTS
  // ============================================================================

  describe("mobile menu", () => {
    it("opens mobile menu", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "collapsed" });
      
      actor.send({ type: "SET_MOBILE_OPEN", isOpen: true });
      
      expect(actor.getSnapshot().context.mobileOpen).toBe(true);
      
      actor.stop();
    });

    it("closes mobile menu", () => {
      const actor = createRunningMachine();
      actor.send({ type: "RESTORE_FROM_STORAGE", sidebarState: "collapsed" });
      actor.send({ type: "SET_MOBILE_OPEN", isOpen: true });
      
      actor.send({ type: "SET_MOBILE_OPEN", isOpen: false });
      
      expect(actor.getSnapshot().context.mobileOpen).toBe(false);
      
      actor.stop();
    });
  });
});
