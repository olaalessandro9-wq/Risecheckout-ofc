/**
 * Handler: Get producer info for a product
 * RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse } from "../helpers.ts";

export async function handleGetProducerInfo(
  supabase: SupabaseClient,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Get product owner
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("user_id")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return jsonResponse({ error: "Product not found" }, 404, corsHeaders);
  }

  // Get profile info
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("id", product.user_id)
    .single();

  // Get email via RPC
  const { data: emailData } = await supabase.rpc("get_user_email", { user_id: product.user_id });

  return jsonResponse({
    success: true,
    producer_info: {
      id: product.user_id,
      name: profile?.name || null,
      email: emailData || null,
    }
  }, 200, corsHeaders);
}
