/**
 * Webhooks State Machine
 * 
 * @module modules/webhooks/machines
 * @version 1.1.0 - RISE Protocol V3 Compliant
 */

import { setup, assign } from "xstate";
import type {
  WebhooksMachineContext,
  WebhooksMachineEvent,
  LoadWebhooksOutput,
  LoadWebhookProductsOutput,
  LoadLogsOutput,
  SaveWebhookInput,
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
    idle: { on: { LOAD: "loading" } },

    loading: {
      invoke: {
        src: "loadWebhooks",
        onDone: {
          target: "ready",
          actions: assign(({ event }) => ({
            webhooks: (event.output as LoadWebhooksOutput).webhooks,
            products: (event.output as LoadWebhooksOutput).products,
            error: null,
            lastRefreshAt: Date.now(),
          })),
        },
        onError: {
          target: "error",
          actions: assign({ error: ({ event }) => (event.error as Error).message }),
        },
      },
    },

    ready: {
      on: {
        REFRESH: "loading",
        OPEN_FORM: {
          target: "loadingWebhookProducts",
          actions: assign(({ event }) => ({
            editingWebhook: event.webhook || null,
            isFormOpen: true,
            editingProductIds: event.webhook?.product_id ? [event.webhook.product_id] : [],
          })),
        },
        CLOSE_FORM: { actions: assign({ editingWebhook: null, editingProductIds: [], isFormOpen: false }) },
        SET_EDITING_PRODUCT_IDS: { actions: assign({ editingProductIds: ({ event }) => event.ids }) },
        SAVE_WEBHOOK: { target: "saving", actions: assign({ savingData: ({ event }) => event.data }) },
        REQUEST_DELETE: { actions: assign({ deletingWebhook: ({ event }) => event.webhook }) },
        CANCEL_DELETE: { actions: assign({ deletingWebhook: null }) },
        CONFIRM_DELETE: "deleting",
        OPEN_TEST: { actions: assign({ testingWebhook: ({ event }) => event.webhook }) },
        CLOSE_TEST: { actions: assign({ testingWebhook: null }) },
        OPEN_LOGS: {
          target: "loadingLogs",
          actions: assign(({ event }) => ({ logsWebhook: event.webhook, isLoadingLogs: true, logs: [] })),
        },
        CLOSE_LOGS: { actions: assign({ logsWebhook: null, logs: [] }) },
        SET_PRODUCT_FILTER: { actions: assign({ selectedProductFilter: ({ event }) => event.productId }) },
        SET_SEARCH_TERM: { actions: assign({ searchTerm: ({ event }) => event.term }) },
      },
    },

    loadingWebhookProducts: {
      invoke: {
        src: "loadWebhookProducts",
        input: ({ context }) => ({ webhookId: context.editingWebhook?.id || "" }),
        onDone: {
          target: "ready",
          actions: assign(({ event, context }) => {
            const ids = (event.output as LoadWebhookProductsOutput).productIds;
            return { editingProductIds: ids.length > 0 ? ids : context.editingWebhook?.product_id ? [context.editingWebhook.product_id] : [] };
          }),
        },
        onError: {
          target: "ready",
          actions: assign(({ context }) => ({
            editingProductIds: context.editingWebhook?.product_id ? [context.editingWebhook.product_id] : [],
          })),
        },
      },
      on: { CLOSE_FORM: { target: "ready", actions: assign({ editingWebhook: null, editingProductIds: [], isFormOpen: false }) } },
    },

    saving: {
      entry: assign({ isSaving: true }),
      exit: assign({ isSaving: false }),
      invoke: {
        src: "saveWebhook",
        input: ({ context }): SaveWebhookInput => {
          const data = context.savingData;
          if (!data) {
            throw new Error("savingData is required for saving state");
          }
          return {
            editingWebhookId: context.editingWebhook?.id || null,
            data,
          };
        },
        onDone: { target: "loading", actions: assign({ editingWebhook: null, editingProductIds: [], isFormOpen: false, savingData: null }) },
        onError: { target: "ready", actions: assign({ error: ({ event }) => (event.error as Error).message, savingData: null }) },
      },
    },

    deleting: {
      invoke: {
        src: "deleteWebhook",
        input: ({ context }) => ({ webhookId: context.deletingWebhook?.id || "" }),
        onDone: { target: "loading", actions: assign({ deletingWebhook: null }) },
        onError: { target: "ready", actions: assign({ error: ({ event }) => (event.error as Error).message, deletingWebhook: null }) },
      },
    },

    loadingLogs: {
      exit: assign({ isLoadingLogs: false }),
      invoke: {
        src: "loadLogs",
        input: ({ context }) => ({ webhookId: context.logsWebhook?.id || "" }),
        onDone: { target: "ready", actions: assign(({ event }) => ({ logs: (event.output as LoadLogsOutput).logs })) },
        onError: { target: "ready", actions: assign({ error: ({ event }) => (event.error as Error).message }) },
      },
    },

    error: { on: { RETRY: "loading", LOAD: "loading" } },
  },
});

export type WebhooksMachine = typeof webhooksMachine;
