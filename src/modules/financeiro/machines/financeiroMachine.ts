/**
 * Financeiro State Machine
 * 
 * @module modules/financeiro/machines
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * State Machine para o módulo Financeiro.
 * Gerencia carregamento de status, seleção de gateways e refresh.
 */

import { setup, assign } from "xstate";
import type { GatewayId } from "@/config/gateways/types";
import { loadGatewayStatusesActor } from "./financeiroMachine.actors";
import {
  initialFinanceiroContext,
  type FinanceiroMachineContext,
  type FinanceiroMachineEvent,
  type LoadGatewayStatusesOutput,
} from "./financeiroMachine.types";

// ============================================================================
// MACHINE DEFINITION
// ============================================================================

export const financeiroMachine = setup({
  types: {
    context: {} as FinanceiroMachineContext,
    events: {} as FinanceiroMachineEvent,
  },
  actors: {
    loadGatewayStatuses: loadGatewayStatusesActor,
  },
  actions: {
    assignStatuses: assign({
      connectionStatuses: (_, params: LoadGatewayStatusesOutput) => params.statuses,
      loadError: () => null,
      lastRefreshAt: () => Date.now(),
    }),
    assignLoadError: assign({
      loadError: (_, params: { message: string }) => params.message,
    }),
    assignSelectedGateway: assign({
      selectedGateway: (_, params: { gatewayId: GatewayId }) => params.gatewayId,
    }),
    clearSelectedGateway: assign({
      selectedGateway: () => null,
    }),
    updateGatewayConnected: assign({
      connectionStatuses: ({ context }, params: { gatewayId: GatewayId }) => ({
        ...context.connectionStatuses,
        [params.gatewayId]: {
          ...context.connectionStatuses[params.gatewayId],
          connected: true,
          lastConnectedAt: new Date().toISOString(),
        },
      }),
    }),
    updateGatewayDisconnected: assign({
      connectionStatuses: ({ context }, params: { gatewayId: GatewayId }) => ({
        ...context.connectionStatuses,
        [params.gatewayId]: {
          ...context.connectionStatuses[params.gatewayId],
          connected: false,
          mode: null,
        },
      }),
    }),
  },
}).createMachine({
  id: "financeiro",
  initial: "idle",
  context: initialFinanceiroContext,

  states: {
    idle: {
      on: {
        LOAD: { target: "loading" },
      },
    },

    loading: {
      invoke: {
        id: "loadGatewayStatuses",
        src: "loadGatewayStatuses",
        onDone: {
          target: "ready",
          actions: {
            type: "assignStatuses",
            params: ({ event }) => event.output,
          },
        },
        onError: {
          target: "error",
          actions: {
            type: "assignLoadError",
            params: ({ event }) => ({
              message: (event.error as Error)?.message ?? "Erro desconhecido",
            }),
          },
        },
      },
    },

    ready: {
      on: {
        SELECT_GATEWAY: {
          actions: {
            type: "assignSelectedGateway",
            params: ({ event }) => ({ gatewayId: event.gatewayId }),
          },
        },
        DESELECT_GATEWAY: {
          actions: "clearSelectedGateway",
        },
        GATEWAY_CONNECTED: {
          actions: {
            type: "updateGatewayConnected",
            params: ({ event }) => ({ gatewayId: event.gatewayId }),
          },
        },
        GATEWAY_DISCONNECTED: {
          actions: {
            type: "updateGatewayDisconnected",
            params: ({ event }) => ({ gatewayId: event.gatewayId }),
          },
        },
        REFRESH: { target: "loading" },
      },
    },

    error: {
      on: {
        RETRY: { target: "loading" },
      },
    },
  },
});

export type FinanceiroMachine = typeof financeiroMachine;
