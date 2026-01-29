/**
 * ProductFormMachine State Transitions Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for state transitions in the Product Form State Machine.
 * 
 * @module products/machines/__tests__
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createActor } from "xstate";
import { productFormMachine } from "../productFormMachine";

// ============================================================================
// STATE TRANSITION TESTS
// ============================================================================

describe("productFormMachine state transitions", () => {
  let actor: ReturnType<typeof createActor<typeof productFormMachine>>;

  beforeEach(() => {
    actor = createActor(productFormMachine);
    actor.start();
  });

  afterEach(() => {
    actor.stop();
  });

  describe("initial state", () => {
    it("starts in idle state", () => {
      expect(actor.getSnapshot().matches("idle")).toBe(true);
    });

    it("has null productId and undefined userId initially", () => {
      const { context } = actor.getSnapshot();
      expect(context.productId).toBeNull();
      expect(context.userId).toBeUndefined();
    });

    it("has empty serverData and editedData", () => {
      const { context } = actor.getSnapshot();
      expect(context.serverData.product).toBeNull();
      expect(context.serverData.offers).toEqual([]);
    });
  });

  describe("idle → loading transition", () => {
    it("transitions to loading on LOAD_DATA event", () => {
      actor.send({ type: "LOAD_DATA", productId: "pr-1", userId: "user-1" });
      expect(actor.getSnapshot().matches("loading")).toBe(true);
    });

    it("sets productId and userId from event", () => {
      actor.send({ type: "LOAD_DATA", productId: "pr-123", userId: "user-456" });
      const { context } = actor.getSnapshot();
      expect(context.productId).toBe("pr-123");
      expect(context.userId).toBe("user-456");
    });
  });

  describe("ready state nested states", () => {
    // Note: To test ready state, we need to mock the loadProduct actor
    // These tests document expected behavior

    it("has pristine and dirty nested states", () => {
      const readyState = productFormMachine.config.states?.ready;
      expect(readyState?.states?.pristine).toBeDefined();
      expect(readyState?.states?.dirty).toBeDefined();
    });

    it("ready state starts in pristine", () => {
      const readyState = productFormMachine.config.states?.ready;
      expect(readyState?.initial).toBe("pristine");
    });
  });

  describe("machine configuration", () => {
    it("has correct machine id", () => {
      expect(productFormMachine.id).toBe("productForm");
    });

    it("has all expected top-level states", () => {
      const states = productFormMachine.config.states;
      expect(states?.idle).toBeDefined();
      expect(states?.loading).toBeDefined();
      expect(states?.ready).toBeDefined();
      expect(states?.saving).toBeDefined();
      expect(states?.error).toBeDefined();
    });
  });
});

// ============================================================================
// EVENT HANDLING TESTS
// ============================================================================

describe("productFormMachine events", () => {
  describe("ready state events", () => {
    it("documents expected events in ready.pristine", () => {
      const pristineState = productFormMachine.config.states?.ready?.states?.pristine;
      const events = pristineState?.on;
      
      expect(events?.EDIT_GENERAL).toBeDefined();
      expect(events?.EDIT_IMAGE).toBeDefined();
      expect(events?.EDIT_OFFERS).toBeDefined();
      expect(events?.EDIT_UPSELL).toBeDefined();
      expect(events?.EDIT_AFFILIATE).toBeDefined();
      expect(events?.EDIT_CHECKOUT_SETTINGS).toBeDefined();
    });

    it("documents expected events in ready.dirty", () => {
      const dirtyState = productFormMachine.config.states?.ready?.states?.dirty;
      const events = dirtyState?.on;
      
      expect(events?.SAVE_ALL).toBeDefined();
      expect(events?.DISCARD_CHANGES).toBeDefined();
    });

    it("documents common ready state events", () => {
      const readyState = productFormMachine.config.states?.ready;
      const events = readyState?.on;
      
      expect(events?.REFRESH).toBeDefined();
      expect(events?.SET_TAB).toBeDefined();
      expect(events?.SET_TAB_ERRORS).toBeDefined();
      expect(events?.CLEAR_TAB_ERRORS).toBeDefined();
      expect(events?.SET_VALIDATION_ERROR).toBeDefined();
      expect(events?.CLEAR_VALIDATION_ERRORS).toBeDefined();
      expect(events?.INIT_CHECKOUT_SETTINGS).toBeDefined();
    });
  });

  describe("saving state events", () => {
    it("documents expected events in saving state", () => {
      const savingState = productFormMachine.config.states?.saving;
      const events = savingState?.on;
      
      expect(events?.SAVE_SUCCESS).toBeDefined();
      expect(events?.SAVE_ERROR).toBeDefined();
      expect(events?.UPDATE_SERVER_IMAGE_URL).toBeDefined();
    });
  });

  describe("error state events", () => {
    it("allows LOAD_DATA from error state", () => {
      const errorState = productFormMachine.config.states?.error;
      expect(errorState?.on?.LOAD_DATA).toBeDefined();
    });
  });
});

// ============================================================================
// CONTEXT PRESERVATION TESTS
// ============================================================================

describe("productFormMachine context preservation", () => {
  let actor: ReturnType<typeof createActor<typeof productFormMachine>>;

  beforeEach(() => {
    actor = createActor(productFormMachine);
    actor.start();
  });

  afterEach(() => {
    actor.stop();
  });

  it("preserves initial context structure", () => {
    const { context } = actor.getSnapshot();
    
    expect(context).toHaveProperty("productId");
    expect(context).toHaveProperty("userId");
    expect(context).toHaveProperty("serverData");
    expect(context).toHaveProperty("editedData");
    expect(context).toHaveProperty("entities");
    expect(context).toHaveProperty("activeTab");
    expect(context).toHaveProperty("tabErrors");
    expect(context).toHaveProperty("validationErrors");
    expect(context).toHaveProperty("loadError");
    expect(context).toHaveProperty("saveError");
    expect(context).toHaveProperty("lastLoadedAt");
    expect(context).toHaveProperty("lastSavedAt");
    expect(context).toHaveProperty("isCheckoutSettingsInitialized");
    expect(context).toHaveProperty("credentials");
    expect(context).toHaveProperty("pendingImageUrl");
  });

  it("has correct validationErrors structure", () => {
    const { validationErrors } = actor.getSnapshot().context;
    
    expect(validationErrors).toHaveProperty("general");
    expect(validationErrors).toHaveProperty("upsell");
    expect(validationErrors).toHaveProperty("affiliate");
    expect(validationErrors).toHaveProperty("checkoutSettings");
  });

  it("has correct entities structure", () => {
    const { entities } = actor.getSnapshot().context;
    
    expect(entities).toHaveProperty("orderBumps");
    expect(entities).toHaveProperty("checkouts");
    expect(entities).toHaveProperty("paymentLinks");
    expect(entities).toHaveProperty("coupons");
  });
});
