/**
 * Resend Verification Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Generates a new verification token and sends a new verification email.
 * Rate limited: 60 seconds between resends.
 * 
 * @module unified-auth/resend-verification
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";
import { sendEmail } from "../../_shared/zeptomail.ts";
import { getEmailVerificationTemplate, getEmailVerificationTextTemplate } from "../../_shared/email-templates-verification.ts";
import { buildSiteUrl } from "../../_shared/site-urls.ts";
import { AccountStatus } from "../../_shared/auth-constants.ts";

const log = createLogger("UnifiedAuth:ResendVerification");

/** Minimum interval between resends in milliseconds (60 seconds) */
const RESEND_COOLDOWN_MS = 60_000;

/** Verification token validity in milliseconds (24 hours) */
const TOKEN_VALIDITY_MS = 24 * 60 * 60 * 1000;

interface ResendVerificationRequest {
  email: string;
}

export async function handleResendVerification(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: ResendVerificationRequest = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return errorResponse("Email é obrigatório", corsHeaders, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user pending verification
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, name, email, account_status, email_verification_token_expires_at, updated_at")
      .eq("email", normalizedEmail)
      .single();

    if (findError || !user) {
      // Security: don't reveal if email exists
      log.debug("Resend requested for non-existent email");
      return jsonResponse({ success: true }, corsHeaders);
    }

    // Only resend for pending verification accounts
    if (user.account_status !== AccountStatus.PENDING_EMAIL_VERIFICATION) {
      log.debug("Resend requested for already active account", { userId: user.id });
      return jsonResponse({ success: true }, corsHeaders);
    }

    // Rate limit: check if last token was generated less than 60s ago
    if (user.updated_at) {
      const lastUpdate = new Date(user.updated_at).getTime();
      const now = Date.now();
      if (now - lastUpdate < RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - lastUpdate)) / 1000);
        return errorResponse(
          `Aguarde ${remainingSeconds} segundos antes de solicitar outro email`,
          corsHeaders,
          429
        );
      }
    }

    // Generate new token
    const newToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + TOKEN_VALIDITY_MS).toISOString();

    // Update user with new token
    const { error: updateError } = await supabase
      .from("users")
      .update({
        email_verification_token: newToken,
        email_verification_token_expires_at: expiresAt,
      })
      .eq("id", user.id);

    if (updateError) {
      log.error("Failed to update verification token:", updateError.message);
      return errorResponse("Erro ao gerar novo link", corsHeaders, 500);
    }

    // Build verification URL
    const verificationUrl = buildSiteUrl(`/confirmar-email?token=${newToken}`);

    // Send verification email
    const emailResult = await sendEmail({
      to: { email: normalizedEmail, name: user.name || normalizedEmail },
      subject: "Confirme seu email - Rise Checkout",
      htmlBody: getEmailVerificationTemplate({
        userName: user.name || "Usuário",
        verificationUrl,
      }),
      textBody: getEmailVerificationTextTemplate({
        userName: user.name || "Usuário",
        verificationUrl,
      }),
      type: "transactional",
      trackClicks: false,
      trackOpens: false,
    });

    if (!emailResult.success) {
      log.error("Failed to send verification email:", emailResult.error);
      return errorResponse("Erro ao enviar email de verificação", corsHeaders, 500);
    }

    log.info("Verification email resent", { userId: user.id });

    return jsonResponse({ success: true }, corsHeaders);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Resend verification error:", msg);
    return errorResponse("Erro ao processar solicitação", corsHeaders, 500);
  }
}