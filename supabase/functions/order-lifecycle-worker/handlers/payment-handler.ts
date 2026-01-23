/**
 * ============================================================================
 * ORDER LIFECYCLE WORKER - Payment Handler
 * ============================================================================
 * 
 * Handler para processar eventos de pagamento aprovado.
 * Executa ações pós-pagamento: grant access, emails, webhooks.
 * 
 * RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processPostPaymentActions } from "../../_shared/webhook-post-payment.ts";
import { type Logger } from "../../_shared/webhook-helpers.ts";
import { type OrderData, type EventProcessingOutcome } from "../types.ts";

/**
 * Processa evento de pagamento aprovado
 * Executa: grant members access, emails, webhooks externos
 */
export async function handlePaymentApproved(
  supabase: SupabaseClient,
  order: OrderData,
  logger: Logger
): Promise<EventProcessingOutcome> {
  try {
    logger.info('Executando ações pós-pagamento', { orderId: order.id });

    await processPostPaymentActions(supabase, {
      orderId: order.id,
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      productId: order.product_id,
      productName: order.product_name,
      amountCents: order.amount_cents,
      offerId: order.offer_id,
      paymentMethod: order.gateway || 'Unknown',
      vendorId: order.vendor_id,
    }, 'purchase_approved', logger);

    return { success: true, error: null };

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Falha nas ações pós-pagamento', { error: errMsg });
    return { 
      success: false, 
      error: `Post-payment actions failed: ${errMsg}` 
    };
  }
}
