/**
 * Entities Handler - Fetches order bumps and coupons
 * 
 * @module product-full-loader/handlers
 * @version RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { OrderBumpRecord, CouponRecord } from "../types.ts";

interface EntitiesHandlerResult {
  orderBumps: OrderBumpRecord[];
  coupons: CouponRecord[];
}

export async function fetchEntities(
  supabase: SupabaseClient,
  productId: string
): Promise<EntitiesHandlerResult> {
  // Fetch order bumps and coupons in parallel
  const [orderBumpsResult, couponsResult] = await Promise.all([
    fetchOrderBumps(supabase, productId),
    fetchCoupons(supabase, productId),
  ]);

  return {
    orderBumps: orderBumpsResult,
    coupons: couponsResult,
  };
}

async function fetchOrderBumps(
  supabase: SupabaseClient,
  productId: string
): Promise<OrderBumpRecord[]> {
  const { data, error } = await supabase
    .from("order_bumps")
    .select(`
      id,
      product_id,
      bump_product_id,
      bump_offer_id,
      title,
      description,
      call_to_action,
      display_price,
      special_price,
      position,
      active,
      created_at,
      updated_at
    `)
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch order bumps: ${error.message}`);
  }

  return (data ?? []) as OrderBumpRecord[];
}

async function fetchCoupons(
  supabase: SupabaseClient,
  productId: string
): Promise<CouponRecord[]> {
  const { data, error } = await supabase
    .from("coupon_products")
    .select(`
      coupons (
        id,
        code,
        name,
        description,
        discount_type,
        discount_value,
        max_uses,
        uses_count,
        expires_at,
        start_date,
        active,
        apply_to_order_bumps,
        created_at
      )
    `)
    .eq("product_id", productId);

  if (error) {
    throw new Error(`Failed to fetch coupons: ${error.message}`);
  }

  // Flatten the nested structure
  const coupons: CouponRecord[] = [];
  for (const item of data ?? []) {
    if (item.coupons) {
      coupons.push(item.coupons as unknown as CouponRecord);
    }
  }

  return coupons;
}
