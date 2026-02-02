/**
 * Shared Test Infrastructure for pushinpay-stats
 * 
 * @module pushinpay-stats/tests/_shared
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 * RISE Protocol V3 Compliant
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "pushinpay-stats";

export const VALID_ACTIONS = ["get-stats"] as const;

export type ValidAction = typeof VALID_ACTIONS[number];

// ============================================================================
// TYPES
// ============================================================================

export interface StatsPayload {
  action?: string;
}

export interface StatsResponse {
  success: boolean;
  stats?: {
    total_orders: number;
    total_revenue: number;
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidAction(action: string): action is ValidAction {
  return VALID_ACTIONS.includes(action as ValidAction);
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export function createMockRequest(body: StatsPayload): Request {
  const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}`;
  return new Request(url, {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
      "Cookie": "producer_session=valid-token",
    }),
    body: JSON.stringify(body),
  });
}
