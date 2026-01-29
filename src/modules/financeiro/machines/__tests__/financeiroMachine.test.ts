/**
 * FinanceiroMachine Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Financeiro State Machine.
 * 
 * @module financeiro/machines/__tests__
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createActor } from "xstate";
import { financeiroMachine } from "../financeiroMachine";
import { initialFinanceiroContext } from "../financeiroMachine.types";

// ============================================================================
// STATE MACHINE TESTS
// ============================================================================

describe("financeiroMachine", () => {
  let actor: ReturnType<typeof createActor<typeof financeiroMachine>>;

  beforeEach(() => {
    actor = createActor(financeiroMachine);
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
      expect(context.selectedGateway).toBeNull();
      expect(context.loadError).toBeNull();
      expect(context.lastRefreshAt).toBeNull();
      expect(context.isBackgroundRefreshing).toBe(false);
    });

    it("has all gateway statuses initialized", () => {
      const { connectionStatuses } = actor.getSnapshot().context;
      expect(connectionStatuses.asaas).toBeDefined();
      expect(connectionStatuses.mercadopago).toBeDefined();
      expect(connectionStatuses.pushinpay).toBeDefined();
      expect(connectionStatuses.stripe).toBeDefined();
    });

    it("all gateways start disconnected", () => {
      const { connectionStatuses } = actor.getSnapshot().context;
      Object.values(connectionStatuses).forEach((status) => {
        expect(status.connected).toBe(false);
        expect(status.mode).toBeNull();
        expect(status.lastConnectedAt).toBeNull();
      });
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
      expect(financeiroMachine.id).toBe("financeiro");
    });

    it("has all expected states", () => {
      const states = financeiroMachine.config.states;
      expect(states?.idle).toBeDefined();
      expect(states?.loading).toBeDefined();
      expect(states?.ready).toBeDefined();
      expect(states?.backgroundRefreshing).toBeDefined();
      expect(states?.error).toBeDefined();
    });
  });

  describe("ready state events", () => {
    it("documents expected ready state events", () => {
      const readyState = financeiroMachine.config.states?.ready;
      const events = readyState?.on;
      
      expect(events?.SELECT_GATEWAY).toBeDefined();
      expect(events?.DESELECT_GATEWAY).toBeDefined();
      expect(events?.GATEWAY_CONNECTED).toBeDefined();
      expect(events?.GATEWAY_DISCONNECTED).toBeDefined();
      expect(events?.REFRESH).toBeDefined();
      expect(events?.BACKGROUND_REFRESH).toBeDefined();
    });
  });

  describe("error state events", () => {
    it("allows RETRY from error state", () => {
      const errorState = financeiroMachine.config.states?.error;
      expect(errorState?.on?.RETRY).toBeDefined();
    });
  });
});

// ============================================================================
// INITIAL CONTEXT TESTS
// ============================================================================

describe("initialFinanceiroContext", () => {
  it("has correct structure", () => {
    expect(initialFinanceiroContext).toHaveProperty("connectionStatuses");
    expect(initialFinanceiroContext).toHaveProperty("selectedGateway");
    expect(initialFinanceiroContext).toHaveProperty("loadError");
    expect(initialFinanceiroContext).toHaveProperty("lastRefreshAt");
    expect(initialFinanceiroContext).toHaveProperty("isBackgroundRefreshing");
  });

  it("has all four gateway statuses", () => {
    const gateways = Object.keys(initialFinanceiroContext.connectionStatuses);
    expect(gateways).toContain("asaas");
    expect(gateways).toContain("mercadopago");
    expect(gateways).toContain("pushinpay");
    expect(gateways).toContain("stripe");
  });

  it("each gateway has correct initial status shape", () => {
    const { connectionStatuses } = initialFinanceiroContext;
    
    Object.entries(connectionStatuses).forEach(([id, status]) => {
      expect(status.id).toBe(id);
      expect(status.connected).toBe(false);
      expect(status.mode).toBeNull();
      expect(status.lastConnectedAt).toBeNull();
    });
  });
});
