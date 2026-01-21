/**
 * Webhooks Context
 * 
 * @module modules/webhooks/context
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useMachine } from "@xstate/react";
import { webhooksMachine } from "../machines/webhooksMachine";
import type { WebhooksMachineContext, WebhooksMachineEvent } from "../machines/webhooksMachine.types";
import type { Webhook, WebhookProduct, WebhookFormData, WebhookDelivery } from "../types";

// ============================================================================
// STATE TYPES
// ============================================================================

type WebhooksStateValue = 
  | "idle" 
  | "loading" 
  | "ready" 
  | "loadingWebhookProducts" 
  | "saving" 
  | "deleting" 
  | "loadingLogs" 
  | "error";

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface WebhooksContextValue {
  // State
  readonly state: {
    readonly value: string;
    readonly context: WebhooksMachineContext;
    readonly matches: (state: WebhooksStateValue) => boolean;
  };
  
  // Send
  readonly send: (event: WebhooksMachineEvent) => void;
  
  // Derived flags
  readonly isLoading: boolean;
  readonly isReady: boolean;
  readonly isError: boolean;
  readonly isSaving: boolean;
  readonly isLoadingLogs: boolean;
  
  // Data
  readonly webhooks: Webhook[];
  readonly products: WebhookProduct[];
  readonly editingWebhook: Webhook | null;
  readonly editingProductIds: string[];
  readonly deletingWebhook: Webhook | null;
  readonly testingWebhook: Webhook | null;
  readonly logsWebhook: Webhook | null;
  readonly logs: WebhookDelivery[];
  readonly isFormOpen: boolean;
  readonly error: string | null;
  readonly selectedProductFilter: string;
  readonly searchTerm: string;
  
  // Computed
  readonly filteredWebhooks: Webhook[];
  
  // Actions
  readonly openForm: (webhook?: Webhook) => void;
  readonly closeForm: () => void;
  readonly saveWebhook: (data: WebhookFormData) => void;
  readonly setEditingProductIds: (ids: string[]) => void;
  readonly requestDelete: (webhook: Webhook) => void;
  readonly cancelDelete: () => void;
  readonly confirmDelete: () => void;
  readonly openTest: (webhook: Webhook) => void;
  readonly closeTest: () => void;
  readonly openLogs: (webhook: Webhook) => void;
  readonly closeLogs: () => void;
  readonly setProductFilter: (productId: string) => void;
  readonly setSearchTerm: (term: string) => void;
  readonly refresh: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const WebhooksContext = createContext<WebhooksContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface WebhooksProviderProps {
  readonly children: ReactNode;
}

export function WebhooksProvider({ children }: WebhooksProviderProps) {
  const [state, send] = useMachine(webhooksMachine);

  // Auto-load on mount
  useEffect(() => {
    if (state.matches("idle")) {
      send({ type: "LOAD" });
    }
  }, [state, send]);

  // Derived flags
  const isLoading = state.matches("loading") || state.matches("loadingWebhookProducts");
  const isReady = state.matches("ready");
  const isError = state.matches("error");
  const isSaving = state.context.isSaving;
  const isLoadingLogs = state.context.isLoadingLogs;

  // Computed: filtered webhooks
  const filteredWebhooks = state.context.webhooks.filter((webhook) => {
    // Filter by product
    if (state.context.selectedProductFilter !== "all") {
      if (webhook.product_id !== state.context.selectedProductFilter) {
        return false;
      }
    }
    
    // Filter by search term
    if (state.context.searchTerm) {
      const term = state.context.searchTerm.toLowerCase();
      const nameMatch = webhook.name.toLowerCase().includes(term);
      const urlMatch = webhook.url.toLowerCase().includes(term);
      if (!nameMatch && !urlMatch) {
        return false;
      }
    }
    
    return true;
  });

  const value: WebhooksContextValue = {
    // State
    state: {
      value: String(state.value),
      context: state.context,
      matches: (s: WebhooksStateValue) => state.matches(s),
    },
    send,

    // Derived flags
    isLoading,
    isReady,
    isError,
    isSaving,
    isLoadingLogs,

    // Data from context
    webhooks: state.context.webhooks,
    products: state.context.products,
    editingWebhook: state.context.editingWebhook,
    editingProductIds: state.context.editingProductIds,
    deletingWebhook: state.context.deletingWebhook,
    testingWebhook: state.context.testingWebhook,
    logsWebhook: state.context.logsWebhook,
    logs: state.context.logs,
    isFormOpen: state.context.isFormOpen,
    error: state.context.error,
    selectedProductFilter: state.context.selectedProductFilter,
    searchTerm: state.context.searchTerm,

    // Computed
    filteredWebhooks,

    // Actions
    openForm: (webhook) => send({ type: "OPEN_FORM", webhook }),
    closeForm: () => send({ type: "CLOSE_FORM" }),
    saveWebhook: (data) => send({ type: "SAVE_WEBHOOK", data }),
    setEditingProductIds: (ids) => send({ type: "SET_EDITING_PRODUCT_IDS", ids }),
    requestDelete: (webhook) => send({ type: "REQUEST_DELETE", webhook }),
    cancelDelete: () => send({ type: "CANCEL_DELETE" }),
    confirmDelete: () => send({ type: "CONFIRM_DELETE" }),
    openTest: (webhook) => send({ type: "OPEN_TEST", webhook }),
    closeTest: () => send({ type: "CLOSE_TEST" }),
    openLogs: (webhook) => send({ type: "OPEN_LOGS", webhook }),
    closeLogs: () => send({ type: "CLOSE_LOGS" }),
    setProductFilter: (productId) => send({ type: "SET_PRODUCT_FILTER", productId }),
    setSearchTerm: (term) => send({ type: "SET_SEARCH_TERM", term }),
    refresh: () => send({ type: "REFRESH" }),
  };

  return (
    <WebhooksContext.Provider value={value}>
      {children}
    </WebhooksContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useWebhooks(): WebhooksContextValue {
  const context = useContext(WebhooksContext);
  
  if (!context) {
    throw new Error("useWebhooks must be used within a WebhooksProvider");
  }
  
  return context;
}
