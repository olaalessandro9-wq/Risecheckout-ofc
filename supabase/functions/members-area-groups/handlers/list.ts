/**
 * Handler: List groups for a product
 * RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";
import type { GroupRecord } from "../types.ts";

export async function handleListGroups(
  supabase: SupabaseClient,
  productId: string | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!productId) {
    return errorResponse("product_id required", corsHeaders, 400);
  }

  const { data: groups, error } = await supabase
    .from("product_member_groups")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: true }) as { data: GroupRecord[] | null; error: Error | null };

  if (error) throw error;

  return jsonResponse({ success: true, groups }, corsHeaders);
}
