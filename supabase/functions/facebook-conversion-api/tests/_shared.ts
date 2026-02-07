/**
 * Shared Test Utilities for facebook-conversion-api
 * 
 * @module facebook-conversion-api/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================
// CONSTANTS
// ============================================

export const FUNCTION_URL = "https://test.supabase.co/functions/v1/facebook-conversion-api";

export const FB_API_VERSION = "v21.0";
export const FACEBOOK_API_VERSION = FB_API_VERSION;
export const FB_API_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;
export const FACEBOOK_API_BASE_URL = "https://graph.facebook.com";

export const VALID_EVENT_NAMES = [
  "Purchase",
  "AddToCart",
  "InitiateCheckout",
  "ViewContent",
  "Lead",
  "CompleteRegistration",
  "AddPaymentInfo",
  "Search",
] as const;

export type FacebookEventName = typeof VALID_EVENT_NAMES[number];

// ============================================
// TYPES
// ============================================

export interface FacebookUserData {
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  ct?: string;
  st?: string;
  zp?: string;
  country?: string;
  external_id?: string;
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string;
  fbp?: string;
}

export interface FacebookCustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  num_items?: number;
}

export interface FacebookEvent {
  event_name: FacebookEventName;
  event_time: number;
  action_source: "website" | "email" | "app" | "phone_call" | "chat" | "physical_store" | "system_generated" | "other";
  event_source_url?: string;
  event_id?: string;
  user_data: FacebookUserData;
  custom_data?: FacebookCustomData;
}

// ============================================
// MOCK FACTORIES
// ============================================

export function createMockSupabaseClient() {
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
    }),
  };
}

export function createMockRequest(body: Record<string, unknown>): Request {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": "Bearer valid-access-token",
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
    "Authorization": "Bearer valid-access-token",
  });

  return new Request(FUNCTION_URL, {
    method: "POST",
    headers,
    body: "invalid-json",
  });
}

export function createValidPayload(overrides: Record<string, unknown> = {}) {
  return {
    pixelId: "pixel-123",
    accessToken: "token-123",
    eventName: "Purchase",
    ...overrides,
  };
}

// ============================================
// DEFAULT MOCK DATA
// ============================================

export function createDefaultEvent(): FacebookEvent {
  return {
    event_name: "ViewContent",
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    user_data: {
      client_ip_address: "192.168.1.1",
      client_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
  };
}

export function createPurchaseEvent(): FacebookEvent {
  return {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    user_data: {
      client_ip_address: "192.168.1.1",
      client_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
    custom_data: {
      value: 99.90,
      currency: "BRL",
      content_name: "Test Product",
      content_ids: ["product-123"],
      content_type: "product",
      num_items: 1,
    },
  };
}

export function createEventWithUserData(): FacebookEvent {
  return {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    user_data: {
      em: "a1b2c3d4e5f6...",
      ph: "9876543210...",
      fn: "john",
      ln: "doe",
      client_ip_address: "192.168.1.1",
      client_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      fbc: "fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890",
      fbp: "fb.1.1558571054389.1098115397",
    },
    custom_data: {
      value: 99.90,
      currency: "BRL",
    },
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function isValidEventName(name: string): name is FacebookEventName {
  return VALID_EVENT_NAMES.includes(name as FacebookEventName);
}
