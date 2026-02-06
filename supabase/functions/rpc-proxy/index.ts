/**
 * RPC Proxy Edge Function
 * 
 * RISE Protocol V3 - 10.0/10 Compliant
 * Uses 'users' table as SSOT for timezone queries
 * 
 * Centralizes RPC calls from frontend, providing:
 * - Authentication validation
 * - Timezone injection for relevant RPCs
 * - Rate limiting (future)
 * - Audit logging (future)
 * 
 * @version 5.0.0 - Migrated from profiles to users (SSOT)
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { getAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("rpc-proxy");

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
// RISE V3: Removido get_user_email (usava auth.users abandonada)
const PRODUCER_RPCS = [
  "attach_offer_to_checkout_smart",
  "clone_checkout_layout",
  "duplicate_checkout_shallow",
  "get_dashboard_metrics",
  "get_producer_affiliates",
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
 * Execute RPC with dynamic name.
 * 
 * RISE V3: Type assertion required due to Supabase SDK limitation.
 * The SDK expects literal RPC names at compile time, but we need
 * dynamic dispatch based on the incoming request.
 * 
 * This wrapper contains the type assertion in a documented location,
 * avoiding 'as never' scattered throughout the codebase.
 */
async function executeRpc(
  supabase: SupabaseClient,
  rpcName: string,
  params: Record<string, unknown>
): Promise<{ data: unknown; error: Error | null }> {
  // RISE V3: SDK limitation - dynamic RPC names require type assertion
  // The RPC name is validated against PUBLIC_RPCS/PRODUCER_RPCS/ADMIN_RPCS
  // before reaching this function, ensuring only allowed RPCs are executed
  return await supabase.rpc(
    rpcName as Parameters<typeof supabase.rpc>[0],
    params
  );
}

/**
 * Get vendor timezone from users table (SSOT)
 * 
 * RISE V3: Uses 'users' table instead of profiles
 */
async function getVendorTimezone(
  supabase: SupabaseClient,
  vendorId: string
): Promise<string> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('timezone')
      .eq('id', vendorId)
      .single();
    
    if (error || !user) {
      log.info(`No timezone for vendor ${vendorId}, using default`);
      return DEFAULT_TIMEZONE;
    }
    
    const tz = (user as { timezone?: string }).timezone;
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

    const supabase = getSupabaseClient('admin');

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
        
        const { data, error } = await executeRpc(supabase, rpc, enrichedParams);
        
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
    const { data, error } = await executeRpc(supabase, rpc, params || {});

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
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
