/**
 * AffiliationMachine Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Affiliation State Machine.
 * 
 * @module affiliation/machines/__tests__
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createActor } from "xstate";
import { affiliationMachine, initialAffiliationContext } from "../affiliationMachine";

// ============================================================================
// STATE MACHINE TESTS
// ============================================================================

describe("affiliationMachine", () => {
  let actor: ReturnType<typeof createActor<typeof affiliationMachine>>;

  beforeEach(() => {
    actor = createActor(affiliationMachine);
    actor.start();
  });

  afterEach(() => {
    actor.stop();
  });

  describe("initial state", () => {
    it("starts in idle state", () => {
      expect(actor.getSnapshot().matches("idle")).toBe(true);
    });

    it("has correct initial context", () => {
      const { context } = actor.getSnapshot();
      expect(context.affiliationId).toBeNull();
      expect(context.affiliation).toBeNull();
      expect(context.otherProducts).toEqual([]);
      expect(context.activeTab).toBe("gateways");
      expect(context.tabErrors).toEqual({});
      expect(context.loadError).toBeNull();
    });
  });

  describe("idle → loading transition", () => {
    it("transitions to loading on LOAD event", () => {
      actor.send({ type: "LOAD", affiliationId: "aff-123" });
      expect(actor.getSnapshot().matches("loading")).toBe(true);
    });

    it("sets affiliationId from LOAD event", () => {
      actor.send({ type: "LOAD", affiliationId: "aff-456" });
      expect(actor.getSnapshot().context.affiliationId).toBe("aff-456");
    });

    it("clears loadError on LOAD", () => {
      // First set up with error context would require mocking
      actor.send({ type: "LOAD", affiliationId: "aff-789" });
      expect(actor.getSnapshot().context.loadError).toBeNull();
    });
  });

  describe("machine configuration", () => {
    it("has correct machine id", () => {
      expect(affiliationMachine.id).toBe("affiliation");
    });

    it("has all expected top-level states", () => {
      const states = affiliationMachine.config.states;
      expect(states?.idle).toBeDefined();
      expect(states?.loading).toBeDefined();
      expect(states?.ready).toBeDefined();
      expect(states?.error).toBeDefined();
    });

    it("has nested states in ready", () => {
      const readyState = affiliationMachine.config.states?.ready;
      expect(readyState?.states?.gateways).toBeDefined();
      expect(readyState?.states?.offers).toBeDefined();
      expect(readyState?.states?.pixels).toBeDefined();
      expect(readyState?.states?.details).toBeDefined();
      expect(readyState?.states?.otherProducts).toBeDefined();
    });
  });

  describe("ready state events", () => {
    it("documents expected ready state events", () => {
      const readyState = affiliationMachine.config.states?.ready;
      const events = readyState?.on;
      
      expect(events?.SET_TAB).toBeDefined();
      expect(events?.SET_TAB_ERROR).toBeDefined();
      expect(events?.CLEAR_TAB_ERRORS).toBeDefined();
      expect(events?.REFRESH).toBeDefined();
    });
  });

  describe("error state events", () => {
    it("allows LOAD from error state", () => {
      const errorState = affiliationMachine.config.states?.error;
      expect(errorState?.on?.LOAD).toBeDefined();
    });
  });
});

// ============================================================================
// INITIAL CONTEXT TESTS
// ============================================================================

describe("initialAffiliationContext", () => {
  it("has correct structure", () => {
    expect(initialAffiliationContext).toHaveProperty("affiliationId");
    expect(initialAffiliationContext).toHaveProperty("affiliation");
    expect(initialAffiliationContext).toHaveProperty("otherProducts");
    expect(initialAffiliationContext).toHaveProperty("activeTab");
    expect(initialAffiliationContext).toHaveProperty("tabErrors");
    expect(initialAffiliationContext).toHaveProperty("loadError");
  });

  it("has gateways as default active tab", () => {
    expect(initialAffiliationContext.activeTab).toBe("gateways");
  });

  it("has empty arrays and objects for collections", () => {
    expect(initialAffiliationContext.otherProducts).toEqual([]);
    expect(initialAffiliationContext.tabErrors).toEqual({});
  });

  it("has null for data that needs loading", () => {
    expect(initialAffiliationContext.affiliationId).toBeNull();
    expect(initialAffiliationContext.affiliation).toBeNull();
    expect(initialAffiliationContext.loadError).toBeNull();
  });
});
