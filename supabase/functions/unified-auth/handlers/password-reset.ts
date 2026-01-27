/**
 * Password Reset Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Resets password using token. Updates users table as SSOT.
 * Invalidates all existing sessions for security.
 * No fallbacks - users table is the only source of truth.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { errorResponse, successResponse, jsonResponse } from "../../_shared/response-helpers.ts";
import { validatePassword, formatPasswordError } from "../../_shared/password-policy.ts";
import { hashPassword, invalidateAllSessions } from "../../_shared/unified-auth-v2.ts";
import { CURRENT_HASH_VERSION } from "../../_shared/auth-constants.ts";
import { getClientIP } from "../../_shared/rate-limiting/index.ts";

const log = createLogger("UnifiedAuth:PasswordReset");

interface ResetRequestBody {
  token: string;
  password: string;
}

interface UserWithToken {
  id: string;
  email: string;
  reset_token_expires_at: string | null;
}

export async function handlePasswordReset(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: ResetRequestBody = await req.json();
    const { token, password } = body;

    // Validate input
    if (!token || !password) {
      return errorResponse("Token e nova senha são obrigatórios", corsHeaders, 400);
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return jsonResponse({
        success: false,
        error: formatPasswordError(passwordValidation),
        validation: {
          score: passwordValidation.score,
          errors: passwordValidation.errors,
          suggestions: passwordValidation.suggestions,
        },
      }, corsHeaders, 400);
    }

    // Find user by reset token in unified users table (SSOT)
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, email, reset_token_expires_at")
      .eq("reset_token", token)
      .single() as { data: UserWithToken | null; error: unknown };

    // RISE V3: users is the only SSOT - no fallbacks
    if (findError || !user) {
      log.warn("Password reset attempted with invalid token");
      return errorResponse("Token inválido ou expirado", corsHeaders, 400);
    }

    // Check expiration
    if (!user.reset_token_expires_at) {
      return errorResponse("Token inválido", corsHeaders, 400);
    }

    const expiresAt = new Date(user.reset_token_expires_at);
    if (expiresAt < new Date()) {
      log.warn(`Password reset token expired for: ${user.email}`);
      return errorResponse("Token expirado. Solicite um novo link.", corsHeaders, 400);
    }

    // Hash new password (sync function)
    const passwordHash = hashPassword(password);

    // Update password in users table (SSOT) and consume token
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: passwordHash,
        password_hash_version: CURRENT_HASH_VERSION,
        account_status: "active", // Ensure account is active after reset
        reset_token: null,        // Consume token (single-use)
        reset_token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      log.error("Error updating password:", updateError.message);
      return errorResponse("Erro ao redefinir senha", corsHeaders, 500);
    }

    // Invalidate all existing sessions (security measure)
    await invalidateAllSessions(supabase, user.id);

    // Audit log
    const clientIP = getClientIP(req);
    const userAgent = req.headers.get("user-agent");
    
    await supabase.from("security_audit_log").insert({
      user_id: user.id,
      action: "PASSWORD_RESET_SUCCESS",
      ip_address: clientIP,
      user_agent: userAgent,
      details: { email: user.email },
    });

    log.info(`Password reset successful for: ${user.email}`);

    return successResponse({ 
      message: "Senha redefinida com sucesso. Você já pode fazer login." 
    }, corsHeaders);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Password reset error:", msg);
    return errorResponse("Erro ao redefinir senha", corsHeaders, 500);
  }
}
