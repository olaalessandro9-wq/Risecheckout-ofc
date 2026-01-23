/**
 * ============================================================================
 * Session Manager - Edge Function (UNIFIED)
 * ============================================================================
 * 
 * RISE Protocol V3 - Uses unified `sessions` table
 * 
 * Gerencia sessões de usuários:
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
 * - Cookie: __Host-rise_access=...
 * 
 * ============================================================================
 * @version 2.0.0 - RISE Protocol V3 (Unified Sessions Table)
 * ============================================================================
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";
import { getUnifiedAccessToken } from "../_shared/unified-auth-v2.ts";
import {
  listSessionsUnified,
  revokeSessionUnified,
  revokeAllSessionsUnified,
  revokeOtherSessionsUnified,
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
}

// ============================================================================
// AUTH HELPER
// ============================================================================

async function authenticateRequest(
  req: Request,
  supabase: SupabaseClientAny
): Promise<AuthResult | null> {
  const token = getUnifiedAccessToken(req);
  if (!token) {
    return null;
  }

  // Check unified sessions table
  const { data: session } = await supabase
    .from("sessions")
    .select("id, user_id, is_valid, access_token_expires_at")
    .eq("session_token", token)
    .eq("is_valid", true)
    .single();

  if (!session) {
    return null;
  }

  // Check expiration
  if (session.access_token_expires_at && new Date(session.access_token_expires_at) < new Date()) {
    return null;
  }

  return {
    userId: session.user_id,
    sessionId: session.id,
  };
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

    log.info(`Action: ${action}, User: ${auth.userId}`);

    let result;

    switch (action) {
      case "list":
        result = await listSessionsUnified(supabase, auth.userId, auth.sessionId);
        break;

      case "revoke":
        if (!("sessionId" in body) || !body.sessionId) {
          return new Response(
            JSON.stringify({ success: false, error: "sessionId is required", code: "MISSING_SESSION_ID" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = await revokeSessionUnified(supabase, auth.userId, body.sessionId, auth.sessionId);
        break;

      case "revoke-all":
        result = await revokeAllSessionsUnified(supabase, auth.userId);
        break;

      case "revoke-others":
        result = await revokeOtherSessionsUnified(supabase, auth.userId, auth.sessionId);
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
