/**
 * ============================================================================
 * ORDER LIFECYCLE WORKER - Types
 * ============================================================================
 * 
 * Tipos e interfaces compartilhados pelo worker de ciclo de vida.
 * 
 * RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 * ============================================================================
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface OrderLifecycleEvent {
  id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  metadata: OrderEventMetadata;
  processed: boolean;
  processed_at: string | null;
  processor_version: string | null;
  processing_error: string | null;
  retry_count: number;
  created_at: string;
}

export interface OrderEventMetadata {
  product_id?: string;
  customer_email?: string;
  vendor_id?: string;
  gateway?: string;
  amount_cents?: number;
  changed_at?: string;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export interface OrderData {
  id: string;
  customer_email: string | null;
  customer_name: string | null;
  product_id: string;
  product_name: string | null;
  amount_cents: number;
  offer_id: string | null;
  vendor_id: string;
  gateway: string | null;
  status: string;
}

// ============================================================================
// PROCESSING TYPES
// ============================================================================

export interface ProcessingResult {
  processed: number;
  skipped: number;
  errors: number;
  total: number;
}

export interface EventProcessingOutcome {
  success: boolean;
  error: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_VERSION = "1.1.0";
export const BATCH_SIZE = 50;
export const MAX_RETRIES = 3;

/** Status que disparam ações pós-pagamento */
export const PAYMENT_STATUSES = ['paid'] as const;

/** Status que disparam ações pós-reembolso/revogação */
export const REFUND_STATUSES = ['refunded', 'chargeback', 'partially_refunded'] as const;
