/**
 * Tipos para Admin Health Dashboard
 * Módulo: src/types/admin-health.types.ts
 * 
 * Tipos para métricas de sistema, erros e webhooks.
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

// ============================================================================
// SYSTEM METRICS
// ============================================================================

/**
 * Métrica de sistema agregada
 */
export interface SystemMetric {
  metric_type: string;
  hour: string;
  event_count: number;
  error_count: number;
}

/**
 * Erro não resolvido do sistema
 */
export interface UnresolvedError {
  id: string;
  function_name: string;
  error_message: string | null;
  error_stack?: string | null;
  timestamp: string;
  order_id?: string | null;
  request_payload?: Record<string, unknown> | null;
  notes?: string | null;
}

// ============================================================================
// WEBHOOK STATS
// ============================================================================

/**
 * Estatísticas de webhook
 */
export interface WebhookStats {
  total: number;
  delivered: number;
  failed: number;
  pending: number;
  avgAttempts: number;
}

/**
 * Item de webhook para listagem
 */
export interface WebhookDeliveryItem {
  id: string;
  webhook_id: string;
  order_id: string;
  status: string;
  attempts: number;
  last_attempt_at: string | null;
  next_retry_at: string | null;
  response_status?: number | null;
  response_body?: string | null;
  created_at: string;
}

// ============================================================================
// DLQ (Dead Letter Queue)
// ============================================================================

/**
 * Item da fila de mensagens mortas
 */
export interface DLQItem {
  id: string;
  gateway: string;
  event_type: string;
  error_code: string;
  error_message: string;
  payload: Record<string, unknown>;
  headers?: Record<string, unknown> | null;
  order_id?: string | null;
  status: string;
  attempts: number;
  last_attempt_at: string | null;
  created_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolution_notes?: string | null;
}

// ============================================================================
// EDGE FUNCTION ERRORS
// ============================================================================

/**
 * Erro de edge function
 */
export interface EdgeFunctionError {
  id: string;
  function_name: string;
  error_message: string | null;
  error_stack: string | null;
  timestamp: string;
  order_id: string | null;
  user_id: string | null;
  request_payload: Record<string, unknown> | null;
  request_headers: Record<string, unknown> | null;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  notes: string | null;
}
