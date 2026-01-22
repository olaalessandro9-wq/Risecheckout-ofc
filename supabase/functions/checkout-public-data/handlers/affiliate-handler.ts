/**
 * Affiliate Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles affiliate data fetching by code and product.
 * 
 * @module checkout-public-data/handlers/affiliate
 */

import type { HandlerContext } from "../types.ts";

export async function handleAffiliate(ctx: HandlerContext): Promise<Response> {
  const { supabase, body, jsonResponse } = ctx;
  const { affiliateCode, productId } = body;

  if (!affiliateCode || !productId) {
    return jsonResponse({ success: true, data: null });
  }

  const { data, error } = await supabase
    .from("affiliates")
    .select("id, affiliate_code, user_id, commission_rate")
    .eq("affiliate_code", affiliateCode)
    .eq("product_id", productId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    return jsonResponse({ success: true, data: null });
  }

  return jsonResponse({
    success: true,
    data: {
      affiliateId: data.id,
      affiliateCode: data.affiliate_code,
      affiliateUserId: data.user_id,
      commissionRate: data.commission_rate,
    },
  });
}
