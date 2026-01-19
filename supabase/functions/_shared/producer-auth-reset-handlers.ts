/**
 * Producer Auth Reset Handlers
 * 
 * Password reset handlers for producer-auth edge function.
 * 
 * RISE Protocol Compliant - Zero `any`
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimitMiddleware, getClientIP } from "./rate-limiting/index.ts";
import { validatePassword, formatPasswordError } from "./password-policy.ts";
import { sanitizeEmail } from "./sanitizer.ts";
import { sendEmail } from "./zeptomail.ts";
import {
  CURRENT_HASH_VERSION,
  hashPassword,
  generateResetToken,
  logAuditEvent,
  getPasswordResetEmailHtml,
  getPasswordResetEmailText,
  jsonResponse,
  errorResponse,
} from "./producer-auth-helpers.ts";
import { createLogger } from "./logger.ts";

const log = createLogger("ProducerAuthReset");

// ============================================
// INTERNAL TYPES
// ============================================

interface ProducerForReset {
  id: string;
  email: string;
  name: string | null;
}

interface ProducerWithToken {
  id: string;
  email: string;
  reset_token_expires_at: string | null;
}

// Rate limit config for password reset
const PASSWORD_RESET_RATE_LIMIT = {
  action: "producer_password_reset",
  maxAttempts: 3,
  windowMinutes: 60,
  blockDurationMinutes: 60,
};

// ============================================
// REQUEST PASSWORD RESET
// ============================================

export async function handleRequestPasswordReset(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const rateLimitResult = await rateLimitMiddleware(supabase, req, PASSWORD_RESET_RATE_LIMIT, corsHeaders);
  if (rateLimitResult) {
    log.warn("Rate limit exceeded for password-reset");
    return rateLimitResult;
  }

  const rawBody = await req.json();
  const email = sanitizeEmail(rawBody.email);
  const clientIP = getClientIP(req);
  const userAgent = req.headers.get("user-agent");

  if (!email) {
    return errorResponse("Email é obrigatório", corsHeaders, 400);
  }

  const { data: producer, error: findError } = await supabase
    .from("profiles")
    .select("id, email, name")
    .eq("email", email.toLowerCase())
    .single() as { data: ProducerForReset | null; error: unknown };

  if (findError || !producer) {
    log.info(`Password reset for unknown email: ${email}`);
    return errorResponse("E-mail não encontrado na base de dados", corsHeaders, 404);
  }

  const resetToken = generateResetToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  const { error: updateError } = await supabase.from("profiles").update({
    reset_token: resetToken,
    reset_token_expires_at: expiresAt.toISOString(),
  }).eq("id", producer.id);

  if (updateError) {
    log.error("Error saving reset token", updateError);
    return errorResponse("Erro ao processar solicitação", corsHeaders, 500);
  }

  const siteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://risecheckout.com";
  const resetLink = `${siteUrl}/redefinir-senha?token=${resetToken}`;

  const emailResult = await sendEmail({
    to: { email: producer.email, name: producer.name || undefined },
    subject: "Redefinir sua senha - RiseCheckout",
    type: "transactional",
    htmlBody: getPasswordResetEmailHtml(producer.name, resetLink),
    textBody: getPasswordResetEmailText(producer.name, resetLink),
  });

  if (!emailResult.success) {
    log.error("Error sending reset email", emailResult.error);
    return errorResponse("Erro ao enviar email. Tente novamente.", corsHeaders, 500);
  }

  await logAuditEvent(supabase, producer.id, "PASSWORD_RESET_REQUESTED", true, clientIP, userAgent, { email });

  log.info(`Password reset email sent to: ${email}`);
  return jsonResponse({ success: true, message: "Email enviado" }, corsHeaders);
}

// ============================================
// VERIFY RESET TOKEN
// ============================================

export async function handleVerifyResetToken(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { token } = await req.json();

  if (!token) {
    return jsonResponse({ valid: false, error: "Token não fornecido" }, corsHeaders, 400);
  }

  const { data: producer, error: findError } = await supabase
    .from("profiles")
    .select("id, email, reset_token_expires_at")
    .eq("reset_token", token)
    .single() as { data: ProducerWithToken | null; error: unknown };

  if (findError || !producer) {
    return jsonResponse({ valid: false, error: "Token inválido" }, corsHeaders);
  }

  if (!producer.reset_token_expires_at || new Date(producer.reset_token_expires_at) < new Date()) {
    return jsonResponse({ valid: false, error: "Token expirado" }, corsHeaders);
  }

  return jsonResponse({ valid: true, email: producer.email }, corsHeaders);
}

// ============================================
// RESET PASSWORD
// ============================================

export async function handleResetPassword(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { token, password } = await req.json();
  const clientIP = getClientIP(req);
  const userAgent = req.headers.get("user-agent");

  if (!token || !password) {
    return errorResponse("Token e nova senha são obrigatórios", corsHeaders, 400);
  }

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

  const { data: producer, error: findError } = await supabase
    .from("profiles")
    .select("id, email, reset_token_expires_at")
    .eq("reset_token", token)
    .single() as { data: ProducerWithToken | null; error: unknown };

  if (findError || !producer) {
    return errorResponse("Token inválido", corsHeaders, 400);
  }

  if (!producer.reset_token_expires_at || new Date(producer.reset_token_expires_at) < new Date()) {
    return errorResponse("Token expirado", corsHeaders, 400);
  }

  const passwordHash = hashPassword(password);

  const { error: updateError } = await supabase.from("profiles").update({
    password_hash: passwordHash,
    password_hash_version: CURRENT_HASH_VERSION,
    reset_token: null,
    reset_token_expires_at: null,
  }).eq("id", producer.id);

  if (updateError) {
    log.error("Error resetting password", updateError);
    return errorResponse("Erro ao redefinir senha", corsHeaders, 500);
  }

  // Update Supabase Auth password
  try {
    await supabase.auth.admin.updateUserById(producer.id, { password });
  } catch (authError) {
    log.warn("Could not sync Supabase Auth password", authError);
  }

  // Invalidate all sessions
  await supabase.from("producer_sessions").update({ is_valid: false }).eq("producer_id", producer.id);

  await logAuditEvent(supabase, producer.id, "PASSWORD_RESET_SUCCESS", true, clientIP, userAgent);

  log.info(`Password reset for: ${producer.email}`);
  return jsonResponse({ success: true, message: "Senha redefinida com sucesso" }, corsHeaders);
}
