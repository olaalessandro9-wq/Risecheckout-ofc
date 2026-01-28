/**
 * Order Bumps Entity Handler - Shared module
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Single Source of Truth for fetching order bumps.
 * Used by: product-full-loader, product-entities
 * 
 * CRITICAL PRICE SEMANTICS:
 * - `original_price`: MARKETING price for strikethrough display only
 * - The REAL price charged comes from the linked offer/product
 * - `original_price` is NEVER used for billing calculations
 * 
 * @module _shared/entities/orderBumps
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";

const logger = createLogger("entities/orderBumps");

/**
 * Fetches order bumps for a product via parent_product_id (RISE V3)
 * Order bumps are linked to products, not checkouts
 */
export async function fetchProductOrderBumps(
  supabase: SupabaseClient,
  productId: string
): Promise<Record<string, unknown>[]> {
  // RISE V3: Direct query by parent_product_id
  const { data, error } = await supabase
    .from("order_bumps")
    .select("*")
    .eq("parent_product_id", productId)
    .order("position", { ascending: true });

  if (error) {
    logger.error("Failed to fetch order bumps", { productId, error: error.message });
    throw new Error(`order_bumps: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Fetches order bumps WITH product relations for complete data
 * Includes: products (id, name, price, image_url)
 * 
 * Used by BFF for initial loading with full data
 * 
 * NOTE: original_price is MARKETING ONLY - for strikethrough display
 * The REAL price charged comes from the linked offer/product
 */
export async function fetchProductOrderBumpsWithRelations(
  supabase: SupabaseClient,
  productId: string
): Promise<Record<string, unknown>[]> {
  // RISE V3: Direct query by parent_product_id
  // NOTE: original_price is MARKETING ONLY - never used for billing
  const { data, error } = await supabase
    .from("order_bumps")
    .select(`
      id,
      parent_product_id,
      checkout_id,
      product_id,
      offer_id,
      position,
      active,
      discount_enabled,
      original_price,
      call_to_action,
      custom_title,
      custom_description,
      show_image,
      created_at,
      updated_at,
      products:product_id (
        id,
        name,
        price,
        image_url
      )
    `)
    .eq("parent_product_id", productId)
    .eq("active", true)
    .order("position", { ascending: true });

  if (error) {
    logger.error("Failed to fetch order bumps with relations", { 
      productId, 
      error: error.message 
    });
    throw new Error(`order_bumps: ${error.message}`);
  }

  return data ?? [];
}
