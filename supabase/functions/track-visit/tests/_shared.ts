/**
 * Shared Test Infrastructure for track-visit
 * 
 * @module track-visit/tests/_shared
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 * RISE Protocol V3 Compliant
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "track-visit";

export const IP_HEADERS = ["x-real-ip", "x-forwarded-for", "cf-connecting-ip"] as const;

// ============================================================================
// TYPES
// ============================================================================

export interface TrackVisitPayload {
  checkoutId?: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function hasCheckoutId(body: TrackVisitPayload): boolean {
  return "checkoutId" in body && body.checkoutId !== undefined;
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export function createMockRequest(body: TrackVisitPayload, headers?: Record<string, string>): Request {
  const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}`;
  return new Request(url, {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
      ...headers,
    }),
    body: JSON.stringify(body),
  });
}

export function createMockSupabaseClient(): Record<string, unknown> {
  return {
    from: () => ({
      insert: () => Promise.resolve({ error: null }),
    }),
    rpc: () => Promise.resolve({ error: null }),
  };
}

export function extractIpAddress(request: Request): string | null {
  for (const header of IP_HEADERS) {
    const value = request.headers.get(header);
    if (value) {
      return header === "x-forwarded-for" ? value.split(",")[0]?.trim() ?? null : value;
    }
  }
  return null;
}
