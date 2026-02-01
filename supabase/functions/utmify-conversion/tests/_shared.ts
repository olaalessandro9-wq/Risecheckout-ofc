/**
 * Shared Test Utilities for utmify-conversion
 * 
 * @module utmify-conversion/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================
// CONSTANTS
// ============================================

export const FUNCTION_URL = "https://test.supabase.co/functions/v1/utmify-conversion";

export const UTMIFY_API_URL = "https://api.utmify.com.br/api/v1/conversion";

export const VALID_EVENTS = [
  "purchase",
  "initiate_checkout",
  "add_to_cart",
  "view_content",
  "lead",
] as const;

export type UtmifyEventType = typeof VALID_EVENTS[number];

// ============================================
// TYPES
// ============================================

export interface MockOrder {
  id: string;
  product_id: string;
  product_name: string;
  total_amount: number;
  amount_cents: number;
  status: string;
  customer_email: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

export interface MockUser {
  id: string;
  utmify_token: string | null;
}

export interface ConversionPayload {
  order_id: string;
  event_type?: string;
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
    }),
  };
}

export function createMockRequest(body: Record<string, unknown>): Request {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": "Bearer valid-api-key",
  });

  return new Request(FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export function createMockRequestWithoutAuth(body: Record<string, unknown>): Request {
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
    "Authorization": "Bearer valid-api-key",
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

export function createDefaultOrder(): MockOrder {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    product_id: "product-123",
    product_name: "Test Product",
    total_amount: 99.90,
    amount_cents: 9990,
    status: "paid",
    customer_email: "customer@example.com",
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
  };
}

export function createOrderWithUtm(): MockOrder {
  return {
    id: "550e8400-e29b-41d4-a716-446655440001",
    product_id: "product-123",
    product_name: "Test Product with UTM",
    total_amount: 149.90,
    amount_cents: 14990,
    status: "paid",
    customer_email: "customer@example.com",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "summer_sale",
    utm_content: "banner_1",
    utm_term: "test keyword",
  };
}

export function createDefaultUser(): MockUser {
  return {
    id: "vendor-123",
    utmify_token: "token-123",
  };
}

// ============================================
// VALIDATION HELPERS
// ============================================

export function isValidEvent(event: string): event is UtmifyEventType {
  return VALID_EVENTS.includes(event as UtmifyEventType);
}
