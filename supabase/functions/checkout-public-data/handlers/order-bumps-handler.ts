/**
 * Order Bumps Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles order bumps fetching and formatting.
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
  discount_price: number | null;
  show_image: boolean;
  call_to_action: string | null;
  products: BumpProduct | null;
  offers: BumpOffer | null;
}

export function formatOrderBumps(rawBumps: RawBump[]): OrderBumpFormatted[] {
  return rawBumps.map((bump) => {
    const product = bump.products;
    const offer = bump.offers;
    
    const priceInCents = offer?.price ? Number(offer.price) : (product?.price || 0);
    let price = priceInCents;
    let originalPrice: number | null = null;
    
    if (bump.discount_enabled && bump.discount_price) {
      originalPrice = price;
      price = Number(bump.discount_price);
    }

    return {
      id: bump.id,
      product_id: bump.product_id,
      name: bump.custom_title || product?.name || "Oferta Especial",
      description: bump.custom_description || product?.description || "",
      price,
      original_price: originalPrice,
      image_url: bump.show_image ? product?.image_url || null : null,
      call_to_action: bump.call_to_action,
      product: product as Record<string, unknown> | null,
      offer: offer as Record<string, unknown> | null,
    };
  });
}

export async function handleOrderBumps(ctx: HandlerContext): Promise<Response> {
  const { supabase, body, jsonResponse } = ctx;
  const { checkoutId } = body;

  if (!checkoutId) {
    return jsonResponse({ error: "checkoutId required" }, 400);
  }

  const { data, error } = await supabase
    .from("order_bumps")
    .select(`
      id,
      product_id,
      custom_title,
      custom_description,
      discount_enabled,
      discount_price,
      show_image,
      call_to_action,
      products(id, name, description, price, image_url),
      offers(id, name, price)
    `)
    .eq("checkout_id", checkoutId)
    .eq("active", true)
    .order("position");

  if (error) {
    log.error("Order bumps error:", error);
    return jsonResponse({ success: true, data: [] });
  }

  const formatted = formatOrderBumps(data as RawBump[] || []);
  return jsonResponse({ success: true, data: formatted });
}
