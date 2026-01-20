/**
 * AffiliationMachine - State Machine Principal
 * 
 * Single Source of Truth para o estado do módulo de Afiliações.
 * Implementa o padrão Actor Model com XState v5.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module affiliation/machines
 */

import { setup, assign } from "xstate";
import type { 
  AffiliationMachineContext, 
  AffiliationMachineEvent,
  LoadAffiliationOutput,
} from "./affiliationMachine.types";
import { loadAffiliationActor } from "./affiliationMachine.actors";

// ============================================================================
// INITIAL CONTEXT
// ============================================================================

export const initialAffiliationContext: AffiliationMachineContext = {
  affiliationId: null,
  affiliation: null,
  otherProducts: [],
  activeTab: "gateways", // Tab padrão: Gateways (primeira visual)
  tabErrors: {},
  loadError: null,
};

// ============================================================================
// STATE MACHINE
// ============================================================================

export const affiliationMachine = setup({
  types: {
    context: {} as AffiliationMachineContext,
    events: {} as AffiliationMachineEvent,
  },
  actors: {
    loadAffiliation: loadAffiliationActor,
  },
}).createMachine({
  id: "affiliation",
  initial: "idle",
  context: initialAffiliationContext,

  states: {
    idle: {
      on: {
        LOAD: {
          target: "loading",
          actions: assign({
            affiliationId: ({ event }) => event.affiliationId,
            loadError: () => null,
          }),
        },
      },
    },

    loading: {
      invoke: {
        src: "loadAffiliation",
        input: ({ context }) => ({ affiliationId: context.affiliationId }),
        onDone: {
          target: "ready",
          actions: assign(({ event }) => {
            const data = event.output as LoadAffiliationOutput;
            return {
              affiliation: data.affiliation,
              otherProducts: data.otherProducts,
              loadError: null,
            };
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            loadError: ({ event }) => String(event.error),
          }),
        },
      },
    },

    ready: {
      initial: "gateways",
      on: {
        SET_TAB: {
          actions: assign({ activeTab: ({ event }) => event.tab }),
        },
        SET_TAB_ERROR: {
          actions: assign(({ context, event }) => ({
            tabErrors: { ...context.tabErrors, [event.tab]: event.hasError },
          })),
        },
        CLEAR_TAB_ERRORS: {
          actions: assign({ tabErrors: () => ({}) }),
        },
        REFRESH: {
          target: "loading",
          actions: assign({ loadError: () => null }),
        },
      },

      states: {
        gateways: {
          entry: assign({ activeTab: () => "gateways" as const }),
        },
        offers: {
          entry: assign({ activeTab: () => "offers" as const }),
        },
        pixels: {
          entry: assign({ activeTab: () => "pixels" as const }),
        },
        details: {
          entry: assign({ activeTab: () => "details" as const }),
        },
        otherProducts: {
          entry: assign({ activeTab: () => "other-products" as const }),
        },
      },
    },

    error: {
      on: {
        LOAD: {
          target: "loading",
          actions: assign({
            affiliationId: ({ event }) => event.affiliationId,
            loadError: () => null,
          }),
        },
      },
    },
  },
});

export type AffiliationMachine = typeof affiliationMachine;
