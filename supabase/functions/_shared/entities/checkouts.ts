/**
 * Checkouts Entity Handler - Shared module
 * 
 * Single Source of Truth for fetching checkouts.
 * Used by: product-full-loader, product-entities
 * 
 * @module _shared/entities/checkouts
 * @version RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";

const logger = createLogger("entities/checkouts");

/**
 * Fetches checkouts for a product (simple version for BFF)
 */
export async function fetchProductCheckouts(
  supabase: SupabaseClient,
  productId: string
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from("checkouts")
    .select("*")
    .eq("product_id", productId)
    .neq("status", "deleted")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("Failed to fetch checkouts", { productId, error: error.message });
    throw new Error(`checkouts: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Fetches checkouts with nested relationships (for entities endpoint)
 */
export async function fetchProductCheckoutsWithRelations(
  supabase: SupabaseClient,
  productId: string
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from("checkouts")
    .select(`
      *,
      products (
        name,
        price
      ),
      checkout_links (
        link_id,
        payment_links (
          offers (
            name,
            price
          )
        )
      )
    `)
    .eq("product_id", productId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to fetch checkouts with relations", { 
      productId, 
      error: error.message 
    });
    throw new Error(`checkouts: ${error.message}`);
  }

  return data ?? [];
}
