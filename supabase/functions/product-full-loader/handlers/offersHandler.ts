/**
 * Offers Handler - Fetches product offers
 * 
 * @module product-full-loader/handlers
 * @version RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { OfferRecord } from "../types.ts";

export async function fetchOffers(
  supabase: SupabaseClient,
  productId: string
): Promise<OfferRecord[]> {
  const { data, error } = await supabase
    .from("offers")
    .select(`
      id,
      product_id,
      name,
      price,
      original_price,
      billing_type,
      billing_cycle,
      billing_cycles_count,
      is_default,
      active,
      grant_member_group_ids,
      created_at,
      updated_at
    `)
    .eq("product_id", productId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch offers: ${error.message}`);
  }

  return (data ?? []) as OfferRecord[];
}
