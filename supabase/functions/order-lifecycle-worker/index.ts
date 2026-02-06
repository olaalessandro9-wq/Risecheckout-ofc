/**
 * ============================================================================
 * ORDER LIFECYCLE WORKER - Router
 * ============================================================================
 * 
 * RISE ARCHITECT PROTOCOL V3 - Nota 10.0/10
 * 
 * Router puro que coordena o processamento de eventos de ciclo de vida.
 * Toda lógica de negócio está modularizada em handlers especializados.
 * 
 * Versão: 1.1.0
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { type RefundReason } from "../_shared/webhook-post-refund.ts";

import { 
  type OrderLifecycleEvent, 
  type OrderData, 
  type ProcessingResult,
  FUNCTION_VERSION,
  BATCH_SIZE,
  MAX_RETRIES,
  PAYMENT_STATUSES,
  REFUND_STATUSES,
} from "./types.ts";

import { markEventProcessed, markEventError } from "./utils/event-markers.ts";
import { handlePaymentApproved } from "./handlers/payment-handler.ts";
import { handleRefund } from "./handlers/refund-handler.ts";

const log = createLogger("OrderLifecycleWorker");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: PUBLIC_CORS_HEADERS });
  }

  const supabase = getSupabaseClient('webhooks');

  const result: ProcessingResult = { processed: 0, skipped: 0, errors: 0, total: 0 };

  try {
    log.info(`🚀 Worker iniciado - Versão ${FUNCTION_VERSION}`);

    // Buscar eventos não processados
    const { data: events, error: fetchError } = await supabase
      .from('order_lifecycle_events')
      .select('*')
      .eq('processed', false)
      .lt('retry_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) throw fetchError;

    if (!events || events.length === 0) {
      log.info('Nenhum evento pendente');
      return jsonResponse({ ...result, message: 'No pending events', version: FUNCTION_VERSION });
    }

    result.total = events.length;
    log.info(`Processando ${events.length} evento(s)`);

    // Processar cada evento
    // RISE V3: Type assertion required due to Supabase SDK generics mismatch
    // The processEvent function signature is compatible, but TS can't infer it
    for (const event of events as OrderLifecycleEvent[]) {
      await processEvent(supabase as Parameters<typeof processEvent>[0], event, result);
    }

    log.info('✅ Worker concluído', result);
    return jsonResponse({ ...result, version: FUNCTION_VERSION });

  } catch (fatalError) {
    const errMsg = fatalError instanceof Error ? fatalError.message : 'Fatal error';
    log.error('❌ Erro fatal', { error: errMsg });
    return jsonResponse({ error: errMsg, ...result, version: FUNCTION_VERSION }, 500);
  }
});

// ============================================================================
// EVENT PROCESSOR
// ============================================================================

async function processEvent(
  supabase: ReturnType<typeof createClient>,
  event: OrderLifecycleEvent,
  result: ProcessingResult
): Promise<void> {
  try {
    const transition = `${event.old_status || 'null'} → ${event.new_status}`;
    log.info(`Evento ${event.id}`, { orderId: event.order_id, transition });

    // Buscar dados do pedido
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, customer_email, customer_name, product_id, product_name, amount_cents, offer_id, vendor_id, gateway, status')
      .eq('id', event.order_id)
      .single();

    if (error || !order) {
      await markEventError(supabase, event.id, event.retry_count, 'Order not found');
      result.errors++;
      return;
    }

    const orderData = order as OrderData;
    let outcome = { success: true, error: null as string | null };

    // Determinar handler baseado na transição
    if (PAYMENT_STATUSES.includes(event.new_status as typeof PAYMENT_STATUSES[number]) && 
        !PAYMENT_STATUSES.includes((event.old_status || '') as typeof PAYMENT_STATUSES[number])) {
      outcome = await handlePaymentApproved(supabase, orderData, log);
    } 
    else if (REFUND_STATUSES.includes(event.new_status as typeof REFUND_STATUSES[number])) {
      outcome = await handleRefund(supabase, orderData, event.new_status as RefundReason, event.id, log);
    }

    // Marcar resultado
    if (outcome.success) {
      await markEventProcessed(supabase, event.id);
      result.processed++;
      log.info('✅ Evento processado', { eventId: event.id });
    } else {
      await markEventError(supabase, event.id, event.retry_count, outcome.error || 'Unknown');
      result.errors++;
    }

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown';
    log.error(`Exceção no evento ${event.id}`, { error: errMsg });
    await markEventError(supabase, event.id, event.retry_count, errMsg);
    result.errors++;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...PUBLIC_CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
