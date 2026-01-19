/**
 * ============================================================================
 * Session Manager - Core Session Operations
 * ============================================================================
 * 
 * Provides core session management operations:
 * - List active sessions
 * - Revoke specific session
 * - Revoke all sessions (global logout)
 * - Revoke other sessions (keep current)
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseUserAgent } from "./device-parser.ts";
import type {
  SessionInfo,
  BuyerSessionRow,
  SessionDomain,
  ListSessionsResponse,
  RevokeSessionResponse,
  RevokeAllResponse,
  RevokeOthersResponse,
  ErrorResponse,
} from "./types.ts";

// deno-lint-ignore no-explicit-any
type SupabaseClientAny = SupabaseClient<any, any, any>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapRowToSessionInfo(
  row: BuyerSessionRow,
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

function getTableName(domain: SessionDomain): string {
  return domain === "buyer" ? "buyer_sessions" : "producer_sessions";
}

function getUserIdColumn(domain: SessionDomain): string {
  return domain === "buyer" ? "buyer_id" : "user_id";
}

// ============================================================================
// LIST SESSIONS
// ============================================================================

export async function listSessions(
  supabase: SupabaseClientAny,
  userId: string,
  currentSessionId: string | null,
  domain: SessionDomain
): Promise<ListSessionsResponse | ErrorResponse> {
  const tableName = getTableName(domain);
  const userIdColumn = getUserIdColumn(domain);

  const { data: sessions, error } = await supabase
    .from(tableName)
    .select("id, buyer_id, session_token, refresh_token, ip_address, user_agent, created_at, expires_at, last_activity_at, is_valid")
    .eq(userIdColumn, userId)
    .eq("is_valid", true)
    .gt("expires_at", new Date().toISOString())
    .order("last_activity_at", { ascending: false, nullsFirst: false }) as {
      data: BuyerSessionRow[] | null;
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
// REVOKE SINGLE SESSION
// ============================================================================

export async function revokeSession(
  supabase: SupabaseClientAny,
  userId: string,
  sessionId: string,
  currentSessionId: string | null,
  domain: SessionDomain
): Promise<RevokeSessionResponse | ErrorResponse> {
  const tableName = getTableName(domain);
  const userIdColumn = getUserIdColumn(domain);

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
    .from(tableName)
    .select("id")
    .eq("id", sessionId)
    .eq(userIdColumn, userId)
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
    .from(tableName)
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
// REVOKE ALL SESSIONS (GLOBAL LOGOUT)
// ============================================================================

export async function revokeAllSessions(
  supabase: SupabaseClientAny,
  userId: string,
  domain: SessionDomain
): Promise<RevokeAllResponse | ErrorResponse> {
  const tableName = getTableName(domain);
  const userIdColumn = getUserIdColumn(domain);

  // Count active sessions first
  const { count, error: countError } = await supabase
    .from(tableName)
    .select("id", { count: "exact", head: true })
    .eq(userIdColumn, userId)
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
    .from(tableName)
    .update({ is_valid: false })
    .eq(userIdColumn, userId)
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
// REVOKE OTHER SESSIONS (KEEP CURRENT)
// ============================================================================

export async function revokeOtherSessions(
  supabase: SupabaseClientAny,
  userId: string,
  currentSessionId: string,
  domain: SessionDomain
): Promise<RevokeOthersResponse | ErrorResponse> {
  const tableName = getTableName(domain);
  const userIdColumn = getUserIdColumn(domain);

  if (!currentSessionId) {
    return {
      success: false,
      error: "Current session ID is required",
      code: "MISSING_CURRENT_SESSION",
    };
  }

  // Count other active sessions
  const { count, error: countError } = await supabase
    .from(tableName)
    .select("id", { count: "exact", head: true })
    .eq(userIdColumn, userId)
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
    .from(tableName)
    .update({ is_valid: false })
    .eq(userIdColumn, userId)
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
