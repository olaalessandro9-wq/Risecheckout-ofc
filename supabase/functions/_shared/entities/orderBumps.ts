/**
 * Order Bumps Entity Handler - Shared module
 * 
 * Single Source of Truth for fetching order bumps.
 * Used by: product-full-loader, product-entities
 * 
 * @module _shared/entities/orderBumps
 * @version RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";

const logger = createLogger("entities/orderBumps");

/**
 * Fetches order bumps for a product via checkout_id
 * Order bumps are linked to checkouts, not directly to products
 */
export async function fetchProductOrderBumps(
  supabase: SupabaseClient,
  productId: string
): Promise<Record<string, unknown>[]> {
  // First get checkout IDs for this product
  const { data: checkouts, error: checkoutsError } = await supabase
    .from("checkouts")
    .select("id")
    .eq("product_id", productId);

  if (checkoutsError) {
    logger.error("Failed to fetch checkouts for order bumps", { 
      productId, 
      error: checkoutsError.message 
    });
    throw new Error(`checkouts: ${checkoutsError.message}`);
  }

  const checkoutIds = (checkouts ?? []).map((c: { id: string }) => c.id);

  if (checkoutIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("order_bumps")
    .select("*")
    .in("checkout_id", checkoutIds)
    .order("position", { ascending: true });

  if (error) {
    logger.error("Failed to fetch order bumps", { productId, error: error.message });
    throw new Error(`order_bumps: ${error.message}`);
  }

  return data ?? [];
}
