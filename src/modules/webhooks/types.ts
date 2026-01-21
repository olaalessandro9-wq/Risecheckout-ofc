/**
 * Webhooks Module Types
 * 
 * @module modules/webhooks
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Tipos de eventos suportados pelo sistema de webhooks
 */
export type WebhookEventType =
  | "pix_generated"
  | "purchase_approved"
  | "purchase_refused"
  | "refund"
  | "chargeback"
  | "checkout_abandoned";

/**
 * Webhook com dados do produto associado
 */
export interface Webhook {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly events: WebhookEventType[];
  readonly product_id: string | null;
  readonly created_at: string;
  readonly product?: {
    readonly name: string;
  } | null;
}

/**
 * Produto para seleção no formulário
 */
export interface WebhookProduct {
  readonly id: string;
  readonly name: string;
}

/**
 * Dados do formulário de webhook
 */
export interface WebhookFormData {
  readonly name: string;
  readonly url: string;
  readonly events: WebhookEventType[];
  readonly product_ids: string[];
}

// ============================================================================
// WEBHOOK LOGS
// ============================================================================

/**
 * Registro de entrega de webhook
 */
export interface WebhookDelivery {
  readonly id: string;
  readonly webhook_id: string;
  readonly order_id: string | null;
  readonly event_type: string;
  readonly status: "success" | "failed" | "pending";
  readonly response_status: number | null;
  readonly response_body: string | null;
  readonly payload: Record<string, unknown>;
  readonly attempts: number;
  readonly last_attempt_at: string | null;
  readonly created_at: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface WebhookListResponse {
  readonly success: boolean;
  readonly webhooks?: Webhook[];
  readonly products?: WebhookProduct[];
  readonly error?: string;
}

export interface WebhookProductsResponse {
  readonly success: boolean;
  readonly products?: WebhookProduct[];
  readonly error?: string;
}

export interface WebhookCrudResponse {
  readonly success: boolean;
  readonly webhook?: Webhook;
  readonly error?: string;
}

export interface WebhookLogsResponse {
  readonly success: boolean;
  readonly logs?: WebhookDelivery[];
  readonly error?: string;
}

export interface WebhookTestResponse {
  readonly success: boolean;
  readonly status_code?: number;
  readonly error?: string;
}
