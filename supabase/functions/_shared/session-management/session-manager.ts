/**
 * ============================================================================
 * Session Manager - Core Session Operations (UNIFIED)
 * ============================================================================
 * 
 * RISE Protocol V3 - Uses unified `sessions` table
 * 
 * Provides core session management operations:
 * - List active sessions
 * - Revoke specific session
 * - Revoke all sessions (global logout)
 * - Revoke other sessions (keep current)
 * 
 * @version 2.0.0 - RISE Protocol V3 (Unified Sessions Table)
 * ============================================================================
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseUserAgent } from "./device-parser.ts";
import type {
  SessionInfo,
  ListSessionsResponse,
  RevokeSessionResponse,
  RevokeAllResponse,
  RevokeOthersResponse,
  ErrorResponse,
} from "./types.ts";

// deno-lint-ignore no-explicit-any
type SupabaseClientAny = SupabaseClient<any, any, any>;

// ============================================================================
// UNIFIED SESSION ROW
// ============================================================================

interface UnifiedSessionRow {
  id: string;
  user_id: string;
  session_token: string;
  refresh_token: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
  last_activity_at: string | null;
  is_valid: boolean;
  active_role: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapRowToSessionInfo(
  row: UnifiedSessionRow,
  currentSessionId: string | null
): SessionInfo {
  return {
    id: row.id,
    createdAt: row.created_at,
    lastActivityAt: row.last_activity_at,
    expiresAt: row.expires_at,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    isCurrent: row.id === currentSessionId,
    device: parseUserAgent(row.user_agent),
  };
}

// ============================================================================
// LIST SESSIONS (UNIFIED)
// ============================================================================

export async function listSessionsUnified(
  supabase: SupabaseClientAny,
  userId: string,
  currentSessionId: string | null
): Promise<ListSessionsResponse | ErrorResponse> {
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id, user_id, session_token, refresh_token, ip_address, user_agent, created_at, expires_at, last_activity_at, is_valid, active_role")
    .eq("user_id", userId)
    .eq("is_valid", true)
    .gt("expires_at", new Date().toISOString())
    .order("last_activity_at", { ascending: false, nullsFirst: false }) as {
      data: UnifiedSessionRow[] | null;
      error: Error | null;
    };

  if (error) {
    return {
      success: false,
      error: error.message,
      code: "DB_ERROR",
    };
  }

  const sessionInfos = (sessions || []).map((row) =>
    mapRowToSessionInfo(row, currentSessionId)
  );

  return {
    success: true,
    sessions: sessionInfos,
    totalActive: sessionInfos.length,
  };
}

// ============================================================================
// REVOKE SINGLE SESSION (UNIFIED)
// ============================================================================

export async function revokeSessionUnified(
  supabase: SupabaseClientAny,
  userId: string,
  sessionId: string,
  currentSessionId: string | null
): Promise<RevokeSessionResponse | ErrorResponse> {
  // Prevent revoking current session through this endpoint
  if (sessionId === currentSessionId) {
    return {
      success: false,
      error: "Cannot revoke current session. Use logout instead.",
      code: "CANNOT_REVOKE_CURRENT",
    };
  }

  // Verify session belongs to user
  const { data: session, error: fetchError } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !session) {
    return {
      success: false,
      error: "Session not found or access denied",
      code: "SESSION_NOT_FOUND",
    };
  }

  // Revoke session
  const { error: updateError } = await supabase
    .from("sessions")
    .update({ is_valid: false })
    .eq("id", sessionId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
      code: "DB_ERROR",
    };
  }

  return {
    success: true,
    revokedSessionId: sessionId,
    message: "Session revoked successfully",
  };
}

// ============================================================================
// REVOKE ALL SESSIONS (GLOBAL LOGOUT) (UNIFIED)
// ============================================================================

export async function revokeAllSessionsUnified(
  supabase: SupabaseClientAny,
  userId: string
): Promise<RevokeAllResponse | ErrorResponse> {
  // Count active sessions first
  const { count, error: countError } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_valid", true);

  if (countError) {
    return {
      success: false,
      error: countError.message,
      code: "DB_ERROR",
    };
  }

  // Revoke all sessions
  const { error: updateError } = await supabase
    .from("sessions")
    .update({ is_valid: false })
    .eq("user_id", userId)
    .eq("is_valid", true);

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
      code: "DB_ERROR",
    };
  }

  return {
    success: true,
    revokedCount: count || 0,
    message: `Successfully logged out from all ${count || 0} devices`,
  };
}

// ============================================================================
// REVOKE OTHER SESSIONS (KEEP CURRENT) (UNIFIED)
// ============================================================================

export async function revokeOtherSessionsUnified(
  supabase: SupabaseClientAny,
  userId: string,
  currentSessionId: string
): Promise<RevokeOthersResponse | ErrorResponse> {
  if (!currentSessionId) {
    return {
      success: false,
      error: "Current session ID is required",
      code: "MISSING_CURRENT_SESSION",
    };
  }

  // Count other active sessions
  const { count, error: countError } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_valid", true)
    .neq("id", currentSessionId);

  if (countError) {
    return {
      success: false,
      error: countError.message,
      code: "DB_ERROR",
    };
  }

  // Revoke all sessions except current
  const { error: updateError } = await supabase
    .from("sessions")
    .update({ is_valid: false })
    .eq("user_id", userId)
    .eq("is_valid", true)
    .neq("id", currentSessionId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
      code: "DB_ERROR",
    };
  }

  return {
    success: true,
    revokedCount: count || 0,
    currentSessionKept: currentSessionId,
    message: count === 0
      ? "No other sessions to revoke"
      : `Successfully logged out from ${count} other devices`,
  };
}
