/**
 * RPC Proxy Edge Function
 * 
 * Centralizes RPC calls from frontend, providing:
 * - Authentication validation
 * - Rate limiting (future)
 * - Audit logging (future)
 * 
 * @see RISE ARCHITECT PROTOCOL - Zero direct RPC calls from frontend
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { handleCors, PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// RPCs that don't require authentication
const PUBLIC_RPCS = [
  "get_checkout_by_payment_slug",
  "validate_coupon",
  "increment_marketplace_view",
  "increment_marketplace_click",
  "get_affiliate_checkout_info",
  "get_order_for_payment",
];

// RPCs that require producer session authentication
const PRODUCER_RPCS = [
  "attach_offer_to_checkout_smart",
  "clone_checkout_layout",
  "duplicate_checkout_shallow",
  "get_dashboard_metrics",
  "get_producer_affiliates",
  "get_user_email",
];

// RPCs that require admin authentication (check user_roles)
const ADMIN_RPCS = [
  "get_system_health_summary",
  "get_unresolved_errors",
  "get_webhook_stats_24h",
];

interface RpcRequest {
  rpc: string;
  params?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Handle CORS
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const body = await req.json() as RpcRequest;
    const { rpc, params } = body;

    if (!rpc || typeof rpc !== "string") {
      return new Response(
        JSON.stringify({ error: "RPC name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Determine auth level required
    const isPublic = PUBLIC_RPCS.includes(rpc);
    const isProducer = PRODUCER_RPCS.includes(rpc);
    const isAdmin = ADMIN_RPCS.includes(rpc);

    if (!isPublic && !isProducer && !isAdmin) {
      return new Response(
        JSON.stringify({ error: `RPC '${rpc}' is not allowed` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate authentication for non-public RPCs
    if (isProducer || isAdmin) {
      const sessionToken = req.headers.get("x-producer-session-token");

      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate session token
      // FIX: producer_sessions uses "producer_id", NOT "user_id"
      const { data: session, error: sessionError } = await supabase
        .from("producer_sessions")
        .select("producer_id, expires_at, is_valid")
        .eq("session_token", sessionToken)
        .single();

      if (sessionError || !session || !session.is_valid) {
        console.error("[rpc-proxy] Invalid session:", sessionError?.message || "no session found");
        return new Response(
          JSON.stringify({ error: "Invalid session" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check expiration
      if (new Date(session.expires_at) < new Date()) {
        console.warn("[rpc-proxy] Session expired for producer:", session.producer_id);
        return new Response(
          JSON.stringify({ error: "Session expired" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // For admin RPCs, verify admin role
      // FIX: use producer_id (which maps to profiles.id / user_roles.user_id)
      if (isAdmin) {
        const { data: role } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.producer_id)
          .single();

        if (!role || (role.role !== "admin" && role.role !== "owner")) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // ============================================
      // INJECT p_user_id FOR RPCs THAT NEED IT
      // ============================================
      // RPCs that use auth.uid() in their SQL won't work because
      // we're using service_role which doesn't set auth.uid().
      // Instead, we inject the producer_id from the validated session.
      const RPCS_NEED_USER_ID = ["get_producer_affiliates"];
      
      if (RPCS_NEED_USER_ID.includes(rpc)) {
        // Inject p_user_id into params
        const enrichedParams = {
          ...(params || {}),
          p_user_id: session.producer_id,
        };
        
        console.log(`[rpc-proxy] Injecting p_user_id=${session.producer_id} for RPC ${rpc}`);
        
        const { data, error } = await supabase.rpc(rpc as never, enrichedParams);
        
        if (error) {
          console.error(`[rpc-proxy] RPC ${rpc} failed:`, error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Execute the RPC (for public RPCs or producer RPCs that don't need p_user_id)
    // Using type assertion since RPCs are validated above
    const { data, error } = await supabase.rpc(rpc as never, params || {});

    if (error) {
      console.error(`[rpc-proxy] RPC ${rpc} failed:`, error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[rpc-proxy] Exception:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...PUBLIC_CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
