/**
 * ============================================================================
 * ORDER LIFECYCLE WORKER - Refund Handler
 * ============================================================================
 * 
 * Handler para processar eventos de reembolso e chargeback.
 * Executa ações de revogação: remove access, groups, webhooks.
 * 
 * RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  processPostRefundActions, 
  getRefundEventType, 
  type RefundReason 
} from "../../_shared/webhook-post-refund.ts";
import { type Logger } from "../../_shared/webhook-helpers.ts";
import { type OrderData, type EventProcessingOutcome } from "../types.ts";

/**
 * Processa evento de reembolso ou chargeback
 * Executa: revoke members access, remove groups, webhooks externos
 */
export async function handleRefund(
  supabase: SupabaseClient,
  order: OrderData,
  reason: RefundReason,
  eventId: string,
  logger: Logger
): Promise<EventProcessingOutcome> {
  try {
    logger.info('Executando ações pós-reembolso', { 
      orderId: order.id, 
      reason 
    });

    const refundResult = await processPostRefundActions(supabase, {
      orderId: order.id,
      productId: order.product_id,
      vendorId: order.vendor_id,
      reason,
      eventId,
    }, getRefundEventType(reason), logger);

    logger.info('Resultado das ações pós-reembolso', {
      accessRevoked: refundResult.accessRevoked,
      buyerId: refundResult.buyerId,
      groupsRemoved: refundResult.groupsRemoved,
      webhooksTriggered: refundResult.webhooksTriggered,
    });

    return { success: true, error: null };

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Falha nas ações pós-reembolso', { error: errMsg });
    return { 
      success: false, 
      error: `Post-refund actions failed: ${errMsg}` 
    };
  }
}
