/**
 * Order Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles order fetching for success page and payment status.
 * 
 * @module checkout-public-data/handlers/order
 */

import { createLogger } from "../../_shared/logger.ts";
import type { HandlerContext } from "../types.ts";

const log = createLogger("checkout-public-data/order");

export async function handleOrderByToken(ctx: HandlerContext): Promise<Response> {
  const { supabase, body, jsonResponse } = ctx;
  const { orderId, token } = body;

  if (!orderId || !token) {
    return jsonResponse({ error: "orderId and token required" }, 400);
  }

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      product_id,
      product_name,
      amount_cents,
      customer_email,
      customer_name,
      coupon_code,
      discount_amount_cents,
      order_items (
        id,
        product_name,
        amount_cents,
        is_bump,
        quantity
      ),
      product:products!orders_product_id_fkey (
        members_area_enabled
      )
    `)
    .eq("id", orderId)
    .eq("access_token", token)
    .single();

  if (error || !data) {
    log.error("Order not found:", error);
    return jsonResponse({ error: "Pedido não encontrado" }, 404);
  }

  return jsonResponse({ success: true, data });
}

export async function handleCheckOrderPaymentStatus(ctx: HandlerContext): Promise<Response> {
  const { supabase, body, jsonResponse } = ctx;
  const { orderId } = body;

  if (!orderId) {
    return jsonResponse({ error: "orderId required" }, 400);
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("status, pix_status")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    log.error("Order check error:", error);
    return jsonResponse({ error: "Erro ao verificar pedido" }, 500);
  }

  if (!order) {
    return jsonResponse({ error: "Pedido não encontrado" }, 404);
  }

  const isPaid = order.status === "PAID" || order.pix_status === "paid";

  return jsonResponse({
    success: true,
    data: {
      status: order.status,
      pix_status: order.pix_status,
      isPaid,
    },
  });
}
