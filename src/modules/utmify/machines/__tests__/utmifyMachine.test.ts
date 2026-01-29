/**
 * UTMify Machine Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the UTMify State Machine.
 * 
 * @module utmify/machines/__tests__
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createActor } from "xstate";
import { utmifyMachine } from "../utmifyMachine";

// ============================================================================
// STATE MACHINE TESTS
// ============================================================================

describe("utmifyMachine", () => {
  let actor: ReturnType<typeof createActor<typeof utmifyMachine>>;

  beforeEach(() => {
    actor = createActor(utmifyMachine);
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
      expect(context.config).toBeNull();
      expect(context.products).toEqual([]);
      expect(context.token).toBe("");
      expect(context.active).toBe(false);
      expect(context.selectedProducts).toEqual([]);
      expect(context.selectedEvents).toEqual([]);
      expect(context.error).toBeNull();
    });
  });

  describe("idle → loading transition", () => {
    it("transitions to loading on LOAD event", () => {
      actor.send({ type: "LOAD" });
      expect(actor.getSnapshot().matches("loading")).toBe(true);
    });
  });

  describe("machine configuration", () => {
    it("has correct machine id", () => {
      expect(utmifyMachine.id).toBe("utmify");
    });

    it("has all expected states", () => {
      const states = utmifyMachine.config.states;
      expect(states?.idle).toBeDefined();
      expect(states?.loading).toBeDefined();
      expect(states?.ready).toBeDefined();
      expect(states?.saving).toBeDefined();
      expect(states?.error).toBeDefined();
    });
  });

  describe("ready state events", () => {
    it("documents expected ready state events", () => {
      const readyState = utmifyMachine.config.states?.ready;
      const events = readyState?.on;
      
      expect(events?.UPDATE_TOKEN).toBeDefined();
      expect(events?.TOGGLE_ACTIVE).toBeDefined();
      expect(events?.TOGGLE_PRODUCT).toBeDefined();
      expect(events?.TOGGLE_EVENT).toBeDefined();
      expect(events?.SAVE).toBeDefined();
      expect(events?.RESET).toBeDefined();
    });
  });

  describe("error state events", () => {
    it("allows LOAD and RESET from error state", () => {
      const errorState = utmifyMachine.config.states?.error;
      expect(errorState?.on?.LOAD).toBeDefined();
      expect(errorState?.on?.RESET).toBeDefined();
    });
  });
});
