/**
 * UTMify State Machine
 * 
 * Manages UTMify integration configuration state.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - XState Standard
 */

import { setup, assign, fromPromise } from "xstate";
import { api } from "@/lib/api/client";
import { createLogger } from "@/lib/logger";
import type { 
  UTMifyMachineContext, 
  UTMifyMachineEvent 
} from "./utmifyMachine.types";
import type { 
  Product, 
  UTMifyConfig,
  ProductsListResponse,
  VendorIntegrationResponse,
  VaultSaveResponse,
} from "../types";

const log = createLogger("utmifyMachine");

// ============================================================================
// INITIAL CONTEXT
// ============================================================================

const initialContext: UTMifyMachineContext = {
  config: null,
  products: [],
  token: "",
  active: false,
  selectedProducts: [],
  selectedEvents: [],
  error: null,
};

// ============================================================================
// ACTORS
// ============================================================================

interface LoadResult {
  config: UTMifyConfig;
  products: Product[];
}

const loadActor = fromPromise<LoadResult, void>(async () => {
  // Parallel fetch: products + config
  const [productsResult, configResult] = await Promise.all([
    api.call<ProductsListResponse>("products-crud", { action: "list" }),
    api.call<VendorIntegrationResponse>("admin-data", {
      action: "vendor-integration",
      integrationType: "UTMIFY",
    }),
  ]);

  if (productsResult.error) throw new Error(productsResult.error.message);
  if (configResult.error) throw new Error(configResult.error.message);

  const products = (productsResult.data?.products || [])
    .filter((p) => p.status !== "deleted");

  const integration = configResult.data?.integration;
  const config: UTMifyConfig = {
    active: integration?.active || false,
    hasToken: integration?.config?.has_token || false,
    selectedProducts: integration?.config?.selected_products || [],
    selectedEvents: integration?.config?.selected_events || [],
  };

  return { config, products };
});

interface SaveInput {
  vendorId: string;
  token: string;
  active: boolean;
  selectedProducts: string[];
  selectedEvents: string[];
  hasExistingToken: boolean;
}

const saveActor = fromPromise<void, SaveInput>(async ({ input }) => {
  const { vendorId, token, active, selectedProducts, selectedEvents, hasExistingToken } = input;

  if (!token.trim() && !hasExistingToken) {
    throw new Error("API Token é obrigatório");
  }

  const shouldActivate = !hasExistingToken && !active && token.trim();
  const activeStatus = shouldActivate ? true : active;

  const credentials: Record<string, unknown> = {
    selected_products: selectedProducts,
    selected_events: selectedEvents,
    has_token: true,
  };

  if (token.trim()) {
    credentials.api_token = token.trim();
  }

  const { data, error } = await api.call<VaultSaveResponse>("vault-save", {
    vendor_id: vendorId,
    integration_type: "UTMIFY",
    credentials,
    active: activeStatus,
  });

  if (error) throw new Error(error.message || "Erro ao salvar credenciais");
  if (!data?.success) throw new Error(data?.error || "Erro ao salvar credenciais");
});

// ============================================================================
// MACHINE
// ============================================================================

export const utmifyMachine = setup({
  types: {
    context: {} as UTMifyMachineContext,
    events: {} as UTMifyMachineEvent,
  },
  actors: {
    loadActor,
    saveActor,
  },
}).createMachine({
  id: "utmify",
  initial: "idle",
  context: initialContext,

  states: {
    idle: {
      on: {
        LOAD: { target: "loading" },
      },
    },

    loading: {
      invoke: {
        src: "loadActor",
        onDone: {
          target: "ready",
          actions: assign(({ event }) => ({
            config: event.output.config,
            products: event.output.products,
            active: event.output.config.active,
            selectedProducts: event.output.config.selectedProducts,
            selectedEvents: event.output.config.selectedEvents,
            token: "",
            error: null,
          })),
        },
        onError: {
          target: "error",
          actions: assign(({ event }) => {
            const error = event.error instanceof Error 
              ? event.error.message 
              : "Erro ao carregar configuração";
            log.error("Load error:", event.error);
            return { error };
          }),
        },
      },
    },

    ready: {
      on: {
        UPDATE_TOKEN: {
          actions: assign(({ event }) => ({ token: event.token })),
        },
        TOGGLE_ACTIVE: {
          actions: assign(({ context }) => ({ active: !context.active })),
        },
        TOGGLE_PRODUCT: {
          actions: assign(({ context, event }) => ({
            selectedProducts: context.selectedProducts.includes(event.productId)
              ? context.selectedProducts.filter((id) => id !== event.productId)
              : [...context.selectedProducts, event.productId],
          })),
        },
        TOGGLE_EVENT: {
          actions: assign(({ context, event }) => ({
            selectedEvents: context.selectedEvents.includes(event.eventId)
              ? context.selectedEvents.filter((id) => id !== event.eventId)
              : [...context.selectedEvents, event.eventId],
          })),
        },
        SAVE: { target: "saving" },
        RESET: { target: "idle" },
      },
    },

    saving: {
      invoke: {
        src: "saveActor",
        input: ({ context }) => ({
          vendorId: "", // Will be injected by context
          token: context.token,
          active: context.active,
          selectedProducts: context.selectedProducts,
          selectedEvents: context.selectedEvents,
          hasExistingToken: context.config?.hasToken || false,
        }),
        onDone: {
          target: "ready",
          actions: assign(({ context }) => ({
            config: {
              ...context.config!,
              hasToken: true,
              active: context.active,
              selectedProducts: context.selectedProducts,
              selectedEvents: context.selectedEvents,
            },
            token: "",
          })),
        },
        onError: {
          target: "ready",
          actions: assign(({ event }) => {
            const error = event.error instanceof Error 
              ? event.error.message 
              : "Erro ao salvar configuração";
            log.error("Save error:", event.error);
            return { error };
          }),
        },
      },
    },

    error: {
      on: {
        LOAD: { target: "loading" },
        RESET: { target: "idle" },
      },
    },
  },
});

export type UTMifyMachine = typeof utmifyMachine;
