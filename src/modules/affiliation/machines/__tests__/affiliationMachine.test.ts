/**
 * AffiliationMachine Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Affiliation State Machine.
 * 
 * NOTA TÉCNICA: XState v5 usa `TransitionConfigOrTarget` que pode ser
 * string ou objeto. Os testes usam verificação estrutural via JSON.stringify
 * para evitar erros de tipagem com acesso direto a `.target` ou `.actions`.
 * 
 * @module affiliation/machines/__tests__
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createActor } from "xstate";
import { affiliationMachine, initialAffiliationContext } from "../affiliationMachine";

// ============================================================================
// HELPER: Verificação estrutural de TransitionConfigOrTarget
// ============================================================================

/**
 * Verifica se uma configuração de transição contém determinado valor
 * XState v5 retorna TransitionConfigOrTarget<...> que pode ser string ou objeto
 */
function transitionConfigContains(config: unknown, searchValue: string): boolean {
  if (!config) return false;
  const configStr = JSON.stringify(config);
  return configStr.includes(searchValue);
}

/**
 * Verifica se uma configuração de transição está definida
 */
function isTransitionDefined(config: unknown): boolean {
  return config !== undefined && config !== null;
}

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

// ============================================================================
// EVENT HANDLING TESTS (XState v5 Compliant)
// ============================================================================

describe("affiliationMachine - Event Handling", () => {
  describe("SET_TAB event", () => {
    it("is defined in ready state events", () => {
      const readyState = affiliationMachine.config.states?.ready;
      expect(readyState?.on?.SET_TAB).toBeDefined();
    });
  });

  describe("SET_TAB_ERROR event", () => {
    it("is defined in ready state events", () => {
      const readyState = affiliationMachine.config.states?.ready;
      expect(readyState?.on?.SET_TAB_ERROR).toBeDefined();
    });
  });

  describe("CLEAR_TAB_ERRORS event", () => {
    it("is defined in ready state events", () => {
      const readyState = affiliationMachine.config.states?.ready;
      expect(readyState?.on?.CLEAR_TAB_ERRORS).toBeDefined();
    });
  });

  describe("REFRESH event", () => {
    it("is defined in ready state events", () => {
      const readyState = affiliationMachine.config.states?.ready;
      expect(readyState?.on?.REFRESH).toBeDefined();
    });

    it("transitions to loading state", () => {
      const readyState = affiliationMachine.config.states?.ready;
      const refreshConfig = readyState?.on?.REFRESH;
      
      // XState v5: TransitionConfigOrTarget pode ser string ou objeto
      expect(isTransitionDefined(refreshConfig)).toBe(true);
      expect(transitionConfigContains(refreshConfig, "loading")).toBe(true);
    });
  });
});

// ============================================================================
// CONTEXT UPDATES TESTS (XState v5 Compliant)
// ============================================================================

describe("affiliationMachine - Context Updates", () => {
  it("SET_TAB has actions defined", () => {
    const readyState = affiliationMachine.config.states?.ready;
    const setTabConfig = readyState?.on?.SET_TAB;
    
    expect(isTransitionDefined(setTabConfig)).toBe(true);
    expect(transitionConfigContains(setTabConfig, "actions")).toBe(true);
  });

  it("SET_TAB_ERROR has actions defined", () => {
    const readyState = affiliationMachine.config.states?.ready;
    const setTabErrorConfig = readyState?.on?.SET_TAB_ERROR;
    
    expect(isTransitionDefined(setTabErrorConfig)).toBe(true);
    expect(transitionConfigContains(setTabErrorConfig, "actions")).toBe(true);
  });

  it("CLEAR_TAB_ERRORS has actions defined", () => {
    const readyState = affiliationMachine.config.states?.ready;
    const clearConfig = readyState?.on?.CLEAR_TAB_ERRORS;
    
    expect(isTransitionDefined(clearConfig)).toBe(true);
    expect(transitionConfigContains(clearConfig, "actions")).toBe(true);
  });

  it("LOAD from idle has actions defined", () => {
    const idleState = affiliationMachine.config.states?.idle;
    const loadConfig = idleState?.on?.LOAD;
    
    expect(isTransitionDefined(loadConfig)).toBe(true);
    expect(transitionConfigContains(loadConfig, "actions")).toBe(true);
  });

  it("REFRESH has actions defined", () => {
    const readyState = affiliationMachine.config.states?.ready;
    const refreshConfig = readyState?.on?.REFRESH;
    
    expect(isTransitionDefined(refreshConfig)).toBe(true);
    expect(transitionConfigContains(refreshConfig, "actions")).toBe(true);
  });
});

// ============================================================================
// NESTED STATE CONFIGURATION TESTS
// ============================================================================

describe("affiliationMachine - Nested State Configuration", () => {
  it("gateways state has entry action", () => {
    const readyState = affiliationMachine.config.states?.ready;
    const gatewaysState = readyState?.states?.gateways;
    expect(gatewaysState?.entry).toBeDefined();
  });

  it("offers state has entry action", () => {
    const readyState = affiliationMachine.config.states?.ready;
    const offersState = readyState?.states?.offers;
    expect(offersState?.entry).toBeDefined();
  });

  it("pixels state has entry action", () => {
    const readyState = affiliationMachine.config.states?.ready;
    const pixelsState = readyState?.states?.pixels;
    expect(pixelsState?.entry).toBeDefined();
  });

  it("details state has entry action", () => {
    const readyState = affiliationMachine.config.states?.ready;
    const detailsState = readyState?.states?.details;
    expect(detailsState?.entry).toBeDefined();
  });

  it("otherProducts state has entry action", () => {
    const readyState = affiliationMachine.config.states?.ready;
    const otherProductsState = readyState?.states?.otherProducts;
    expect(otherProductsState?.entry).toBeDefined();
  });
});
