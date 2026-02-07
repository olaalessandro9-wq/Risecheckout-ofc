/**
 * MFA Status Handler
 * 
 * Returns whether the authenticated user has MFA enabled.
 * Used by the profile page to display the correct MFA state.
 * 
 * @module unified-auth/handlers/mfa-status
 * @version 1.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { errorResponse, jsonResponse } from "../../_shared/response-helpers.ts";
import { requireAuthenticatedUser } from "../../_shared/unified-auth-v2.ts";

const log = createLogger("UnifiedAuth:MFA-Status");

export async function handleMfaStatus(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const user = await requireAuthenticatedUser(supabase, req);

    const { data: mfaRecord } = await supabase
      .from("user_mfa")
      .select("is_enabled")
      .eq("user_id", user.id)
      .single();

    return jsonResponse(
      {
        mfaEnabled: mfaRecord?.is_enabled ?? false,
      },
      corsHeaders
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg === "Usuário não autenticado") {
      return errorResponse(msg, corsHeaders, 401);
    }

    log.error("MFA status check error:", msg);
    return errorResponse("Erro ao verificar status MFA", corsHeaders, 500);
  }
}
