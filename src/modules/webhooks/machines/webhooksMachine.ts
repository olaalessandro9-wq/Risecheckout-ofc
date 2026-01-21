/**
 * Webhooks State Machine
 * 
 * @module modules/webhooks/machines
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * States: idle → loading → ready ↔ saving/deleting/loadingLogs
 *                           ↓
 *                         error → loading (RETRY)
 */

import { setup, assign } from "xstate";
import type {
  WebhooksMachineContext,
  WebhooksMachineEvent,
  LoadWebhooksOutput,
  LoadWebhookProductsOutput,
  SaveWebhookOutput,
  DeleteWebhookOutput,
  LoadLogsOutput,
} from "./webhooksMachine.types";
import { initialWebhooksContext } from "./webhooksMachine.types";
import {
  loadWebhooksActor,
  loadWebhookProductsActor,
  saveWebhookActor,
  deleteWebhookActor,
  loadLogsActor,
} from "./webhooksMachine.actors";

export const webhooksMachine = setup({
  types: {
    context: {} as WebhooksMachineContext,
    events: {} as WebhooksMachineEvent,
  },
  actors: {
    loadWebhooks: loadWebhooksActor,
    loadWebhookProducts: loadWebhookProductsActor,
    saveWebhook: saveWebhookActor,
    deleteWebhook: deleteWebhookActor,
    loadLogs: loadLogsActor,
  },
}).createMachine({
  id: "webhooks",
  initial: "idle",
  context: initialWebhooksContext,
  states: {
    idle: {
      on: {
        LOAD: "loading",
      },
    },

    loading: {
      invoke: {
        id: "loadWebhooks",
        src: "loadWebhooks",
        onDone: {
          target: "ready",
          actions: assign(({ event }) => {
            const output = event.output as LoadWebhooksOutput;
            return {
              webhooks: output.webhooks,
              products: output.products,
              error: null,
              lastRefreshAt: Date.now(),
            };
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => {
              const err = event.error as Error;
              return err.message || "Erro ao carregar webhooks";
            },
          }),
        },
      },
    },

    ready: {
      on: {
        REFRESH: "loading",
        
        OPEN_FORM: {
          target: "loadingWebhookProducts",
          actions: assign({
            editingWebhook: ({ event }) => event.webhook || null,
            isFormOpen: true,
            editingProductIds: ({ event }) => 
              event.webhook?.product_id ? [event.webhook.product_id] : [],
          }),
        },
        
        CLOSE_FORM: {
          actions: assign({
            editingWebhook: null,
            editingProductIds: [],
            isFormOpen: false,
          }),
        },
        
        SET_EDITING_PRODUCT_IDS: {
          actions: assign({
            editingProductIds: ({ event }) => event.ids,
          }),
        },
        
        SAVE_WEBHOOK: {
          target: "saving",
          actions: assign({
            savingData: ({ event }) => event.data,
          }),
        },
        
        REQUEST_DELETE: {
          actions: assign({
            deletingWebhook: ({ event }) => event.webhook,
          }),
        },
        
        CANCEL_DELETE: {
          actions: assign({
            deletingWebhook: null,
          }),
        },
        
        CONFIRM_DELETE: "deleting",
        
        OPEN_TEST: {
          actions: assign({
            testingWebhook: ({ event }) => event.webhook,
          }),
        },
        
        CLOSE_TEST: {
          actions: assign({
            testingWebhook: null,
          }),
        },
        
        OPEN_LOGS: "loadingLogs",
        
        CLOSE_LOGS: {
          actions: assign({
            logsWebhook: null,
            logs: [],
          }),
        },
        
        SET_PRODUCT_FILTER: {
          actions: assign({
            selectedProductFilter: ({ event }) => event.productId,
          }),
        },
        
        SET_SEARCH_TERM: {
          actions: assign({
            searchTerm: ({ event }) => event.term,
          }),
        },
      },
    },

    loadingWebhookProducts: {
      invoke: {
        id: "loadWebhookProducts",
        src: "loadWebhookProducts",
        input: ({ context }) => ({
          webhookId: context.editingWebhook?.id || "",
        }),
        onDone: {
          target: "ready",
          actions: assign(({ event, context }) => {
            const output = event.output as LoadWebhookProductsOutput;
            return {
              editingProductIds: output.productIds.length > 0 
                ? output.productIds 
                : context.editingWebhook?.product_id 
                  ? [context.editingWebhook.product_id] 
                  : [],
            };
          }),
        },
        onError: {
          target: "ready",
          actions: assign(({ context }) => ({
            editingProductIds: context.editingWebhook?.product_id 
              ? [context.editingWebhook.product_id] 
              : [],
          })),
        },
      },
      on: {
        CLOSE_FORM: {
          target: "ready",
          actions: assign({
            editingWebhook: null,
            editingProductIds: [],
            isFormOpen: false,
          }),
        },
      },
    },

    saving: {
      entry: assign({ isSaving: true }),
      exit: assign({ isSaving: false }),
      invoke: {
        id: "saveWebhook",
        src: "saveWebhook",
        input: ({ context }) => {
          // The data is stored in context when transitioning to saving state
          // This is a workaround since we need to access event data
          return {
            editingWebhookId: context.editingWebhook?.id || null,
            data: context.savingData || { name: "", url: "", events: [], product_ids: [] },
          };
        },
        onDone: {
          target: "loading",
          actions: assign({
            editingWebhook: null,
            editingProductIds: [],
            isFormOpen: false,
            savingData: null,
          }),
        },
        onError: {
          target: "ready",
          actions: assign({
            error: ({ event }) => {
              const err = event.error as Error;
              return err.message || "Erro ao salvar webhook";
            },
            savingData: null,
          }),
        },
      },
    },

    deleting: {
      invoke: {
        id: "deleteWebhook",
        src: "deleteWebhook",
        input: ({ context }) => ({
          webhookId: context.deletingWebhook?.id || "",
        }),
        onDone: {
          target: "loading",
          actions: assign({
            deletingWebhook: null,
          }),
        },
        onError: {
          target: "ready",
          actions: assign({
            error: ({ event }) => {
              const err = event.error as Error;
              return err.message || "Erro ao excluir webhook";
            },
            deletingWebhook: null,
          }),
        },
      },
    },

    loadingLogs: {
      entry: assign(({ event }) => ({
        logsWebhook: "webhook" in event ? event.webhook : null,
        isLoadingLogs: true,
        logs: [],
      })),
      exit: assign({ isLoadingLogs: false }),
      invoke: {
        id: "loadLogs",
        src: "loadLogs",
        input: ({ event }) => ({
          webhookId: "webhook" in event ? event.webhook.id : "",
        }),
        onDone: {
          target: "ready",
          actions: assign(({ event }) => {
            const output = event.output as LoadLogsOutput;
            return {
              logs: output.logs,
            };
          }),
        },
        onError: {
          target: "ready",
          actions: assign({
            error: ({ event }) => {
              const err = event.error as Error;
              return err.message || "Erro ao carregar logs";
            },
          }),
        },
      },
    },

    error: {
      on: {
        RETRY: "loading",
        LOAD: "loading",
      },
    },
  },
});

export type WebhooksMachine = typeof webhooksMachine;
