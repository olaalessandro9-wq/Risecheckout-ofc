/**
 * ============================================================================
 * ORDER LIFECYCLE WORKER
 * ============================================================================
 * 
 * RISE ARCHITECT PROTOCOL V3 - Nota 10.0/10
 * 
 * Worker assíncrono que processa eventos de ciclo de vida de pedidos.
 * Implementa o padrão Event-Driven Architecture para desacoplar a lógica
 * de negócios dos webhooks de gateway.
 * 
 * Responsabilidades:
 * - Processar eventos de mudança de status não processados
 * - Executar ações pós-pagamento (paid)
 * - Executar ações pós-reembolso (refunded, chargeback, partially_refunded)
 * - Marcar eventos como processados com auditoria completa
 * 
 * Execução:
 * - Via pg_cron (recomendado): a cada 30 segundos
 * - Via chamada manual para testes
 * 
 * Versão: 1.0.0
 * Data de Criação: 2026-01-23
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import { processPostPaymentActions } from "../_shared/webhook-post-payment.ts";
import { processPostRefundActions, getRefundEventType, type RefundReason } from "../_shared/webhook-post-refund.ts";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { type Logger } from "../_shared/webhook-helpers.ts";

// ============================================================================
// CONSTANTS
// ============================================================================

const FUNCTION_VERSION = "1.0.0";
const BATCH_SIZE = 50;
const MAX_RETRIES = 3;

const log = createLogger("OrderLifecycleWorker");

// Status que disparam ações pós-pagamento
const PAYMENT_STATUSES = ['paid'];

// Status que disparam ações pós-reembolso/revogação
const REFUND_STATUSES = ['refunded', 'chargeback', 'partially_refunded'];

// ============================================================================
// TYPES
// ============================================================================

interface OrderLifecycleEvent {
  id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  metadata: {
    product_id?: string;
    customer_email?: string;
    vendor_id?: string;
    gateway?: string;
    amount_cents?: number;
    changed_at?: string;
  };
  processed: boolean;
  processed_at: string | null;
  processor_version: string | null;
  processing_error: string | null;
  retry_count: number;
  created_at: string;
}

interface OrderData {
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

interface ProcessingResult {
  processed: number;
  skipped: number;
  errors: number;
  total: number;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: PUBLIC_CORS_HEADERS });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const result: ProcessingResult = {
    processed: 0,
    skipped: 0,
    errors: 0,
    total: 0,
  };

  try {
    log.info(`🚀 Worker iniciado - Versão ${FUNCTION_VERSION}`);

    // ========================================================================
    // 1. BUSCAR EVENTOS NÃO PROCESSADOS
    // ========================================================================

    const { data: events, error: fetchError } = await supabase
      .from('order_lifecycle_events')
      .select('*')
      .eq('processed', false)
      .lt('retry_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      log.error('Erro ao buscar eventos', { error: fetchError.message });
      throw fetchError;
    }

    if (!events || events.length === 0) {
      log.info('Nenhum evento pendente para processar');
      return new Response(JSON.stringify({ 
        ...result, 
        message: 'No pending events',
        version: FUNCTION_VERSION,
      }), {
        headers: { ...PUBLIC_CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    result.total = events.length;
    log.info(`Processando ${events.length} evento(s) pendente(s)`);

    // ========================================================================
    // 2. PROCESSAR CADA EVENTO
    // ========================================================================

    for (const event of events as OrderLifecycleEvent[]) {
      try {
        const transition = `${event.old_status || 'null'} → ${event.new_status}`;
        log.info(`Processando evento ${event.id}`, { 
          orderId: event.order_id, 
          transition,
          retryCount: event.retry_count,
        });

        // Buscar dados completos do pedido
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('id, customer_email, customer_name, product_id, product_name, amount_cents, offer_id, vendor_id, gateway, status')
          .eq('id', event.order_id)
          .single();

        if (orderError || !order) {
          log.error('Pedido não encontrado', { orderId: event.order_id, error: orderError?.message });
          await markEventError(supabase, event.id, event.retry_count, 'Order not found');
          result.errors++;
          continue;
        }

        const orderData = order as OrderData;

        // Determinar ação baseada na transição de status
        let processingSuccess = false;
        let processingError: string | null = null;

        // ====================================================================
        // AÇÃO: PAGAMENTO APROVADO
        // ====================================================================
        if (PAYMENT_STATUSES.includes(event.new_status) && 
            !PAYMENT_STATUSES.includes(event.old_status || '')) {
          
          log.info('Executando ações pós-pagamento', { orderId: order.id });

          try {
            await processPostPaymentActions(supabase, {
              orderId: orderData.id,
              customerEmail: orderData.customer_email,
              customerName: orderData.customer_name,
              productId: orderData.product_id,
              productName: orderData.product_name,
              amountCents: orderData.amount_cents,
              offerId: orderData.offer_id,
              paymentMethod: orderData.gateway || 'Unknown',
              vendorId: orderData.vendor_id,
            }, 'purchase_approved', log);

            processingSuccess = true;
          } catch (paymentError) {
            const errMsg = paymentError instanceof Error ? paymentError.message : 'Unknown error';
            processingError = `Post-payment actions failed: ${errMsg}`;
            log.error('Falha nas ações pós-pagamento', { error: errMsg });
          }
        }

        // ====================================================================
        // AÇÃO: REEMBOLSO / CHARGEBACK
        // ====================================================================
        else if (REFUND_STATUSES.includes(event.new_status)) {
          
          log.info('Executando ações pós-reembolso', { 
            orderId: order.id, 
            reason: event.new_status 
          });

          try {
            const refundResult = await processPostRefundActions(supabase, {
              orderId: orderData.id,
              productId: orderData.product_id,
              vendorId: orderData.vendor_id,
              reason: event.new_status as RefundReason,
              eventId: event.id,
            }, getRefundEventType(event.new_status as RefundReason), log);

            processingSuccess = true;

            log.info('Resultado das ações pós-reembolso', {
              accessRevoked: refundResult.accessRevoked,
              buyerId: refundResult.buyerId,
              groupsRemoved: refundResult.groupsRemoved,
              webhooksTriggered: refundResult.webhooksTriggered,
            });
          } catch (refundError) {
            const errMsg = refundError instanceof Error ? refundError.message : 'Unknown error';
            processingError = `Post-refund actions failed: ${errMsg}`;
            log.error('Falha nas ações pós-reembolso', { error: errMsg });
          }
        }

        // ====================================================================
        // OUTROS STATUS: Apenas marcar como processado (sem ação)
        // ====================================================================
        else {
          log.info('Evento sem ação necessária', { 
            orderId: order.id, 
            transition 
          });
          processingSuccess = true;
        }

        // ====================================================================
        // MARCAR EVENTO COMO PROCESSADO OU COM ERRO
        // ====================================================================

        if (processingSuccess) {
          await markEventProcessed(supabase, event.id);
          result.processed++;
          log.info('✅ Evento processado com sucesso', { eventId: event.id });
        } else {
          await markEventError(supabase, event.id, event.retry_count, processingError || 'Unknown error');
          result.errors++;
        }

      } catch (eventError) {
        const errMsg = eventError instanceof Error ? eventError.message : 'Unknown error';
        log.error(`Exceção ao processar evento ${event.id}`, { error: errMsg });
        await markEventError(supabase, event.id, event.retry_count, errMsg);
        result.errors++;
      }
    }

    // ========================================================================
    // 3. RESULTADO FINAL
    // ========================================================================

    log.info('✅ Worker concluído', result);

    return new Response(JSON.stringify({
      ...result,
      version: FUNCTION_VERSION,
    }), {
      headers: { ...PUBLIC_CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (fatalError) {
    const errMsg = fatalError instanceof Error ? fatalError.message : 'Fatal error';
    log.error('❌ Erro fatal no worker', { error: errMsg });

    return new Response(JSON.stringify({ 
      error: errMsg,
      ...result,
      version: FUNCTION_VERSION,
    }), {
      status: 500,
      headers: { ...PUBLIC_CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Marca um evento como processado com sucesso
 */
async function markEventProcessed(
  supabase: ReturnType<typeof createClient>,
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
async function markEventError(
  supabase: ReturnType<typeof createClient>,
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
