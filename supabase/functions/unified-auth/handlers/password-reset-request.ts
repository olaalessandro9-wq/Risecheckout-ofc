/**
 * Password Reset Request Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles password reset email requests using users table as SSOT.
 * Replaces producer-auth/request-password-reset with unified approach.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { errorResponse, successResponse } from "../../_shared/response-helpers.ts";
import { rateLimitMiddleware, getClientIP, RATE_LIMIT_CONFIGS } from "../../_shared/rate-limiting/index.ts";
import { sendEmail } from "../../_shared/zeptomail.ts";
import { sanitizeEmail } from "../../_shared/sanitizer.ts";
import { RESET_TOKEN_EXPIRY_HOURS } from "../../_shared/auth-constants.ts";
import { getPasswordResetEmailHtml, getPasswordResetEmailText } from "../../_shared/producer-auth-helpers.ts";

const log = createLogger("UnifiedAuth:PasswordResetRequest");

interface ResetRequestBody {
  email: string;
}

/**
 * Generates a cryptographically secure reset token (64 hex chars).
 */
function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

export async function handlePasswordResetRequest(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Apply rate limiting
  const rateLimitResult = await rateLimitMiddleware(
    supabase, 
    req, 
    RATE_LIMIT_CONFIGS.PRODUCER_AUTH_RESET, 
    corsHeaders
  );
  if (rateLimitResult) {
    log.warn("Rate limit exceeded for password-reset-request");
    return rateLimitResult;
  }

  try {
    const body: ResetRequestBody = await req.json();
    const email = sanitizeEmail(body.email);

    if (!email) {
      return errorResponse("Email é obrigatório", corsHeaders, 400);
    }

    // Find user in unified users table (SSOT)
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("email", email.toLowerCase())
      .single();

    if (findError || !user) {
      log.info(`Password reset requested for unknown email: ${email}`);
      // Security: Always return success to prevent email enumeration
      // But don't actually send an email
      return successResponse({ 
        message: "Se o email existir em nossa base, você receberá um link de recuperação."
      }, corsHeaders);
    }

    // Generate reset token with expiration
    const resetToken = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

    // Save token to users table (SSOT - NOT profiles)
    const { error: updateError } = await supabase
      .from("users")
      .update({
        reset_token: resetToken,
        reset_token_expires_at: expiresAt.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      log.error("Error saving reset token:", updateError.message);
      return errorResponse("Erro ao processar solicitação", corsHeaders, 500);
    }

    // Build reset link
    const siteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://risecheckout.com";
    const resetLink = `${siteUrl}/redefinir-senha?token=${resetToken}`;

    // Send email
    const emailResult = await sendEmail({
      to: { email: user.email, name: user.name || undefined },
      subject: "Redefinir sua senha - RiseCheckout",
      type: "transactional",
      htmlBody: getPasswordResetEmailHtml(user.name, resetLink),
      textBody: getPasswordResetEmailText(user.name, resetLink),
    });

    if (!emailResult.success) {
      log.error("Error sending reset email:", emailResult.error);
      return errorResponse("Erro ao enviar email. Tente novamente.", corsHeaders, 500);
    }

    // Audit log
    const clientIP = getClientIP(req);
    const userAgent = req.headers.get("user-agent");
    
    await supabase.from("security_audit_log").insert({
      user_id: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      ip_address: clientIP,
      user_agent: userAgent,
      details: { email: user.email },
    });

    log.info(`Password reset email sent to: ${email}`);
    
    return successResponse({ 
      message: "Email enviado com instruções para redefinir sua senha."
    }, corsHeaders);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Password reset request error:", msg);
    return errorResponse("Erro ao processar solicitação", corsHeaders, 500);
  }
}
