/**
 * Shared Test Utilities for facebook-conversion-api
 * @module facebook-conversion-api/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

export const FUNCTION_URL = "https://test.supabase.co/functions/v1/facebook-conversion-api";
export const FB_API_VERSION = "v18.0";
export const FB_API_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

export function createMockSupabaseClient() {
  return { from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }) };
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

export function createValidPayload(overrides: Record<string, unknown> = {}) {
  return { pixelId: "pixel-123", accessToken: "token-123", eventName: "Purchase", ...overrides };
}
