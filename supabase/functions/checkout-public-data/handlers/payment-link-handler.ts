/**
 * Payment Link Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles payment link data fetching for redirect.
 * 
 * @module checkout-public-data/handlers/payment-link
 */

import { createLogger } from "../../_shared/logger.ts";
import type { HandlerContext } from "../types.ts";

const log = createLogger("checkout-public-data/payment-link");

interface PaymentLinkRPCResult {
  id: string;
  slug: string;
  status: string;
  checkout_slug: string | null;
  offer_id: string;
  product_id: string;
  product_status: string;
  product_support_email: string | null;
}

export async function handlePaymentLinkData(ctx: HandlerContext): Promise<Response> {
  const { supabase, body, jsonResponse } = ctx;
  const { slug } = body;

  if (!slug) {
    return jsonResponse({ error: "slug required" }, 400);
  }

  // Use dedicated RPC that handles explicit JOINs in DB
  // Solves the reverse relationship problem that PostgREST can't do
  const { data, error } = await supabase
    .rpc("get_payment_link_with_checkout_slug", { p_slug: slug })
    .maybeSingle();

  if (error) {
    log.error("Payment link RPC error:", error);
    return jsonResponse({ error: "Link não encontrado" }, 404);
  }

  if (!data) {
    return jsonResponse({ success: true, data: null });
  }

  const result = data as PaymentLinkRPCResult;

  log.debug("Payment link data via RPC:", {
    slug: result.slug,
    checkout_slug: result.checkout_slug,
    product_status: result.product_status,
  });

  return jsonResponse({ 
    success: true, 
    data: {
      id: result.id,
      slug: result.slug,
      status: result.status,
      checkout_slug: result.checkout_slug,
      offers: {
        id: result.offer_id,
        product_id: result.product_id,
        products: {
          id: result.product_id,
          status: result.product_status,
          support_email: result.product_support_email,
        }
      }
    }
  });
}
