/**
 * Request Refresh Handler - Server-Side Lock Coordination
 * 
 * RISE ARCHITECT PROTOCOL V3 - Session Commander Architecture
 * 
 * This handler provides atomic server-side locking for token refresh,
 * preventing race conditions when multiple browser tabs attempt refresh
 * simultaneously.
 * 
 * Flow:
 * 1. Tab sends X-Tab-Id header + refresh token
 * 2. Try to acquire lock in refresh_locks table
 * 3. If lock exists and not expired → return { status: "wait" }
 * 4. If lock acquired → execute refresh → release lock
 * 5. Return new tokens or error
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { errorResponse, jsonResponse } from "../../_shared/response-helpers.ts";
import {
  getUnifiedRefreshToken,
  unauthorizedResponse,
} from "../../_shared/unified-auth-v2.ts";
import { handleRefresh } from "./refresh.ts";

const log = createLogger("UnifiedAuth:RequestRefresh");

// Lock TTL: 30 seconds (should be enough for any refresh operation)
const LOCK_TTL_SECONDS = 30;

/**
 * Try to acquire a server-side refresh lock
 * Uses INSERT with ON CONFLICT to ensure atomicity
 */
async function tryAcquireRefreshLock(
  supabase: SupabaseClient,
  sessionId: string,
  tabId: string
): Promise<boolean> {
  const expiresAt = new Date(Date.now() + LOCK_TTL_SECONDS * 1000).toISOString();
  
  // First, cleanup any expired lock for this session
  await supabase
    .from("refresh_locks")
    .delete()
    .eq("session_id", sessionId)
    .lt("expires_at", new Date().toISOString());
  
  // Try to insert lock
  const { error } = await supabase
    .from("refresh_locks")
    .insert({
      session_id: sessionId,
      locked_by_tab: tabId,
      expires_at: expiresAt,
    });
  
  if (error) {
    // Lock already exists (not expired)
    if (error.code === "23505") { // Unique violation
      log.debug("Lock already held by another tab", { sessionId });
      return false;
    }
    log.error("Failed to acquire lock", { error: error.message });
    return false;
  }
  
  log.debug("Lock acquired", { sessionId, tabId });
  return true;
}

/**
 * Release the refresh lock
 */
async function releaseRefreshLock(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  const { error } = await supabase
    .from("refresh_locks")
    .delete()
    .eq("session_id", sessionId);
  
  if (error) {
    log.warn("Failed to release lock", { error: error.message });
  } else {
    log.debug("Lock released", { sessionId });
  }
}

/**
 * Find session by refresh token
 */
async function findSessionByRefreshToken(
  supabase: SupabaseClient,
  refreshToken: string
): Promise<{ id: string } | null> {
  // Check current refresh token
  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("refresh_token", refreshToken)
    .eq("is_valid", true)
    .single();
  
  if (session) return session;
  
  // Check previous refresh token (concurrent refresh scenario)
  const { data: concurrentSession } = await supabase
    .from("sessions")
    .select("id")
    .eq("previous_refresh_token", refreshToken)
    .eq("is_valid", true)
    .single();
  
  return concurrentSession || null;
}

/**
 * Check if lock exists and is not expired
 */
async function checkExistingLock(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ locked: boolean; lockedBy?: string }> {
  const { data: lock } = await supabase
    .from("refresh_locks")
    .select("locked_by_tab, expires_at")
    .eq("session_id", sessionId)
    .single();
  
  if (!lock) return { locked: false };
  
  const isExpired = new Date(lock.expires_at) < new Date();
  if (isExpired) return { locked: false };
  
  return { locked: true, lockedBy: lock.locked_by_tab };
}

/**
 * Handle coordinated refresh request with server-side locking
 */
export async function handleRequestRefresh(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const tabId = req.headers.get("X-Tab-Id") || `unknown_${Date.now()}`;
  const refreshToken = getUnifiedRefreshToken(req);
  
  if (!refreshToken) {
    log.debug("No refresh token provided");
    return unauthorizedResponse(corsHeaders);
  }
  
  // Find the session
  const session = await findSessionByRefreshToken(supabase, refreshToken);
  if (!session) {
    log.debug("Session not found for refresh token");
    return unauthorizedResponse(corsHeaders);
  }
  
  // Check if another tab is already refreshing
  const lockStatus = await checkExistingLock(supabase, session.id);
  if (lockStatus.locked && lockStatus.lockedBy !== tabId) {
    log.info("Lock held by another tab, returning wait", {
      sessionId: session.id,
      lockedBy: lockStatus.lockedBy,
    });
    
    return jsonResponse({
      status: "wait",
      message: "Another tab is refreshing",
      retryAfter: 2000, // 2 seconds
    }, corsHeaders);
  }
  
  // Try to acquire lock
  const lockAcquired = await tryAcquireRefreshLock(supabase, session.id, tabId);
  
  if (!lockAcquired) {
    log.info("Failed to acquire lock, returning wait", { sessionId: session.id });
    return jsonResponse({
      status: "wait",
      message: "Concurrent refresh detected",
      retryAfter: 2000,
    }, corsHeaders);
  }
  
  // Execute refresh with lock held
  try {
    log.info("Executing refresh with lock", { sessionId: session.id, tabId });
    const result = await handleRefresh(supabase, req, corsHeaders);
    
    // Release lock after successful refresh
    await releaseRefreshLock(supabase, session.id);
    
    return result;
  } catch (error) {
    // Always release lock on error
    await releaseRefreshLock(supabase, session.id);
    
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Refresh failed with lock held", { error: msg });
    return errorResponse("Erro ao renovar sessão", corsHeaders, 500);
  }
}
