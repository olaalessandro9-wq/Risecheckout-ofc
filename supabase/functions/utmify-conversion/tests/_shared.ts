/**
 * Shared Test Utilities for utmify-conversion
 * @module utmify-conversion/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

export const FUNCTION_URL = "https://test.supabase.co/functions/v1/utmify-conversion";
export const UTMIFY_API_URL = "https://api.utmify.com.br/api/v1/conversion";

export interface MockOrder { id: string; amount_cents: number; customer_email: string | null; }
export interface MockUser { id: string; utmify_token: string | null; }

export function createMockSupabaseClient() {
  return { from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }) };
}

export function createMockRequest(body: Record<string, unknown>): Request {
  return new Request(FUNCTION_URL, {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
}

export function createOptionsRequest(): Request {
  return new Request(FUNCTION_URL, { method: "OPTIONS", headers: new Headers() });
}

export function createDefaultOrder(): MockOrder {
  return { id: "order-123", amount_cents: 10000, customer_email: "customer@example.com" };
}

export function createDefaultUser(): MockUser {
  return { id: "vendor-123", utmify_token: "token-123" };
}
