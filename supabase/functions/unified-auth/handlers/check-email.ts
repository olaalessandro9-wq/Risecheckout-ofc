/**
 * Check Email Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Checks if email exists in unified users table and
 * returns status for frontend password flow decisions.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";
import { AccountStatus } from "../../_shared/auth-constants.ts";

const log = createLogger("UnifiedAuth:CheckEmail");

interface CheckEmailRequest {
  email: string;
}

interface CheckEmailResponse {
  exists: boolean;
  needsPasswordSetup: boolean;
  accountStatus?: string;
}

export async function handleCheckEmail(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: CheckEmailRequest = await req.json();
    const { email } = body;
    
    if (!email) {
      return errorResponse("Email é obrigatório", corsHeaders, 400);
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check in unified users table
    const { data: user, error } = await supabase
      .from("users")
      .select("id, account_status, password_hash, is_active")
      .eq("email", normalizedEmail)
      .single();
    
    if (error || !user) {
      log.debug("User not found:", normalizedEmail);
      const response: CheckEmailResponse = {
        exists: false,
        needsPasswordSetup: false,
      };
      return jsonResponse(response, corsHeaders);
    }
    
    // Determine if password setup is needed
    const needsPasswordSetup = 
      user.account_status === AccountStatus.PENDING_SETUP ||
      user.account_status === AccountStatus.RESET_REQUIRED ||
      !user.password_hash;
    
    log.debug("Email check result", { 
      email: normalizedEmail, 
      exists: true, 
      needsPasswordSetup,
      status: user.account_status,
    });
    
    const response: CheckEmailResponse = {
      exists: true,
      needsPasswordSetup,
      accountStatus: user.account_status,
    };
    return jsonResponse(response, corsHeaders);
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Check email error:", msg);
    return errorResponse("Erro ao verificar email", corsHeaders, 500);
  }
}
