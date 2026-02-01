/**
 * Shared Test Utilities for pixel-management
 * @module pixel-management/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

export const FUNCTION_URL = "https://test.supabase.co/functions/v1/pixel-management";
export const KNOWN_ACTIONS = ["list", "create", "update", "delete", "list-product-links", "link-to-product", "unlink-from-product", "update-product-link"] as const;

export interface MockProducer { id: string; email: string; }

export function createMockSupabaseClient() {
  return {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  };
}

export function createMockRequest(body: Record<string, unknown>): Request {
  return new Request(FUNCTION_URL, {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json", "Cookie": "producer_session=valid-token" }),
    body: JSON.stringify(body),
  });
}

export function createMockRequestWithoutCookie(body: Record<string, unknown>): Request {
  return new Request(FUNCTION_URL, {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
}

export function createOptionsRequest(): Request {
  return new Request(FUNCTION_URL, { method: "OPTIONS", headers: new Headers() });
}

export function createDefaultProducer(): MockProducer {
  return { id: "producer-123", email: "producer@example.com" };
}

export function isKnownAction(action: string): boolean {
  return KNOWN_ACTIONS.includes(action as typeof KNOWN_ACTIONS[number]);
}
