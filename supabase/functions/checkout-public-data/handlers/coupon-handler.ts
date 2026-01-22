/**
 * Coupon Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles coupon validation for checkout.
 * 
 * @module checkout-public-data/handlers/coupon
 */

import type { HandlerContext } from "../types.ts";

export async function handleValidateCoupon(ctx: HandlerContext): Promise<Response> {
  const { supabase, body, jsonResponse } = ctx;
  const { couponCode, productId } = body;

  if (!couponCode || !productId) {
    return jsonResponse({ error: "couponCode and productId required" }, 400);
  }

  // 1. Fetch coupon by code (case-insensitive)
  const { data: coupon, error: couponError } = await supabase
    .from("coupons")
    .select("*")
    .ilike("code", couponCode.trim())
    .single();

  if (couponError || !coupon) {
    return jsonResponse({ error: "Cupom inválido ou não encontrado" }, 400);
  }

  if (!coupon.active) {
    return jsonResponse({ error: "Este cupom está inativo" }, 400);
  }

  // 2. Check if coupon is linked to this product
  const { data: couponProduct, error: cpError } = await supabase
    .from("coupon_products")
    .select("*")
    .eq("coupon_id", coupon.id)
    .eq("product_id", productId)
    .single();

  if (cpError || !couponProduct) {
    return jsonResponse({ error: "Este cupom não é válido para este produto" }, 400);
  }

  // 3. Check start date
  if (coupon.start_date) {
    const startDate = new Date(coupon.start_date);
    if (new Date() < startDate) {
      return jsonResponse({ error: "Este cupom ainda não está ativo" }, 400);
    }
  }

  // 4. Check expiration
  if (coupon.expires_at) {
    const expiresAt = new Date(coupon.expires_at);
    if (new Date() > expiresAt) {
      return jsonResponse({ error: "Este cupom expirou" }, 400);
    }
  }

  // 5. Check usage limit
  if (coupon.max_uses && coupon.max_uses > 0) {
    if ((coupon.uses_count ?? 0) >= coupon.max_uses) {
      return jsonResponse({ error: "Este cupom atingiu o limite de usos" }, 400);
    }
  }

  // Valid coupon!
  return jsonResponse({
    success: true,
    data: {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name || coupon.code,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      apply_to_order_bumps: coupon.apply_to_order_bumps || false,
    },
  });
}
