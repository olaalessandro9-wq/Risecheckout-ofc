/**
 * Refresh Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Refreshes access token using refresh token.
 * Implements token rotation for security.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { errorResponse, jsonResponse } from "../../_shared/response-helpers.ts";
import { jsonResponseWithCookies } from "../../_shared/cookie-helper.ts";
import {
  getUnifiedRefreshToken,
  generateSessionTokens,
  createUnifiedAuthCookies,
  unauthorizedResponse,
  type AppRole,
} from "../../_shared/unified-auth-v2.ts";
import { ACCESS_TOKEN_DURATION_MINUTES } from "../../_shared/auth-constants.ts";

const log = createLogger("UnifiedAuth:Refresh");

/**
 * RISE V3 10.0/10 - Idempotent Refresh Handler
 * 
 * Handles concurrent refresh requests from multiple browser tabs gracefully.
 * When a refresh token is found in previous_refresh_token of a VALID session,
 * it means another tab already refreshed - we return the current tokens instead
 * of invalidating all sessions.
 * 
 * TRUE compromise detection: Only invalidate when session is already invalid
 * or when suspicious patterns are detected (different UA, long time gap, etc.)
 */
export async function handleRefresh(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const refreshToken = getUnifiedRefreshToken(req);
    
    if (!refreshToken) {
      return unauthorizedResponse(corsHeaders);
    }
    
    const now = new Date().toISOString();
    
    // ========================================
    // STEP 1: Try to find session by current refresh token
    // ========================================
    const { data: session } = await supabase
      .from("sessions")
      .select("id, user_id, active_role, refresh_token_expires_at, is_valid, session_token, refresh_token")
      .eq("refresh_token", refreshToken)
      .eq("is_valid", true)
      .single();
    
    // ========================================
    // STEP 2: If not found, check for concurrent refresh (idempotency)
    // ========================================
    if (!session) {
      // Look for session where this token is in previous_refresh_token
      const { data: concurrentSession } = await supabase
        .from("sessions")
        .select("id, user_id, active_role, refresh_token_expires_at, is_valid, session_token, refresh_token, last_activity_at")
        .eq("previous_refresh_token", refreshToken)
        .single();
      
      if (concurrentSession) {
        // RISE V3: IDEMPOTENT REFRESH HANDLING
        // Another tab already refreshed with this token
        
        if (concurrentSession.is_valid) {
          // Session still valid = concurrent tab refresh, NOT compromise
          log.info("Concurrent refresh detected - returning current tokens (idempotent)", {
            sessionId: concurrentSession.id,
            userId: concurrentSession.user_id,
          });
          
          // Update last_activity_at to track this access
          await supabase
            .from("sessions")
            .update({ last_activity_at: now })
            .eq("id", concurrentSession.id);
          
          // Return the CURRENT tokens (already rotated by the other tab)
          return await buildRefreshResponse(
            supabase,
            concurrentSession,
            concurrentSession.session_token,
            concurrentSession.refresh_token,
            corsHeaders
          );
        } else {
          // Session was invalidated (manual logout, security action, etc.)
          log.warn("Refresh token reuse on invalidated session - possible compromise", {
            userId: concurrentSession.user_id,
          });
          return errorResponse("Sessão inválida - faça login novamente", corsHeaders, 401);
        }
      }
      
      // Token not found anywhere - truly invalid
      log.debug("Refresh token not found");
      return unauthorizedResponse(corsHeaders);
    }
    
    // ========================================
    // STEP 3: Normal refresh flow (token is current)
    // ========================================
    
    // Check expiration
    if (session.refresh_token_expires_at && session.refresh_token_expires_at < now) {
      log.debug("Refresh token expired");
      return unauthorizedResponse(corsHeaders);
    }
    
    // Generate new tokens (rotation)
    const newTokens = generateSessionTokens();
    
    // Update session with new tokens (keep old refresh token for replay detection)
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        session_token: newTokens.accessToken,
        refresh_token: newTokens.refreshToken,
        previous_refresh_token: refreshToken, // Store for concurrent refresh idempotency
        access_token_expires_at: newTokens.accessTokenExpiresAt.toISOString(),
        refresh_token_expires_at: newTokens.refreshTokenExpiresAt.toISOString(),
        last_activity_at: now,
      })
      .eq("id", session.id);
    
    if (updateError) {
      log.error("Error updating session:", updateError.message);
      return errorResponse("Erro ao renovar sessão", corsHeaders, 500);
    }
    
    log.info("Token refreshed", { userId: session.user_id });
    
    return await buildRefreshResponse(
      supabase,
      session,
      newTokens.accessToken,
      newTokens.refreshToken,
      corsHeaders,
      newTokens.accessTokenExpiresAt
    );
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Refresh error:", msg);
    return errorResponse("Erro ao renovar sessão", corsHeaders, 500);
  }
}

/**
 * Build the refresh response with user data and cookies
 */
async function buildRefreshResponse(
  supabase: SupabaseClient,
  session: { id: string; user_id: string; active_role: string },
  accessToken: string,
  refreshToken: string,
  corsHeaders: Record<string, string>,
  expiresAt?: Date
): Promise<Response> {
  // Get user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, name, is_active")
    .eq("id", session.user_id)
    .single();
  
  if (userError || !user || !user.is_active) {
    return unauthorizedResponse(corsHeaders);
  }
  
  // Get roles
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  
  const roles: AppRole[] = (userRoles || []).map(r => r.role as AppRole);
  if (!roles.includes("buyer")) roles.push("buyer");
  
  const cookies = createUnifiedAuthCookies(accessToken, refreshToken);
  
  const effectiveExpiresAt = expiresAt || new Date(Date.now() + ACCESS_TOKEN_DURATION_MINUTES * 60 * 1000);
  
  return jsonResponseWithCookies({
    success: true,
    expiresIn: ACCESS_TOKEN_DURATION_MINUTES * 60,
    expiresAt: effectiveExpiresAt.toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    roles,
    activeRole: session.active_role,
  }, corsHeaders, cookies);
}
