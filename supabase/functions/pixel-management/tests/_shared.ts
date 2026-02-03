/**
 * Shared Test Utilities for pixel-management
 * 
 * @module pixel-management/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================
// CONSTANTS
// ============================================

export const FUNCTION_URL = "https://test.supabase.co/functions/v1/pixel-management";

export const MAX_PIXELS_PER_PRODUCT = 50;

export const VALID_PLATFORMS = [
  "facebook",
  "google",
  "tiktok",
  "taboola",
  "outbrain",
  "kwai",
] as const;

export type PixelPlatform = typeof VALID_PLATFORMS[number];

export const KNOWN_ACTIONS = [
  "list",
  "create",
  "update",
  "delete",
  "toggle",
  "list-product-links",
  "link-to-product",
  "unlink-from-product",
  "update-product-link",
] as const;

export type PixelAction = typeof KNOWN_ACTIONS[number];

// ============================================
// TYPES
// ============================================

export interface MockProducer {
  id: string;
  email: string;
}

export interface PixelData {
  pixel_id: string;
  platform: string;
  product_id?: string | null;
  domain?: string | null;
  enabled?: boolean;
  fire_on_pix?: boolean;
  fire_on_boleto?: boolean;
  fire_on_card?: boolean;
  custom_value_pix?: number | null;
  custom_value_boleto?: number | null;
  custom_value_card?: number | null;
  access_token?: string | null;
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

export function createValidPixel(overrides: Partial<PixelData> = {}): PixelData {
  return {
    pixel_id: "1234567890123456",
    platform: "facebook",
    product_id: "product-123",
    domain: null,
    enabled: true,
    fire_on_pix: true,
    fire_on_boleto: true,
    fire_on_card: true,
    custom_value_pix: null,
    custom_value_boleto: null,
    custom_value_card: null,
    access_token: null,
    ...overrides,
  };
}

// ============================================
// VALIDATION HELPERS
// ============================================

export function isKnownAction(action: string): action is PixelAction {
  return KNOWN_ACTIONS.includes(action as PixelAction);
}

export function isValidPlatform(platform: string): platform is PixelPlatform {
  return VALID_PLATFORMS.includes(platform as PixelPlatform);
}
