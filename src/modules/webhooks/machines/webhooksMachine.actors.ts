/**
 * Webhooks Machine Actors
 * 
 * @module modules/webhooks/machines
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { fromPromise } from "xstate";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type {
  LoadWebhooksOutput,
  LoadWebhookProductsOutput,
  SaveWebhookOutput,
  DeleteWebhookOutput,
  LoadLogsOutput,
  SaveWebhookInput,
  DeleteWebhookInput,
  LoadWebhookProductsInput,
  LoadLogsInput,
} from "./webhooksMachine.types";
import type {
  WebhookListResponse,
  WebhookCrudResponse,
  WebhookLogsResponse,
} from "../types";

const log = createLogger("WebhooksMachine.Actors");

// ============================================================================
// LOAD WEBHOOKS ACTOR
// ============================================================================

export const loadWebhooksActor = fromPromise<LoadWebhooksOutput, void>(
  async () => {
    log.info("Loading webhooks and products...");
    
    const { data, error } = await api.call<WebhookListResponse>("webhook-crud", {
      action: "list",
    });

    if (error) {
      log.error("API error loading webhooks:", error);
      throw new Error(error.message || "Erro ao carregar webhooks");
    }

    if (!data?.success) {
      throw new Error(data?.error || "Erro ao carregar webhooks");
    }

    log.info(`Loaded ${data.webhooks?.length || 0} webhooks`);
    
    return {
      webhooks: data.webhooks || [],
      products: data.products || [],
    };
  }
);

// ============================================================================
// LOAD WEBHOOK PRODUCTS ACTOR
// ============================================================================

interface WebhookProductsApiResponse {
  success: boolean;
  productIds?: string[];
  error?: string;
}

export const loadWebhookProductsActor = fromPromise<LoadWebhookProductsOutput, LoadWebhookProductsInput>(
  async ({ input }) => {
    log.info(`Loading products for webhook ${input.webhookId}...`);
    
    const { data, error } = await api.call<WebhookProductsApiResponse>("webhook-crud", {
      action: "get-webhook-products",
      webhookId: input.webhookId,
    });

    if (error || !data?.success) {
      log.warn("Error loading webhook products:", error || data?.error);
      return { productIds: [] };
    }

    log.info(`Loaded ${data.productIds?.length || 0} product IDs`);
    
    return {
      productIds: data.productIds || [],
    };
  }
);

// ============================================================================
// SAVE WEBHOOK ACTOR
// ============================================================================

export const saveWebhookActor = fromPromise<SaveWebhookOutput, SaveWebhookInput>(
  async ({ input }) => {
    const { editingWebhookId, data } = input;
    const isUpdate = !!editingWebhookId;
    
    log.info(`${isUpdate ? "Updating" : "Creating"} webhook...`);

    const payload = isUpdate
      ? {
          action: "update",
          webhookId: editingWebhookId,
          data: {
            name: data.name,
            url: data.url,
            events: data.events,
            product_ids: data.product_ids,
          },
        }
      : {
          action: "create",
          data: {
            name: data.name,
            url: data.url,
            events: data.events,
            product_ids: data.product_ids,
          },
        };

    const { data: result, error } = await api.call<WebhookCrudResponse>(
      "webhook-crud",
      payload
    );

    if (error) {
      log.error("API error saving webhook:", error);
      return { success: false, error: error.message || "Erro ao salvar webhook" };
    }

    if (!result?.success) {
      return { success: false, error: result?.error || "Erro ao salvar webhook" };
    }

    log.info(`Webhook ${isUpdate ? "updated" : "created"} successfully`);
    return { success: true };
  }
);

// ============================================================================
// DELETE WEBHOOK ACTOR
// ============================================================================

export const deleteWebhookActor = fromPromise<DeleteWebhookOutput, DeleteWebhookInput>(
  async ({ input }) => {
    log.info(`Deleting webhook ${input.webhookId}...`);

    const { data, error } = await api.call<WebhookCrudResponse>("webhook-crud", {
      action: "delete",
      webhookId: input.webhookId,
    });

    if (error) {
      log.error("API error deleting webhook:", error);
      return { success: false, error: error.message || "Erro ao excluir webhook" };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || "Erro ao excluir webhook" };
    }

    log.info("Webhook deleted successfully");
    return { success: true };
  }
);

// ============================================================================
// LOAD LOGS ACTOR
// ============================================================================

export const loadLogsActor = fromPromise<LoadLogsOutput, LoadLogsInput>(
  async ({ input }) => {
    log.info(`Loading logs for webhook ${input.webhookId}...`);

    const { data, error } = await api.call<WebhookLogsResponse>("webhook-crud", {
      action: "get-logs",
      webhookId: input.webhookId,
    });

    if (error) {
      log.error("API error loading logs:", error);
      throw new Error(error.message || "Erro ao carregar logs");
    }

    if (!data?.success) {
      throw new Error(data?.error || "Erro ao carregar logs");
    }

    log.info(`Loaded ${data.logs?.length || 0} logs`);
    
    return {
      logs: data.logs || [],
    };
  }
);
