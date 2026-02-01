/**
 * Offer Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles offer data fetching by checkout ID.
 * 
 * @module checkout-public-data/handlers/offer
 */

import { createLogger } from "../../_shared/logger.ts";
import type { HandlerContext } from "../types.ts";

const log = createLogger("checkout-public-data/offer");

export async function handleOffer(ctx: HandlerContext): Promise<Response> {
  const { supabase, body, jsonResponse } = ctx;
  const { checkoutId } = body;

  if (!checkoutId) {
    return jsonResponse({ error: "checkoutId required" }, 400);
  }

  const { data, error } = await supabase
    .from("checkout_links")
    .select(`
      link_id,
      payment_links!inner (
        offer_id,
        offers!inner (
          id,
          name,
          price
        )
      )
    `)
    .eq("checkout_id", checkoutId)
    .maybeSingle();

  if (error || !data) {
    log.error("Offer not found:", error);
    return jsonResponse({ error: "Oferta não encontrada" }, 404);
  }

  const paymentLinks = data.payment_links as unknown as {
    offer_id: string;
    offers: { id: string; name: string; price: number };
  };

  return jsonResponse({
    success: true,
    data: {
      offerId: paymentLinks.offer_id,
      offerName: paymentLinks.offers.name,
      offerPrice: paymentLinks.offers.price,
    },
  });
}

export async function handleGetCheckoutOffer(ctx: HandlerContext): Promise<Response> {
  const { supabase, body, jsonResponse } = ctx;
  const { checkoutId } = body;

  if (!checkoutId) {
    return jsonResponse({ error: "checkoutId required" }, 400);
  }

  const { data, error } = await supabase
    .from("checkout_links")
    .select(`
      link_id,
      payment_links (
        offer_id
      )
    `)
    .eq("checkout_id", checkoutId)
    .limit(1)
    .maybeSingle();

  if (error) {
    log.error("Get checkout offer error:", error);
    return jsonResponse({ offerId: "" });
  }

  const paymentLinks = data?.payment_links as unknown as { offer_id: string } | null;
  return jsonResponse({ offerId: paymentLinks?.offer_id || "" });
}
