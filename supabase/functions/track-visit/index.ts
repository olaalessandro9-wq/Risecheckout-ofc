/**
 * Edge Function: track-visit
 * 
 * Tracks checkout visits with server-side IP capture.
 * Also increments the legacy visits_count counter.
 * 
 * @version 1.0.0 - RISE Protocol V2
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackVisitPayload {
  checkoutId: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: TrackVisitPayload = await req.json();
    const { checkoutId, userAgent, referrer, utmSource, utmMedium, utmCampaign, utmContent, utmTerm } = payload;

    if (!checkoutId) {
      return new Response(
        JSON.stringify({ error: "checkoutId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract IP from headers (Supabase/Cloudflare provides these)
    const ip = req.headers.get("x-real-ip") ||
               req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("cf-connecting-ip") ||
               null;

    // Create Supabase client with service role (bypass RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert visit record
    const { error: insertError } = await supabase
      .from("checkout_visits")
      .insert({
        checkout_id: checkoutId,
        ip_address: ip,
        user_agent: userAgent || req.headers.get("user-agent"),
        referrer: referrer || null,
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
        utm_content: utmContent || null,
        utm_term: utmTerm || null,
      });

    if (insertError) {
      console.error("[track-visit] Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment legacy counter
    const { error: rpcError } = await supabase.rpc("increment_checkout_visits", {
      checkout_id: checkoutId,
    });

    if (rpcError) {
      console.warn("[track-visit] RPC increment error (non-fatal):", rpcError);
    }

    console.log(`[track-visit] Visit tracked: checkout=${checkoutId}, ip=${ip}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[track-visit] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
