/**
 * ============================================================================
 * Session Manager - Edge Function
 * ============================================================================
 * 
 * Gerencia sessões de usuários (buyers e producers):
 * - Listar sessões ativas
 * - Revogar sessão específica
 * - Logout global (revoke all)
 * - Revogar outras sessões (keep current)
 * 
 * Endpoints:
 * - POST /session-manager { action: "list" }
 * - POST /session-manager { action: "revoke", sessionId: "..." }
 * - POST /session-manager { action: "revoke-all" }
 * - POST /session-manager { action: "revoke-others" }
 * 
 * Headers:
 * - Cookie: __Host-buyer_access=... (or __Host-producer_access=...)
 * 
 * ============================================================================
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";
import { getBuyerAccessToken, getProducerAccessToken } from "../_shared/session-reader.ts";
import {
  listSessions,
  revokeSession,
  revokeAllSessions,
  revokeOtherSessions,
  type SessionDomain,
  type SessionManagementRequest,
} from "../_shared/session-management/index.ts";

const log = createLogger("SessionManager");

// deno-lint-ignore no-explicit-any
type SupabaseClientAny = SupabaseClient<any, any, any>;

// ============================================================================
// TYPES
// ============================================================================

interface AuthResult {
  userId: string;
  sessionId: string;
  domain: SessionDomain;
}

// ============================================================================
// AUTH HELPERS
// ============================================================================

async function authenticateRequest(
  req: Request,
  supabase: SupabaseClientAny
): Promise<AuthResult | null> {
  // Try buyer token first
  const buyerToken = getBuyerAccessToken(req);
  if (buyerToken) {
    const { data: session } = await supabase
      .from("buyer_sessions")
      .select("id, buyer_id, is_valid, expires_at")
      .eq("session_token", buyerToken)
      .eq("is_valid", true)
      .single();

    if (session && new Date(session.expires_at) > new Date()) {
      return {
        userId: session.buyer_id,
        sessionId: session.id,
        domain: "buyer",
      };
    }
  }

  // Try producer token
  const producerToken = getProducerAccessToken(req);
  if (producerToken) {
    const { data: session } = await supabase
      .from("producer_sessions")
      .select("id, user_id, is_valid, expires_at")
      .eq("session_token", producerToken)
      .eq("is_valid", true)
      .single();

    if (session && new Date(session.expires_at) > new Date()) {
      return {
        userId: session.user_id,
        sessionId: session.id,
        domain: "producer",
      };
    }
  }

  return null;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase: SupabaseClientAny = createClient(supabaseUrl, serviceRoleKey);

    // Authenticate request
    const auth = await authenticateRequest(req, supabase);
    if (!auth) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: SessionManagementRequest = await req.json();
    const { action } = body;

    log.info(`Action: ${action}, Domain: ${auth.domain}, User: ${auth.userId}`);

    let result;

    switch (action) {
      case "list":
        result = await listSessions(supabase, auth.userId, auth.sessionId, auth.domain);
        break;

      case "revoke":
        if (!("sessionId" in body) || !body.sessionId) {
          return new Response(
            JSON.stringify({ success: false, error: "sessionId is required", code: "MISSING_SESSION_ID" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = await revokeSession(supabase, auth.userId, body.sessionId, auth.sessionId, auth.domain);
        break;

      case "revoke-all":
        result = await revokeAllSessions(supabase, auth.userId, auth.domain);
        break;

      case "revoke-others":
        result = await revokeOtherSessions(supabase, auth.userId, auth.sessionId, auth.domain);
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}`, code: "UNKNOWN_ACTION" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const status = result.success ? 200 : 400;
    return new Response(
      JSON.stringify(result),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    log.error(`Exception: ${errorMessage}`);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
