/**
 * Logout Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Invalidates session and clears all auth cookies.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import {
  getUnifiedAccessToken,
  createLogoutResponse,
} from "../../_shared/unified-auth-v2.ts";

const log = createLogger("UnifiedAuth:Logout");

export async function handleLogout(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const token = getUnifiedAccessToken(req);
    
    if (token) {
      // Invalidate the session in database
      const { error } = await supabase
        .from("sessions")
        .update({ is_valid: false })
        .eq("session_token", token);
      
      if (error) {
        log.warn("Error invalidating session:", error.message);
        // Continue anyway - we still want to clear cookies
      } else {
        log.info("Session invalidated");
      }
    }
    
    // Return response with expired cookies
    return createLogoutResponse(corsHeaders);
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Logout error:", msg);
    // Still clear cookies even on error
    return createLogoutResponse(corsHeaders);
  }
}
