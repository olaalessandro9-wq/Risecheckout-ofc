/**
 * ============================================================================
 * ORDER LIFECYCLE WORKER - Event Markers
 * ============================================================================
 * 
 * Funções utilitárias para marcar eventos como processados ou com erro.
 * 
 * RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { FUNCTION_VERSION } from "../types.ts";

/**
 * Marca um evento como processado com sucesso
 */
export async function markEventProcessed(
  supabase: SupabaseClient,
  eventId: string
): Promise<void> {
  await supabase
    .from('order_lifecycle_events')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      processor_version: FUNCTION_VERSION,
      processing_error: null,
    })
    .eq('id', eventId);
}

/**
 * Marca um evento com erro e incrementa retry_count
 */
export async function markEventError(
  supabase: SupabaseClient,
  eventId: string,
  currentRetryCount: number,
  errorMessage: string
): Promise<void> {
  await supabase
    .from('order_lifecycle_events')
    .update({
      processing_error: errorMessage,
      retry_count: currentRetryCount + 1,
      processor_version: FUNCTION_VERSION,
    })
    .eq('id', eventId);
}
