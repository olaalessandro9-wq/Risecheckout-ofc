/**
 * Offers Entity Handler - Shared module
 * 
 * Single Source of Truth for fetching product offers.
 * Used by: product-full-loader, product-entities
 * 
 * @module _shared/entities/offers
 * @version RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";

const logger = createLogger("entities/offers");

/**
 * Fetches all offers for a product
 * Uses SELECT * to avoid column mismatches with database schema
 */
export async function fetchProductOffers(
  supabase: SupabaseClient,
  productId: string
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "active")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("Failed to fetch offers", { productId, error: error.message });
    throw new Error(`offers: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Fetches active offers for a product (for entities endpoint)
 */
export async function fetchActiveProductOffers(
  supabase: SupabaseClient,
  productId: string
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to fetch active offers", { productId, error: error.message });
    throw new Error(`offers: ${error.message}`);
  }

  return data ?? [];
}
