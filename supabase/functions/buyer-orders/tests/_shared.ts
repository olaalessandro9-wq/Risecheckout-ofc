/**
 * Shared Test Infrastructure for buyer-orders
 * 
 * @module buyer-orders/tests/_shared
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 * RISE Protocol V3 Compliant
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "buyer-orders";

// ============================================================================
// TYPES
// ============================================================================

export interface OrderPayload {
  action?: string;
  orderId?: string;
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export function createMockRequest(body: OrderPayload): Request {
  const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}`;
  return new Request(url, {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
      "Authorization": "Bearer mock-token",
    }),
    body: JSON.stringify(body),
  });
}
