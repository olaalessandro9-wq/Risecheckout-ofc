/**
 * Webhooks Machine Types
 * 
 * @module modules/webhooks/machines
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import type { Webhook, WebhookProduct, WebhookDelivery, WebhookEventType } from "../types";

// ============================================================================
// FORM DATA (local to machine)
// ============================================================================

export interface WebhookMachineFormData {
  readonly name: string;
  readonly url: string;
  readonly events: WebhookEventType[];
  readonly product_ids: string[];
}

// ============================================================================
// CONTEXT
// ============================================================================

export interface WebhooksMachineContext {
  /** Lista de webhooks do vendedor */
  readonly webhooks: Webhook[];
  
  /** Lista de produtos do vendedor */
  readonly products: WebhookProduct[];
  
  /** Webhook sendo editado (para o form) */
  readonly editingWebhook: Webhook | null;
  
  /** IDs dos produtos selecionados no form */
  readonly editingProductIds: string[];
  
  /** Webhook sendo deletado (para confirmação) */
  readonly deletingWebhook: Webhook | null;
  
  /** Webhook para testar */
  readonly testingWebhook: Webhook | null;
  
  /** Webhook para visualizar logs */
  readonly logsWebhook: Webhook | null;
  
  /** Logs do webhook sendo visualizado */
  readonly logs: WebhookDelivery[];
  
  /** Erro de carregamento/operação */
  readonly error: string | null;
  
  /** Timestamp do último refresh */
  readonly lastRefreshAt: number | null;
  
  /** Flag para indicar se o form está aberto */
  readonly isFormOpen: boolean;
  
  /** Flag para operação em andamento (create/update/delete) */
  readonly isSaving: boolean;
  
  /** Flag para loading de logs */
  readonly isLoadingLogs: boolean;
  
  /** Dados sendo salvos (temporário durante transição) */
  readonly savingData: WebhookMachineFormData | null;
  
  /** Filtro por produto */
  readonly selectedProductFilter: string;
  
  /** Termo de busca */
  readonly searchTerm: string;
}

// ============================================================================
// EVENTS
// ============================================================================

export type WebhooksMachineEvent =
  // Loading
  | { type: "LOAD" }
  | { type: "REFRESH" }
  | { type: "RETRY" }
  
  // Form
  | { type: "OPEN_FORM"; webhook?: Webhook }
  | { type: "CLOSE_FORM" }
  | { type: "SAVE_WEBHOOK"; data: WebhookMachineFormData }
  | { type: "SET_EDITING_PRODUCT_IDS"; ids: string[] }
  
  // Delete
  | { type: "REQUEST_DELETE"; webhook: Webhook }
  | { type: "CANCEL_DELETE" }
  | { type: "CONFIRM_DELETE" }
  
  // Test
  | { type: "OPEN_TEST"; webhook: Webhook }
  | { type: "CLOSE_TEST" }
  
  // Logs
  | { type: "OPEN_LOGS"; webhook: Webhook }
  | { type: "CLOSE_LOGS" }
  
  // Filters
  | { type: "SET_PRODUCT_FILTER"; productId: string }
  | { type: "SET_SEARCH_TERM"; term: string };

// ============================================================================
// ACTOR OUTPUTS
// ============================================================================

export interface LoadWebhooksOutput {
  readonly webhooks: Webhook[];
  readonly products: WebhookProduct[];
}

export interface LoadWebhookProductsOutput {
  readonly productIds: string[];
}

export interface SaveWebhookOutput {
  readonly success: boolean;
  readonly error?: string;
}

export interface DeleteWebhookOutput {
  readonly success: boolean;
  readonly error?: string;
}

export interface LoadLogsOutput {
  readonly logs: WebhookDelivery[];
}

// ============================================================================
// ACTOR INPUTS
// ============================================================================

export interface SaveWebhookInput {
  readonly editingWebhookId: string | null;
  readonly data: WebhookMachineFormData;
}

export interface DeleteWebhookInput {
  readonly webhookId: string;
}

export interface LoadWebhookProductsInput {
  readonly webhookId: string;
}

export interface LoadLogsInput {
  readonly webhookId: string;
}

// ============================================================================
// INITIAL CONTEXT
// ============================================================================

export const initialWebhooksContext: WebhooksMachineContext = {
  webhooks: [],
  products: [],
  editingWebhook: null,
  editingProductIds: [],
  deletingWebhook: null,
  testingWebhook: null,
  logsWebhook: null,
  logs: [],
  error: null,
  lastRefreshAt: null,
  isFormOpen: false,
  isSaving: false,
  isLoadingLogs: false,
  savingData: null,
  selectedProductFilter: "all",
  searchTerm: "",
};
