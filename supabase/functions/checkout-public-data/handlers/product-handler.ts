/**
 * Product Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles product data fetching by ID.
 * 
 * @module checkout-public-data/handlers/product
 */

import { createLogger } from "../../_shared/logger.ts";
import type { HandlerContext } from "../types.ts";

const log = createLogger("checkout-public-data/product");

export async function handleProduct(ctx: HandlerContext): Promise<Response> {
  const { supabase, body, jsonResponse } = ctx;
  const { productId } = body;

  if (!productId) {
    return jsonResponse({ error: "productId required" }, 400);
  }

  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      user_id,
      name,
      description,
      price,
      image_url,
      support_name,
      required_fields,
      default_payment_method,
      upsell_settings,
      affiliate_settings,
      status,
      pix_gateway,
      credit_card_gateway
    `)
    .eq("id", productId)
    .maybeSingle();

  if (error || !data) {
    log.error("Product not found:", error);
    return jsonResponse({ error: "Produto não encontrado" }, 404);
  }

  if (data.status === "deleted" || data.status === "blocked") {
    return jsonResponse({ error: "Produto não disponível" }, 404);
  }

  return jsonResponse({ success: true, data });
}
