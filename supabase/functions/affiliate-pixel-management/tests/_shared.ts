/**
 * Shared Test Utilities for affiliate-pixel-management
 * 
 * @module affiliate-pixel-management/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Provides type-safe mocks, factories, and constants for all test files.
 */

// ============================================
// CONSTANTS
// ============================================

export const MAX_PIXELS = 200;

export const FUNCTION_URL = "https://test.supabase.co/functions/v1/affiliate-pixel-management";

// ============================================
// TYPES
// ============================================

export interface MockProducer {
  id: string;
  email: string;
}

export interface PixelInput {
  pixel_id: string;
  platform: string;
  domain?: string | null;
  fire_on_pix?: boolean;
  fire_on_boleto?: boolean;
  fire_on_card?: boolean;
  custom_value_pix?: number;
  custom_value_boleto?: number;
  custom_value_card?: number;
  enabled?: boolean;
}

export interface SaveAllPayload {
  action: "save-all";
  affiliate_id: string;
  pixels: PixelInput[];
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
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      insert: () => Promise.resolve({ error: null }),
    }),
  };
}

export function createMockRequest(body: Record<string, unknown>): Request {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cookie": "producer_session=valid-token",
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

// ============================================
// DEFAULT MOCK DATA
// ============================================

export function createDefaultProducer(): MockProducer {
  return {
    id: "producer-123",
    email: "producer@example.com",
  };
}

export function createValidPixel(overrides: Partial<PixelInput> = {}): PixelInput {
  return {
    pixel_id: "pixel-123",
    platform: "facebook",
    ...overrides,
  };
}

export function createSaveAllPayload(
  affiliateId: string,
  pixels: PixelInput[] = []
): SaveAllPayload {
  return {
    action: "save-all",
    affiliate_id: affiliateId,
    pixels,
  };
}

// ============================================
// TEST HELPERS
// ============================================

export function createPixelsArray(count: number): PixelInput[] {
  return Array(count).fill(null).map((_, i) => ({
    pixel_id: `pixel-${i}`,
    platform: "facebook",
  }));
}

export async function extractPixels(request: Request): Promise<PixelInput[]> {
  const body = await request.json() as { pixels?: PixelInput[] };
  return body.pixels ?? [];
}
