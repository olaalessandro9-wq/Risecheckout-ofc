/**
 * Shared Test Utilities for webhook-crud
 * 
 * @module webhook-crud/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================
// CONSTANTS
// ============================================

export const FUNCTION_URL = "https://test.supabase.co/functions/v1/webhook-crud";

export const KNOWN_ACTIONS = [
  "list",
  "list-with-products",
  "list-products",
  "list-user-products",
  "get-webhook-products",
  "get-logs",
  "create",
  "update",
  "delete",
] as const;

export type WebhookAction = typeof KNOWN_ACTIONS[number];

// ============================================
// TYPES
// ============================================

export interface MockProducer {
  id: string;
  email: string;
}

export interface WebhookData {
  url?: string;
  events?: string[];
  is_active?: boolean;
  name?: string;
}

// ============================================
// MOCK FACTORIES
// ============================================

export function createMockSupabaseClient() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  };
}

export function createMockRequest(body: Record<string, unknown>): Request {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cookie": "__Secure-rise_access=valid-token",
  });

  return new Request(FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export function createMockRequestWithoutCookie(body: Record<string, unknown>): Request {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  return new Request(FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export function createOptionsRequest(): Request {
  return new Request(FUNCTION_URL, {
    method: "OPTIONS",
    headers: new Headers(),
  });
}

export function createInvalidJsonRequest(): Request {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cookie": "__Secure-rise_access=valid-token",
  });

  return new Request(FUNCTION_URL, {
    method: "POST",
    headers,
    body: "invalid-json",
  });
}

// ============================================
// DEFAULT MOCK DATA
// ============================================

export function createDefaultProducer(): MockProducer {
  return {
    id: "producer-123",
    email: "producer@example.com",
  };
}

export function createWebhookData(overrides: Partial<WebhookData> = {}): WebhookData {
  return {
    url: "https://example.com/webhook",
    events: ["order.created"],
    ...overrides,
  };
}

// ============================================
// VALIDATION HELPERS
// ============================================

export function isKnownAction(action: string): action is WebhookAction {
  return KNOWN_ACTIONS.includes(action as WebhookAction);
}
