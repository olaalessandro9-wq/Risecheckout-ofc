/**
 * Webhook Idempotency Types - RISE V3 Modular
 * 
 * Tipos e interfaces para o sistema de idempotência de webhooks.
 */

export interface IdempotencyContext {
  gateway: string;
  eventId: string;
  eventType: string;
  orderId?: string;
  timestamp?: string;
}

export interface IdempotencyResult {
  isDuplicate: boolean;
  existingEventId?: string;
  processedAt?: string;
}

export interface IdempotencyConfig {
  tableName?: string;
  skipDuplicateCheck?: boolean;
  logDuplicates?: boolean;
}

export interface WebhookEvent {
  id: string;
  gateway: string;
  gateway_event_id: string;
  event_type: string;
  order_id: string | null;
  processed_at: string;
  payload_hash?: string;
}

export type ContextExtractor = (payload: unknown) => IdempotencyContext | null;
