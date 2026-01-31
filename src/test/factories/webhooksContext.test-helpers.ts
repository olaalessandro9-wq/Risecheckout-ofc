/**
 * Webhooks Context Test Helpers
 * 
 * Type-safe factories for WebhooksList and WebhooksHeader component tests.
 * 
 * @module test/factories/webhooksContext.test-helpers
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// Types - Matching useWebhooks return type for component tests
// ============================================================================

export interface WebhooksListContextMock {
  filteredWebhooks: Array<{
    id: string;
    name: string;
    url: string;
    events: string[];
    active: boolean;
  }>;
  openForm: (webhook?: { id: string }) => void;
  requestDelete: (webhook: { id: string }) => void;
  openTest: (webhook: { id: string }) => void;
  openLogs: (webhook: { id: string }) => void;
}

export interface WebhooksHeaderContextMock {
  products: Array<{ id: string; name: string }>;
  searchTerm: string;
  selectedProductFilter: string;
  setSearchTerm: (term: string) => void;
  setProductFilter: (filter: string) => void;
  openForm: () => void;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a mock webhook for tests
 */
export function createMockWebhook(
  overrides?: Partial<WebhooksListContextMock["filteredWebhooks"][0]>
): WebhooksListContextMock["filteredWebhooks"][0] {
  return {
    id: "webhook-1",
    name: "My Webhook",
    url: "https://api.example.com/webhook",
    events: ["order.paid"],
    active: true,
    ...overrides,
  };
}

/**
 * Creates a mock context for WebhooksList tests
 */
export function createMockWebhooksListContext(
  overrides?: Partial<WebhooksListContextMock>
): WebhooksListContextMock {
  return {
    filteredWebhooks: [],
    openForm: vi.fn(),
    requestDelete: vi.fn(),
    openTest: vi.fn(),
    openLogs: vi.fn(),
    ...overrides,
  };
}

/**
 * Creates a mock context for WebhooksHeader tests
 */
export function createMockWebhooksHeaderContext(
  overrides?: Partial<WebhooksHeaderContextMock>
): WebhooksHeaderContextMock {
  return {
    products: [
      { id: "prod-1", name: "Product One" },
      { id: "prod-2", name: "Product Two" },
    ],
    searchTerm: "",
    selectedProductFilter: "all",
    setSearchTerm: vi.fn(),
    setProductFilter: vi.fn(),
    openForm: vi.fn(),
    ...overrides,
  };
}
