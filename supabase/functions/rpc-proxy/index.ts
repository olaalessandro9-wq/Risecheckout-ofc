/**
 * RPC Proxy Edge Function
 * 
 * Centralizes RPC calls from frontend, providing:
 * - Authentication validation
 * - Rate limiting (future)
 * - Audit logging (future)
 * 
 * @version 3.0.0 - RISE Protocol V3 (unified-auth)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { getAuthenticatedProducer } from "../_shared/unified-auth.ts";

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
      // Auth via unified-auth
      const producer = await getAuthenticatedProducer(supabase, req);

      if (!producer) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // For admin RPCs, verify admin role
      if (isAdmin) {
        if (producer.role !== "admin" && producer.role !== "owner") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // ============================================
      // INJECT p_user_id FOR RPCs THAT NEED IT
      // ============================================
      const RPCS_NEED_USER_ID = ["get_producer_affiliates"];
      
      if (RPCS_NEED_USER_ID.includes(rpc)) {
        const enrichedParams = {
          ...(params || {}),
          p_user_id: producer.id,
        };
        
        console.log(`[rpc-proxy] Injecting p_user_id=${producer.id} for RPC ${rpc}`);
        
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
