/**
 * Coupons Entity Handler - Shared module
 * 
 * Single Source of Truth for fetching coupons.
 * Used by: product-full-loader, product-entities
 * 
 * @module _shared/entities/coupons
 * @version RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";

const logger = createLogger("entities/coupons");

/**
 * Fetches coupons for a specific product via coupon_products table
 */
export async function fetchProductCoupons(
  supabase: SupabaseClient,
  productId: string
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from("coupon_products")
    .select("coupons(*)")
    .eq("product_id", productId);

  if (error) {
    logger.error("Failed to fetch coupons", { productId, error: error.message });
    throw new Error(`coupons: ${error.message}`);
  }

  // Flatten the nested structure - data is array of { coupons: {...} }
  const coupons: Record<string, unknown>[] = [];
  for (const item of data ?? []) {
    if (item.coupons && typeof item.coupons === "object" && !Array.isArray(item.coupons)) {
      coupons.push(item.coupons as Record<string, unknown>);
    }
  }

  return coupons as Record<string, unknown>[];
}

/**
 * Fetches all coupons (global, for entities endpoint)
 */
export async function fetchAllCoupons(
  supabase: SupabaseClient
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select(`
      *,
      coupon_products (
        product_id
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to fetch all coupons", { error: error.message });
    throw new Error(`coupons: ${error.message}`);
  }

  return data ?? [];
}
