/**
 * Profile Handler
 * 
 * Handles GET /profile - Get buyer profile data
 * 
 * @version 4.0.0 - RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * SSOT: users table is the single source of truth
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { BuyerData } from "../types.ts";

export async function handleProfile(
  supabase: SupabaseClient,
  buyer: BuyerData,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // RISE V3: Query users table as SSOT - zero buyer_profiles fallbacks
  const { data: profile } = await supabase
    .from("users")
    .select("id, email, name, phone, created_at")
    .eq("id", buyer.id)
    .single();

  return new Response(
    JSON.stringify({ profile }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
