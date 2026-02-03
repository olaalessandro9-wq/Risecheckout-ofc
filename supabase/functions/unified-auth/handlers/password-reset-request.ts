/**
 * Password Reset Request Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles password reset email requests using users table as SSOT.
 * Uses only the unified users table - zero legacy fallbacks.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { errorResponse, successResponse } from "../../_shared/response-helpers.ts";
import { rateLimitMiddleware, getClientIP, RATE_LIMIT_CONFIGS } from "../../_shared/rate-limiting/index.ts";
import { sendEmail } from "../../_shared/zeptomail.ts";
import { sanitizeEmail } from "../../_shared/sanitizer.ts";
import { RESET_TOKEN_EXPIRY_HOURS } from "../../_shared/auth-constants.ts";
import { buildSiteUrl } from "../../_shared/site-urls.ts";

// Email templates inline
function getPasswordResetEmailHtml(name: string | null, resetLink: string): string {
  const userName = name || "Usuário";
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Redefinir sua senha</h2>
      <p>Olá ${userName},</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta RiseCheckout.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Redefinir Senha</a>
      </p>
      <p style="color: #666; font-size: 14px;">Este link expira em ${RESET_TOKEN_EXPIRY_HOURS} horas.</p>
      <p style="color: #666; font-size: 14px;">Se você não solicitou esta redefinição, ignore este email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #999; font-size: 12px;">RiseCheckout - Sua plataforma de vendas</p>
    </div>
  `;
}

function getPasswordResetEmailText(name: string | null, resetLink: string): string {
  const userName = name || "Usuário";
  return `Olá ${userName},\n\nRecebemos uma solicitação para redefinir a senha da sua conta RiseCheckout.\n\nAcesse o link abaixo para criar uma nova senha:\n${resetLink}\n\nEste link expira em ${RESET_TOKEN_EXPIRY_HOURS} horas.\n\nSe você não solicitou esta redefinição, ignore este email.\n\nRiseCheckout - Sua plataforma de vendas`;
}

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

    // RISE V3: Find user in unified users table only (SSOT)
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("email", email.toLowerCase())
      .single();

    if (findError || !user) {
      log.info(`Password reset requested for unknown email: ${email}`);
      // Security: Always return success to prevent email enumeration
      return successResponse({ 
        message: "Se o email existir em nossa base, você receberá um link de recuperação."
      }, corsHeaders);
    }

    // Generate reset token with expiration
    const resetToken = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

    // Save token to users table (SSOT)
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

    // Build reset link using centralized URL builder
    const resetLink = buildSiteUrl(`/redefinir-senha?token=${resetToken}`, 'default');

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
