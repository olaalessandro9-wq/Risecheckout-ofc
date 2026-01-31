/**
 * Webhooks Context Test Factories
 * 
 * Type-safe factory functions for mocking WebhooksContext and related types.
 * 
 * @module test/factories/webhooksContext
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import type {
  Webhook,
  WebhookProduct,
  WebhookDelivery,
  WebhookEventType,
  WebhookFormData,
} from "@/modules/webhooks/types";
import type { WebhooksMachineContext, WebhookMachineFormData } from "@/modules/webhooks/machines/webhooksMachine.types";

// ============================================================================
// WEBHOOK FACTORIES
// ============================================================================

export function createMockWebhook(
  overrides?: Partial<Webhook>
): Webhook {
  return {
    id: "webhook-123",
    name: "Test Webhook",
    url: "https://webhook.test.com/endpoint",
    events: ["purchase_approved"] as WebhookEventType[],
    product_id: "product-123",
    created_at: new Date().toISOString(),
    product: {
      name: "Test Product",
    },
    ...overrides,
  };
}

export function createMockWebhookProduct(
  overrides?: Partial<WebhookProduct>
): WebhookProduct {
  return {
    id: "product-123",
    name: "Test Product",
    ...overrides,
  };
}

export function createMockWebhookDelivery(
  overrides?: Partial<WebhookDelivery>
): WebhookDelivery {
  return {
    id: "delivery-123",
    webhook_id: "webhook-123",
    order_id: "order-123",
    event_type: "purchase_approved",
    status: "success",
    response_status: 200,
    response_body: '{"success": true}',
    payload: { orderId: "order-123" },
    attempts: 1,
    last_attempt_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockWebhookFormData(
  overrides?: Partial<WebhookFormData>
): WebhookFormData {
  return {
    name: "Test Webhook",
    url: "https://webhook.test.com/endpoint",
    events: ["purchase_approved"] as WebhookEventType[],
    product_ids: ["product-123"],
    ...overrides,
  };
}

export function createMockWebhookMachineFormData(
  overrides?: Partial<WebhookMachineFormData>
): WebhookMachineFormData {
  return {
    name: "Test Webhook",
    url: "https://webhook.test.com/endpoint",
    events: ["purchase_approved"] as WebhookEventType[],
    product_ids: ["product-123"],
    ...overrides,
  };
}

// ============================================================================
// WEBHOOKS MACHINE CONTEXT FACTORY
// ============================================================================

export function createMockWebhooksMachineContext(
  overrides?: Partial<WebhooksMachineContext>
): WebhooksMachineContext {
  return {
    webhooks: [],
    products: [],
    editingWebhook: null,
    editingProductIds: [],
    deletingWebhook: null,
    testingWebhook: null,
    logsWebhook: null,
    logs: [],
    isFormOpen: false,
    isSaving: false,
    isLoadingLogs: false,
    error: null,
    lastRefreshAt: null,
    savingData: null,
    selectedProductFilter: "all",
    searchTerm: "",
    ...overrides,
  };
}

// ============================================================================
// WEBHOOKS CONTEXT VALUE TYPE (inferred from WebhooksContext.tsx)
// ============================================================================

export interface WebhooksContextValue {
  // State
  readonly state: {
    readonly value: string;
    readonly context: WebhooksMachineContext;
  };
  
  // Send
  readonly send: (event: { type: string; [key: string]: unknown }) => void;
  
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
// WEBHOOKS CONTEXT VALUE FACTORY
// ============================================================================

export function createMockWebhooksContextValue(
  overrides?: Partial<WebhooksContextValue>
): WebhooksContextValue {
  const machineContext = createMockWebhooksMachineContext();
  
  return {
    // State
    state: {
      value: "ready",
      context: machineContext,
    },
    
    // Send
    send: vi.fn(),
    
    // Derived flags
    isLoading: false,
    isReady: true,
    isError: false,
    isSaving: false,
    isLoadingLogs: false,
    
    // Data
    webhooks: [],
    products: [],
    editingWebhook: null,
    editingProductIds: [],
    deletingWebhook: null,
    testingWebhook: null,
    logsWebhook: null,
    logs: [],
    isFormOpen: false,
    error: null,
    selectedProductFilter: "all",
    searchTerm: "",
    
    // Computed
    filteredWebhooks: [],
    
    // Actions
    openForm: vi.fn(),
    closeForm: vi.fn(),
    saveWebhook: vi.fn(),
    setEditingProductIds: vi.fn(),
    requestDelete: vi.fn(),
    cancelDelete: vi.fn(),
    confirmDelete: vi.fn(),
    openTest: vi.fn(),
    closeTest: vi.fn(),
    openLogs: vi.fn(),
    closeLogs: vi.fn(),
    setProductFilter: vi.fn(),
    setSearchTerm: vi.fn(),
    refresh: vi.fn(),
    
    ...overrides,
  };
}

// ============================================================================
// WEBHOOKS MACHINE SNAPSHOT FACTORY
// ============================================================================

export interface MockWebhooksSnapshot {
  context: WebhooksMachineContext;
  value: string | Record<string, unknown>;
  matches: (state: string) => boolean;
  can: (event: { type: string }) => boolean;
  status: "active" | "done" | "error" | "stopped";
}

export function createMockWebhooksSnapshot(
  context?: Partial<WebhooksMachineContext>,
  stateValue: string | Record<string, unknown> = "ready"
): MockWebhooksSnapshot {
  const fullContext = createMockWebhooksMachineContext(context);
  
  return {
    context: fullContext,
    value: stateValue,
    matches: vi.fn((state: string) => {
      if (typeof stateValue === "string") {
        return state === stateValue;
      }
      return Object.keys(stateValue).includes(state);
    }),
    can: vi.fn(() => true),
    status: "active",
  };
}
