/**
 * Handler: get_last_watched
 * Returns last accessed content for "continue watching"
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { errorResponse } from "../../_shared/response-helpers.ts";

export async function handleGetLastWatched(
  supabase: SupabaseClient,
  buyerId: string,
  productId: string | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!productId) {
    return errorResponse("product_id required", corsHeaders, 400);
  }

  // Get modules for this product
  const { data: mods } = await supabase
    .from("product_member_modules")
    .select("id")
    .eq("product_id", productId)
    .eq("is_active", true);

  const modIds = mods?.map(m => m.id) || [];

  if (modIds.length === 0) {
    return new Response(
      JSON.stringify(null),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get contents for these modules
  const { data: cts } = await supabase
    .from("product_member_content")
    .select("id")
    .in("module_id", modIds)
    .eq("is_active", true);

  const ctIds = cts?.map(c => c.id) || [];

  if (ctIds.length === 0) {
    return new Response(
      JSON.stringify(null),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get last watched
  const { data: lastWatched } = await supabase
    .from("buyer_content_progress")
    .select("*")
    .eq("buyer_id", buyerId)
    .in("content_id", ctIds)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return new Response(
    JSON.stringify(lastWatched),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
