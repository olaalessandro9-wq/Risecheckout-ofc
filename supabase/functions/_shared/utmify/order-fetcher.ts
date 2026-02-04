/**
 * ============================================================================
 * UTMify Order Fetcher
 * ============================================================================
 * 
 * @module _shared/utmify/order-fetcher
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Busca dados completos do pedido para disparo UTMify.
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";
import type { DatabaseOrder } from "./types.ts";

const log = createLogger("UTMifyOrderFetcher");

/**
 * Busca dados completos do pedido para disparo UTMify
 * 
 * RISE V3: Log melhorado para distinguir "não encontrado" de "erro SQL"
 * 
 * @param supabase - Cliente Supabase
 * @param orderId - ID do pedido
 * @returns Dados do pedido ou null se não encontrado
 */
export async function fetchOrderForUTMify(
  supabase: SupabaseClient,
  orderId: string
): Promise<DatabaseOrder | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, vendor_id, customer_name, customer_email, customer_phone,
      customer_document, customer_ip, amount_cents, payment_method, created_at,
      src, sck, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      order_items (product_id, product_name, amount_cents, quantity)
    `)
    .eq("id", orderId)
    .single();

  if (error) {
    // RISE V3: Distinguir entre "não encontrado" e "erro SQL"
    if (error.code === 'PGRST116') {
      log.warn(`Pedido ${orderId} não encontrado para UTMify`);
    } else {
      log.error(`Erro SQL ao buscar pedido ${orderId} para UTMify:`, {
        code: error.code,
        message: error.message,
        hint: error.hint
      });
    }
    return null;
  }

  if (!data) {
    log.warn(`Pedido ${orderId} não encontrado para UTMify`);
    return null;
  }

  return data as DatabaseOrder;
}
