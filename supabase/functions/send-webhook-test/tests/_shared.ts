/**
 * Shared Test Infrastructure for send-webhook-test
 * 
 * @module send-webhook-test/tests/_shared
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 * RISE Protocol V3 Compliant
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "send-webhook-test";

// ============================================================================
// TYPES
// ============================================================================

export interface TestWebhookPayload {
  url?: string;
}

export interface TestWebhookResponse {
  success: boolean;
  status?: number;
  body?: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function hasValidUrl(body: TestWebhookPayload): boolean {
  return !!body.url && (body.url.startsWith("https://") || body.url.startsWith("http://"));
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export function createMockRequest(body: TestWebhookPayload): Request {
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

export function createTestPayload(): { event: string; timestamp: string; message: string } {
  return {
    event: "test",
    timestamp: new Date().toISOString(),
    message: "This is a test webhook",
  };
}
