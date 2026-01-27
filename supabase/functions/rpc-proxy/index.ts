/**
 * RPC Proxy Edge Function
 * 
 * Centralizes RPC calls from frontend, providing:
 * - Authentication validation
 * - Timezone injection for relevant RPCs
 * - Rate limiting (future)
 * - Audit logging (future)
 * 
 * @version 4.0.0 - RISE Protocol V3 (timezone support)
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { getAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("rpc-proxy");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

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

// RPCs that need p_user_id injection
const RPCS_NEED_USER_ID = ["get_producer_affiliates"];

// RPCs that need p_timezone injection
const RPCS_NEED_TIMEZONE = ["get_dashboard_metrics"];

interface RpcRequest {
  rpc: string;
  params?: Record<string, unknown>;
}

interface ProducerWithTimezone {
  id: string;
  role?: string;
  timezone?: string;
}

/**
 * Get vendor timezone from profile
 */
async function getVendorTimezone(
  supabase: SupabaseClient,
  vendorId: string
): Promise<string> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', vendorId)
      .single();
    
    if (error || !profile) {
      log.info(`No timezone for vendor ${vendorId}, using default`);
      return DEFAULT_TIMEZONE;
    }
    
    const tz = (profile as { timezone?: string }).timezone;
    return tz || DEFAULT_TIMEZONE;
  } catch {
    log.info("Error fetching timezone, using default");
    return DEFAULT_TIMEZONE;
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  const corsResult = handleCorsV2(req);
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
    let producer: ProducerWithTimezone | null = null;
    
    if (isProducer || isAdmin) {
      // Auth via unified-auth
      producer = await getAuthenticatedProducer(supabase, req);

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
      // INJECT PARAMETERS FOR SPECIFIC RPCs
      // ============================================
      
      const needsUserId = RPCS_NEED_USER_ID.includes(rpc);
      const needsTimezone = RPCS_NEED_TIMEZONE.includes(rpc);
      
      if (needsUserId || needsTimezone) {
        let enrichedParams = { ...(params || {}) };
        
        // Inject p_user_id
        if (needsUserId) {
          enrichedParams.p_user_id = producer.id;
          log.info(`Injecting p_user_id=${producer.id} for RPC ${rpc}`);
        }
        
        // Inject p_timezone
        if (needsTimezone) {
          const timezone = await getVendorTimezone(supabase, producer.id);
          enrichedParams.p_timezone = timezone;
          log.info(`Injecting p_timezone=${timezone} for RPC ${rpc}`);
        }
        
        const { data, error } = await supabase.rpc(rpc as never, enrichedParams);
        
        if (error) {
          log.error(`RPC ${rpc} failed:`, error);
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

    // Execute the RPC (for public RPCs or producer RPCs that don't need injection)
    const { data, error } = await supabase.rpc(rpc as never, params || {});

    if (error) {
      log.error(`RPC ${rpc} failed:`, error);
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
    log.error("Exception:", err);
    // RISE V3: corsHeaders already validated at function start
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
