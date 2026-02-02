/**
 * Shared Test Infrastructure for retry-webhooks
 * 
 * @module retry-webhooks/tests/_shared
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 * RISE Protocol V3 Compliant
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "retry-webhooks";
export const MAX_RETRIES = 3;
export const QUERY_LIMIT = 50;

// ============================================================================
// TYPES
// ============================================================================

export interface WebhookDelivery {
  id: string;
  success: boolean;
  retry_count: number;
  created_at: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function shouldRetry(delivery: WebhookDelivery): boolean {
  return !delivery.success && delivery.retry_count < MAX_RETRIES;
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export function createMockRequest(): Request {
  const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}`;
  return new Request(url, {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
  });
}

export function createWebhookDelivery(overrides: Partial<WebhookDelivery> = {}): WebhookDelivery {
  return {
    id: `delivery-${Date.now()}`,
    success: false,
    retry_count: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
