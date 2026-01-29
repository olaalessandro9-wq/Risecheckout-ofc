/**
 * Handler: Get producer info for a product
 * 
 * RISE Protocol V3 - 10.0/10 Compliant
 * Uses 'users' table as SSOT for producer info lookup
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

  // RISE V3: Use 'users' table as SSOT for producer info
  const { data: user } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", product.user_id)
    .single();

  return jsonResponse({
    success: true,
    producer_info: {
      id: product.user_id,
      name: user?.name || null,
      email: user?.email || null,
    }
  }, 200, corsHeaders);
}
