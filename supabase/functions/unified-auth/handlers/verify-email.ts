/**
 * Verify Email Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Validates the email verification token and activates the user account.
 * Token is single-use (cleared after verification).
 * 
 * @module unified-auth/verify-email
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";

const log = createLogger("UnifiedAuth:VerifyEmail");

interface VerifyEmailRequest {
  token: string;
}

export async function handleVerifyEmail(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: VerifyEmailRequest = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return errorResponse("Token de verificação é obrigatório", corsHeaders, 400);
    }

    // Find user with this verification token
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, email, email_verified, account_status, email_verification_token_expires_at")
      .eq("email_verification_token", token)
      .single();

    if (findError || !user) {
      log.warn("Invalid verification token attempted");
      return errorResponse("Token de verificação inválido ou já utilizado", corsHeaders, 400);
    }

    // Check if already verified
    if (user.email_verified === true && user.account_status === "active") {
      log.info("Email already verified", { userId: user.id });
      return jsonResponse({ success: true, alreadyVerified: true }, corsHeaders);
    }

    // Check token expiration
    if (user.email_verification_token_expires_at) {
      const expiresAt = new Date(user.email_verification_token_expires_at);
      if (expiresAt < new Date()) {
        log.warn("Expired verification token", { userId: user.id });
        return errorResponse("Token de verificação expirado. Solicite um novo link.", corsHeaders, 410);
      }
    }

    // Activate the account
    const { error: updateError } = await supabase
      .from("users")
      .update({
        email_verified: true,
        account_status: "active",
        email_verification_token: null,
        email_verification_token_expires_at: null,
      })
      .eq("id", user.id);

    if (updateError) {
      log.error("Failed to activate account:", updateError.message);
      return errorResponse("Erro ao ativar conta", corsHeaders, 500);
    }

    log.info("Email verified successfully", { userId: user.id, email: user.email });

    return jsonResponse({ success: true }, corsHeaders);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Verify email error:", msg);
    return errorResponse("Erro ao processar verificação", corsHeaders, 500);
  }
}