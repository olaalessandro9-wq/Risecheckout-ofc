/**
 * Shared Test Infrastructure for checkout-heartbeat
 * 
 * @module checkout-heartbeat/tests/_shared
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 * RISE Protocol V3 Compliant
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "checkout-heartbeat";

export const VALID_STEPS = ["active", "payment", "confirmation"] as const;

// ============================================================================
// TYPES
// ============================================================================

export interface HeartbeatPayload {
  sessionId?: string;
  checkoutId?: string;
  step?: string;
  metadata?: {
    vendorId?: string;
    productId?: string;
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function hasRequiredFields(body: HeartbeatPayload): boolean {
  return !!(body.sessionId && body.checkoutId);
}

export function isValidStep(step: string): boolean {
  return VALID_STEPS.includes(step as typeof VALID_STEPS[number]) || step.startsWith("custom-");
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export function createMockRequest(body: HeartbeatPayload): Request {
  const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}`;
  return new Request(url, {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
}

export function createMockSupabaseClient(): Record<string, unknown> {
  return {
    from: () => ({
      upsert: () => Promise.resolve({ error: null }),
    }),
  };
}
