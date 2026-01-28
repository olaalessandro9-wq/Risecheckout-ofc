/**
 * Order Bumps Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles order bumps fetching and formatting for PUBLIC checkout.
 * 
 * CRITICAL PRICE SEMANTICS:
 * - `price`: The REAL price to be charged (from offer or product)
 * - `original_price`: MARKETING price for strikethrough display only
 * - When discount_enabled=true, display "~~original_price~~ price"
 * - original_price is NEVER used for billing calculations
 * 
 * @module checkout-public-data/handlers/order-bumps
 */

import { createLogger } from "../../_shared/logger.ts";
import type { HandlerContext, OrderBumpFormatted } from "../types.ts";

const log = createLogger("checkout-public-data/order-bumps");

interface BumpProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

interface BumpOffer {
  id: string;
  name: string;
  price: number;
}

interface RawBump {
  id: string;
  product_id: string;
  custom_title: string | null;
  custom_description: string | null;
  discount_enabled: boolean;
  original_price: number | null;
  show_image: boolean;
  call_to_action: string | null;
  products: BumpProduct | null;
  offers: BumpOffer | null;
}

/**
 * Formats raw order bump data for frontend consumption.
 * 
 * PRICE LOGIC (CORRECT):
 * - `price` = Real price from offer (priority) or product (fallback)
 * - `original_price` = Marketing price for strikethrough (only if discount_enabled)
 * 
 * The customer ALWAYS pays the `price`, never the `original_price`.
 */
export function formatOrderBumps(rawBumps: RawBump[]): OrderBumpFormatted[] {
  return rawBumps.map((bump) => {
    const product = bump.products;
    const offer = bump.offers;
    
    // REAL PRICE: Priority 1 = Offer, Priority 2 = Product
    // This is the price that will be CHARGED to the customer
    const realPriceInCents = offer?.price 
      ? Number(offer.price) 
      : (product?.price || 0);
    
    // MARKETING PRICE: Only for visual strikethrough
    // This is NEVER used for billing - purely cosmetic
    let marketingPrice: number | null = null;
    if (bump.discount_enabled && bump.original_price) {
      marketingPrice = Number(bump.original_price);
    }

    return {
      id: bump.id,
      product_id: bump.product_id,
      name: bump.custom_title || product?.name || "Oferta Especial",
      description: bump.custom_description || product?.description || "",
      price: realPriceInCents, // REAL price - what customer pays
      original_price: marketingPrice, // MARKETING price - strikethrough only
      image_url: bump.show_image ? product?.image_url || null : null,
      call_to_action: bump.call_to_action,
      product: product as Record<string, unknown> | null,
      offer: offer as Record<string, unknown> | null,
    };
  });
}

export async function handleOrderBumps(ctx: HandlerContext): Promise<Response> {
  const { supabase, body, jsonResponse } = ctx;
  const { checkoutId, productId } = body;

  // RISE V3: Accept productId directly, or resolve from checkoutId
  let resolvedProductId = productId;
  
  if (!resolvedProductId && checkoutId) {
    const { data: checkout } = await supabase
      .from("checkouts")
      .select("product_id")
      .eq("id", checkoutId)
      .maybeSingle();
    
    resolvedProductId = checkout?.product_id;
  }

  if (!resolvedProductId) {
    return jsonResponse({ error: "productId or checkoutId required" }, 400);
  }

  // RISE V3: Query by parent_product_id
  const { data, error } = await supabase
    .from("order_bumps")
    .select(`
      id,
      product_id,
      custom_title,
      custom_description,
      discount_enabled,
      original_price,
      show_image,
      call_to_action,
      products!product_id(id, name, description, price, image_url),
      offers!offer_id(id, name, price)
    `)
    .eq("parent_product_id", resolvedProductId)
    .eq("active", true)
    .order("position");

  if (error) {
    log.error("Order bumps error:", error);
    return jsonResponse({ success: true, data: [] });
  }

  const formatted = formatOrderBumps(data as RawBump[] || []);
  return jsonResponse({ success: true, data: formatted });
}
