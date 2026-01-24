/**
 * Orders Handler
 * 
 * Handles GET /orders - List buyer orders
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliance
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import type { BuyerData } from "../types.ts";

const log = createLogger("buyer-orders:orders");

export async function handleOrders(
  supabase: SupabaseClient,
  buyer: BuyerData,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      product_id,
      product_name,
      amount_cents,
      status,
      payment_method,
      created_at,
      paid_at,
      product:product_id (
        id,
        name,
        image_url,
        members_area_enabled
      )
    `)
    .eq("buyer_id", buyer.id)
    .order("created_at", { ascending: false });

  if (error) {
    log.error("Error fetching orders:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao buscar pedidos" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ orders }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
