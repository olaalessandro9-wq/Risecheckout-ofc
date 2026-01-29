/**
 * PixelsMachine Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Pixels State Machine.
 * 
 * @module pixels/machines/__tests__
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createActor } from "xstate";
import { pixelsMachine } from "../pixelsMachine";
import { initialPixelsContext } from "../types";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ============================================================================
// STATE MACHINE TESTS
// ============================================================================

describe("pixelsMachine", () => {
  let actor: ReturnType<typeof createActor<typeof pixelsMachine>>;

  beforeEach(() => {
    actor = createActor(pixelsMachine);
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
      expect(context.pixels).toEqual([]);
      expect(context.editingPixel).toBeNull();
      expect(context.deletingPixel).toBeNull();
      expect(context.isFormOpen).toBe(false);
      expect(context.isSaving).toBe(false);
      expect(context.error).toBeNull();
      expect(context.lastRefreshAt).toBeNull();
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
      expect(pixelsMachine.id).toBe("pixels");
    });

    it("has all expected states", () => {
      const states = pixelsMachine.config.states;
      expect(states?.idle).toBeDefined();
      expect(states?.loading).toBeDefined();
      expect(states?.ready).toBeDefined();
      expect(states?.saving).toBeDefined();
      expect(states?.deleting).toBeDefined();
      expect(states?.error).toBeDefined();
    });
  });

  describe("ready state events", () => {
    it("documents expected ready state events", () => {
      const readyState = pixelsMachine.config.states?.ready;
      const events = readyState?.on;
      
      expect(events?.REFRESH).toBeDefined();
      expect(events?.OPEN_FORM).toBeDefined();
      expect(events?.CLOSE_FORM).toBeDefined();
      expect(events?.SAVE_PIXEL).toBeDefined();
      expect(events?.REQUEST_DELETE).toBeDefined();
      expect(events?.CANCEL_DELETE).toBeDefined();
      expect(events?.CONFIRM_DELETE).toBeDefined();
    });
  });

  describe("error state events", () => {
    it("allows RETRY from error state", () => {
      const errorState = pixelsMachine.config.states?.error;
      expect(errorState?.on?.RETRY).toBeDefined();
    });
  });

  describe("saving state", () => {
    it("has entry and exit actions for isSaving", () => {
      const savingState = pixelsMachine.config.states?.saving;
      expect(savingState?.entry).toBeDefined();
      expect(savingState?.exit).toBeDefined();
    });
  });

  describe("deleting state", () => {
    it("has entry and exit actions for isSaving", () => {
      const deletingState = pixelsMachine.config.states?.deleting;
      expect(deletingState?.entry).toBeDefined();
      expect(deletingState?.exit).toBeDefined();
    });
  });
});

// ============================================================================
// INITIAL CONTEXT TESTS
// ============================================================================

describe("initialPixelsContext", () => {
  it("has correct structure", () => {
    expect(initialPixelsContext).toHaveProperty("pixels");
    expect(initialPixelsContext).toHaveProperty("editingPixel");
    expect(initialPixelsContext).toHaveProperty("deletingPixel");
    expect(initialPixelsContext).toHaveProperty("isFormOpen");
    expect(initialPixelsContext).toHaveProperty("isSaving");
    expect(initialPixelsContext).toHaveProperty("error");
    expect(initialPixelsContext).toHaveProperty("lastRefreshAt");
  });

  it("has empty array for pixels", () => {
    expect(initialPixelsContext.pixels).toEqual([]);
  });

  it("has null for nullable properties", () => {
    expect(initialPixelsContext.editingPixel).toBeNull();
    expect(initialPixelsContext.deletingPixel).toBeNull();
    expect(initialPixelsContext.error).toBeNull();
    expect(initialPixelsContext.lastRefreshAt).toBeNull();
  });

  it("has correct boolean defaults", () => {
    expect(initialPixelsContext.isFormOpen).toBe(false);
    expect(initialPixelsContext.isSaving).toBe(false);
  });
});
