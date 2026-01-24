/**
 * Handler: List active offers for a product
 * RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";
import type { OfferRecord } from "../types.ts";

export async function handleListOffers(
  supabase: SupabaseClient,
  productId: string | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!productId) {
    return errorResponse("product_id required", corsHeaders, 400);
  }

  const { data: offers, error } = await supabase
    .from("offers")
    .select("id, name, price, is_default, member_group_id, status")
    .eq("product_id", productId)
    .eq("status", "active")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true }) as { data: OfferRecord[] | null; error: Error | null };

  if (error) throw error;

  return jsonResponse({ success: true, offers }, corsHeaders);
}
