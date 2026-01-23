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
    
    // Find session by refresh token
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, user_id, active_role, refresh_token_expires_at, is_valid, previous_refresh_token")
      .eq("refresh_token", refreshToken)
      .eq("is_valid", true)
      .single();
    
    // Check for replay attack (token reuse after rotation)
    if (!session) {
      const { data: oldSession } = await supabase
        .from("sessions")
        .select("id, user_id")
        .eq("previous_refresh_token", refreshToken)
        .single();
      
      if (oldSession) {
        // Token was already used - potential theft, invalidate all sessions
        log.warn("Refresh token reuse detected - invalidating all sessions", { 
          userId: oldSession.user_id 
        });
        
        await supabase
          .from("sessions")
          .update({ is_valid: false })
          .eq("user_id", oldSession.user_id);
        
        return errorResponse("Sessão comprometida - faça login novamente", corsHeaders, 401);
      }
      
      return unauthorizedResponse(corsHeaders);
    }
    
    // Check expiration
    if (session.refresh_token_expires_at && session.refresh_token_expires_at < now) {
      log.debug("Refresh token expired");
      return unauthorizedResponse(corsHeaders);
    }
    
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
    
    // Generate new tokens (rotation)
    const newTokens = generateSessionTokens();
    
    // Update session with new tokens (keep old refresh token for replay detection)
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        session_token: newTokens.accessToken,
        refresh_token: newTokens.refreshToken,
        previous_refresh_token: refreshToken, // Store old token for replay detection
        access_token_expires_at: newTokens.accessTokenExpiresAt.toISOString(),
        refresh_token_expires_at: newTokens.refreshTokenExpiresAt.toISOString(),
        last_activity_at: now,
      })
      .eq("id", session.id);
    
    if (updateError) {
      log.error("Error updating session:", updateError.message);
      return errorResponse("Erro ao renovar sessão", corsHeaders, 500);
    }
    
    log.info("Token refreshed", { userId: user.id });
    
    const cookies = createUnifiedAuthCookies(newTokens.accessToken, newTokens.refreshToken);
    
    return jsonResponseWithCookies({
      success: true,
      expiresIn: ACCESS_TOKEN_DURATION_MINUTES * 60,
      expiresAt: newTokens.accessTokenExpiresAt.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      roles,
      activeRole: session.active_role,
    }, corsHeaders, cookies);
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Refresh error:", msg);
    return errorResponse("Erro ao renovar sessão", corsHeaders, 500);
  }
}
