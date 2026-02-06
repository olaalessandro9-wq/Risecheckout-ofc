/**
 * Checkout Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles checkout data fetching by ID.
 * SSOT: Only fetches design JSON, not individual color columns.
 * 
 * @module checkout-public-data/handlers/checkout
 */

import { createLogger } from "../../_shared/logger.ts";
import type { HandlerContext } from "../types.ts";

const log = createLogger("checkout-public-data/checkout");

/**
 * SSOT: Minimal SELECT - only fields actually used by the frontend.
 * Individual color columns (primary_color, text_color, etc.) are DEPRECATED.
 * All color data comes from the `design` JSON field.
 */
const CHECKOUT_SELECT = `
  id,
  name,
  slug,
  visits_count,
  seller_name,
  product_id,
  font,
  components,
  top_components,
  bottom_components,
  mobile_top_components,
  mobile_bottom_components,
  status,
  design,
  theme,
  pix_gateway,
  credit_card_gateway,
  mercadopago_public_key,
  stripe_public_key
`;

export async function handleCheckout(ctx: HandlerContext): Promise<Response> {
  const { supabase, body, jsonResponse } = ctx;
  const { checkoutId } = body;

  if (!checkoutId) {
    return jsonResponse({ error: "checkoutId required" }, 400);
  }

  const { data, error } = await supabase
    .from("checkouts")
    .select(CHECKOUT_SELECT)
    .eq("id", checkoutId)
    .maybeSingle();

  if (error || !data) {
    log.error("Checkout not found:", error);
    return jsonResponse({ error: "Checkout não encontrado" }, 404);
  }

  if (data.status === "deleted") {
    return jsonResponse({ error: "Checkout não disponível" }, 404);
  }

  return jsonResponse({ success: true, data });
}
