/**
 * WebhooksMachine Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Webhooks State Machine.
 * 
 * @module webhooks/machines/__tests__
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createActor } from "xstate";
import { webhooksMachine } from "../webhooksMachine";
import { initialWebhooksContext } from "../webhooksMachine.types";

// ============================================================================
// STATE MACHINE TESTS
// ============================================================================

describe("webhooksMachine", () => {
  let actor: ReturnType<typeof createActor<typeof webhooksMachine>>;

  beforeEach(() => {
    actor = createActor(webhooksMachine);
    actor.start();
  });

  afterEach(() => {
    actor.stop();
  });

  describe("initial state", () => {
    it("starts in idle state", () => {
      expect(actor.getSnapshot().matches("idle")).toBe(true);
    });

    it("has correct initial context structure", () => {
      const { context } = actor.getSnapshot();
      expect(context.webhooks).toEqual([]);
      expect(context.products).toEqual([]);
      expect(context.editingWebhook).toBeNull();
      expect(context.editingProductIds).toEqual([]);
      expect(context.deletingWebhook).toBeNull();
      expect(context.testingWebhook).toBeNull();
      expect(context.logsWebhook).toBeNull();
      expect(context.logs).toEqual([]);
      expect(context.error).toBeNull();
      expect(context.isSaving).toBe(false);
      expect(context.isFormOpen).toBe(false);
      expect(context.isLoadingLogs).toBe(false);
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
      expect(webhooksMachine.id).toBe("webhooks");
    });

    it("has all expected states", () => {
      const states = webhooksMachine.config.states;
      expect(states?.idle).toBeDefined();
      expect(states?.loading).toBeDefined();
      expect(states?.ready).toBeDefined();
      expect(states?.loadingWebhookProducts).toBeDefined();
      expect(states?.saving).toBeDefined();
      expect(states?.deleting).toBeDefined();
      expect(states?.loadingLogs).toBeDefined();
      expect(states?.error).toBeDefined();
    });
  });

  describe("ready state events", () => {
    it("documents expected ready state events", () => {
      const readyState = webhooksMachine.config.states?.ready;
      const events = readyState?.on;
      
      expect(events?.REFRESH).toBeDefined();
      expect(events?.OPEN_FORM).toBeDefined();
      expect(events?.CLOSE_FORM).toBeDefined();
      expect(events?.SET_EDITING_PRODUCT_IDS).toBeDefined();
      expect(events?.SAVE_WEBHOOK).toBeDefined();
      expect(events?.REQUEST_DELETE).toBeDefined();
      expect(events?.CANCEL_DELETE).toBeDefined();
      expect(events?.CONFIRM_DELETE).toBeDefined();
      expect(events?.OPEN_TEST).toBeDefined();
      expect(events?.CLOSE_TEST).toBeDefined();
      expect(events?.OPEN_LOGS).toBeDefined();
      expect(events?.CLOSE_LOGS).toBeDefined();
      expect(events?.SET_PRODUCT_FILTER).toBeDefined();
      expect(events?.SET_SEARCH_TERM).toBeDefined();
    });
  });

  describe("error state events", () => {
    it("allows RETRY and LOAD from error state", () => {
      const errorState = webhooksMachine.config.states?.error;
      expect(errorState?.on?.RETRY).toBeDefined();
      expect(errorState?.on?.LOAD).toBeDefined();
    });
  });
});

// ============================================================================
// INITIAL CONTEXT TESTS
// ============================================================================

describe("initialWebhooksContext", () => {
  it("has correct structure", () => {
    expect(initialWebhooksContext).toHaveProperty("webhooks");
    expect(initialWebhooksContext).toHaveProperty("products");
    expect(initialWebhooksContext).toHaveProperty("editingWebhook");
    expect(initialWebhooksContext).toHaveProperty("deletingWebhook");
    expect(initialWebhooksContext).toHaveProperty("testingWebhook");
    expect(initialWebhooksContext).toHaveProperty("logsWebhook");
    expect(initialWebhooksContext).toHaveProperty("logs");
    expect(initialWebhooksContext).toHaveProperty("error");
    expect(initialWebhooksContext).toHaveProperty("isSaving");
    expect(initialWebhooksContext).toHaveProperty("isFormOpen");
    expect(initialWebhooksContext).toHaveProperty("isLoadingLogs");
  });

  it("has empty arrays for collections", () => {
    expect(initialWebhooksContext.webhooks).toEqual([]);
    expect(initialWebhooksContext.products).toEqual([]);
    expect(initialWebhooksContext.editingProductIds).toEqual([]);
    expect(initialWebhooksContext.logs).toEqual([]);
  });

  it("has null for nullable properties", () => {
    expect(initialWebhooksContext.editingWebhook).toBeNull();
    expect(initialWebhooksContext.deletingWebhook).toBeNull();
    expect(initialWebhooksContext.testingWebhook).toBeNull();
    expect(initialWebhooksContext.logsWebhook).toBeNull();
    expect(initialWebhooksContext.error).toBeNull();
  });

  it("has correct boolean defaults", () => {
    expect(initialWebhooksContext.isSaving).toBe(false);
    expect(initialWebhooksContext.isFormOpen).toBe(false);
    expect(initialWebhooksContext.isLoadingLogs).toBe(false);
  });
});
