/**
 * Profile Handler
 * 
 * Handles GET /profile - Get buyer profile data
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliance
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { BuyerData } from "../types.ts";

export async function handleProfile(
  supabase: SupabaseClient,
  buyer: BuyerData,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: profile } = await supabase
    .from("buyer_profiles")
    .select("id, email, name, phone, created_at")
    .eq("id", buyer.id)
    .single();

  return new Response(
    JSON.stringify({ profile }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
