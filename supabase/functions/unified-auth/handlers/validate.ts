/**
 * Validate Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Validates current session and returns user info.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { jsonResponse } from "../../_shared/response-helpers.ts";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
} from "../../_shared/unified-auth-v2.ts";
import { ACCESS_TOKEN_DURATION_MINUTES } from "../../_shared/auth-constants.ts";

const log = createLogger("UnifiedAuth:Validate");

export async function handleValidate(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(supabase, req);
    
    if (!user) {
      return unauthorizedResponse(corsHeaders);
    }
    
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
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Validate error:", msg);
    return unauthorizedResponse(corsHeaders);
  }
}
