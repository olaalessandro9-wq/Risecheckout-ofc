/**
 * Validate Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Validates current session and returns user info.
 * 
 * ENHANCED: Auto-refresh when access token is expired but
 * refresh token is still valid. This provides seamless session
 * restoration for users returning after background/sleep.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { jsonResponse } from "../../_shared/response-helpers.ts";
import {
  getAuthenticatedUser,
  getUnifiedRefreshToken,
  unauthorizedResponse,
} from "../../_shared/unified-auth-v2.ts";
import { ACCESS_TOKEN_DURATION_MINUTES } from "../../_shared/auth-constants.ts";
import { handleRefresh } from "./refresh.ts";

const log = createLogger("UnifiedAuth:Validate");

export async function handleValidate(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(supabase, req);
    
    if (user) {
      // Access token is valid - return user info
      log.debug("Session validated", { userId: user.id });
      
      return jsonResponse({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          timezone: user.timezone,
        },
        roles: user.roles,
        activeRole: user.activeRole,
        expiresIn: ACCESS_TOKEN_DURATION_MINUTES * 60,
      }, corsHeaders);
    }
    
    // RISE V3: Access token invalid/expired - try auto-refresh
    const refreshToken = getUnifiedRefreshToken(req);
    
    if (refreshToken) {
      log.info("Access token expired, attempting auto-refresh via validate");
      
      // Delegate to refresh handler - it will set new cookies
      const refreshResponse = await handleRefresh(supabase, req, corsHeaders);
      
      // If refresh succeeded (200), the response contains the new session
      if (refreshResponse.status === 200) {
        log.info("Auto-refresh successful via validate endpoint");
        return refreshResponse;
      }
      
      log.debug("Auto-refresh failed, user needs to re-login");
    }
    
    return unauthorizedResponse(corsHeaders);
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Validate error:", msg);
    return unauthorizedResponse(corsHeaders);
  }
}
