/**
 * Shared Test Infrastructure for process-webhook-queue
 * 
 * @module process-webhook-queue/tests/_shared
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 * RISE Protocol V3 Compliant
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "process-webhook-queue";
export const MAX_ATTEMPTS = 5;

// ============================================================================
// TYPES
// ============================================================================

export interface DeliveryRecord {
  id: string;
  webhook_id?: string;
  event_type?: string;
  payload?: Record<string, unknown>;
  status?: string;
  attempts?: number;
}

export interface WebhookConfig {
  url: string;
  secret_encrypted: string;
  active: boolean;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function shouldSkipRecord(record: DeliveryRecord): boolean {
  return record.status === "success" || (record.attempts ?? 0) >= MAX_ATTEMPTS;
}

export function hasValidRecord(body: { record?: DeliveryRecord | null }): boolean {
  return body.record !== null && body.record !== undefined && "id" in body.record;
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export function createMockRequest(body: { record?: DeliveryRecord | null }, headers?: Record<string, string>): Request {
  const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}`;
  return new Request(url, {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
      "X-Internal-Secret": "test-secret",
      ...headers,
    }),
    body: JSON.stringify(body),
  });
}

export function createDeliveryRecord(overrides: Partial<DeliveryRecord> = {}): DeliveryRecord {
  return {
    id: "delivery-123",
    webhook_id: "webhook-456",
    event_type: "order.created",
    payload: {},
    status: "pending",
    attempts: 0,
    ...overrides,
  };
}

export function createWebhookConfig(overrides: Partial<WebhookConfig> = {}): WebhookConfig {
  return {
    url: "https://example.com/webhook",
    secret_encrypted: "encrypted-secret",
    active: true,
    ...overrides,
  };
}
