/**
 * Buyer Auth Handlers - Extended
 * 
 * Handlers para password reset e validação
 * Separado para manter arquivos < 300 linhas
 * 
 * @refactored 2026-01-13 - Usa buyer-auth-password.ts para password utilities
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "./rate-limiter.ts";

import { 
  validatePassword, 
  formatPasswordError 
} from "./password-policy.ts";

import { sanitizeEmail } from "./sanitizer.ts";
import { logSecurityEvent, SecurityAction } from "./audit-logger.ts";
import { sendEmail } from "./zeptomail.ts";
import { CURRENT_HASH_VERSION, RESET_TOKEN_EXPIRY_HOURS } from "./buyer-auth-types.ts";
import { hashPassword, generateResetToken, jsonResponse } from "./buyer-auth-password.ts";
import { generateResetEmailHtml, generateResetEmailText } from "./buyer-auth-email-templates.ts";

// ============================================
// VALIDATE HANDLER
// ============================================
export async function handleValidate(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { sessionToken } = await req.json();

  if (!sessionToken) {
    return jsonResponse({ valid: false }, 200, corsHeaders);
  }

  const { data: session } = await supabase
    .from("buyer_sessions")
    .select(`
      id, expires_at, is_valid,
      buyer:buyer_id (id, email, name, is_active)
    `)
    .eq("session_token", sessionToken)
    .single();

  if (!session || !session.is_valid || !session.buyer) {
    return jsonResponse({ valid: false }, 200, corsHeaders);
  }

  const buyerData = Array.isArray(session.buyer) ? session.buyer[0] : session.buyer;

  if (!buyerData.is_active) {
    return jsonResponse({ valid: false }, 200, corsHeaders);
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("buyer_sessions").update({ is_valid: false }).eq("id", session.id);
    return jsonResponse({ valid: false }, 200, corsHeaders);
  }

  await supabase.from("buyer_sessions")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", session.id);

  return jsonResponse({
    valid: true,
    buyer: { id: buyerData.id, email: buyerData.email, name: buyerData.name },
  }, 200, corsHeaders);
}

// ============================================
// CHECK-EMAIL HANDLER
// ============================================
export async function handleCheckEmail(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { email } = await req.json();

  if (!email) {
    return jsonResponse({ error: "Email é obrigatório" }, 400, corsHeaders);
  }

  const { data: buyer } = await supabase
    .from("buyer_profiles")
    .select("id, password_hash")
    .eq("email", email.toLowerCase())
    .single();

  if (!buyer) {
    return jsonResponse({ exists: false, needsPasswordSetup: false }, 200, corsHeaders);
  }

  const needsPasswordSetup = buyer.password_hash === "PENDING_PASSWORD_SETUP";
  return jsonResponse({ exists: true, needsPasswordSetup, buyerId: buyer.id }, 200, corsHeaders);
}

// ============================================
// REQUEST-PASSWORD-RESET HANDLER
// ============================================
export async function handleRequestPasswordReset(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const rateLimitResult = await rateLimitMiddleware(
    supabase, req, RATE_LIMIT_CONFIGS.BUYER_AUTH_REGISTER, corsHeaders
  );
  if (rateLimitResult) {
    console.warn(`[buyer-auth] Rate limit exceeded for password reset from IP: ${getClientIP(req)}`);
    return rateLimitResult;
  }

  const rawBody = await req.json();
  const email = sanitizeEmail(rawBody.email);

  if (!email) {
    return jsonResponse({ error: "Email é obrigatório" }, 400, corsHeaders);
  }

  const { data: buyer, error: findError } = await supabase
    .from("buyer_profiles")
    .select("id, email, name, password_hash")
    .eq("email", email.toLowerCase())
    .single();

  if (findError || !buyer) {
    console.log(`[buyer-auth] Password reset requested for non-existent email: ${email}`);
    return jsonResponse({ success: true, message: "Se o email existir, você receberá instruções" }, 200, corsHeaders);
  }

  if (buyer.password_hash === "PENDING_PASSWORD_SETUP") {
    return jsonResponse({ 
      error: "Você ainda não definiu uma senha. Use o link de configuração enviado por email." 
    }, 400, corsHeaders);
  }

  const resetToken = generateResetToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

  const { error: updateError } = await supabase
    .from("buyer_profiles")
    .update({ reset_token: resetToken, reset_token_expires_at: expiresAt.toISOString() })
    .eq("id", buyer.id);

  if (updateError) {
    console.error("[buyer-auth] Error setting reset token:", updateError);
    return jsonResponse({ error: "Erro ao processar solicitação" }, 500, corsHeaders);
  }

  const resetLink = `${Deno.env.get("APP_URL") || "https://risecheckout.lovable.app"}/buyer/reset-password?token=${resetToken}`;

  const emailResult = await sendEmail({
    to: buyer.email,
    subject: "Redefinição de Senha - RiseCheckout",
    htmlBody: generateResetEmailHtml(buyer.name, resetLink),
    textBody: generateResetEmailText(buyer.name, resetLink),
  });

  if (!emailResult.success) {
    console.error("[buyer-auth] Error sending reset email:", emailResult.error);
    return jsonResponse({ error: "Erro ao enviar email. Tente novamente." }, 500, corsHeaders);
  }

  console.log(`[buyer-auth] Password reset email sent to: ${email}`);
  return jsonResponse({ success: true, message: "Email enviado" }, 200, corsHeaders);
}

// ============================================
// VERIFY-RESET-TOKEN HANDLER
// ============================================
export async function handleVerifyResetToken(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { token } = await req.json();

  if (!token) {
    return jsonResponse({ valid: false, error: "Token não fornecido" }, 400, corsHeaders);
  }

  const { data: buyer, error: findError } = await supabase
    .from("buyer_profiles")
    .select("id, email, reset_token_expires_at")
    .eq("reset_token", token)
    .single();

  if (findError || !buyer) {
    console.log(`[buyer-auth] Invalid reset token: ${token.substring(0, 10)}...`);
    return jsonResponse({ valid: false, error: "Link inválido ou já utilizado" }, 400, corsHeaders);
  }

  if (!buyer.reset_token_expires_at || new Date(buyer.reset_token_expires_at) < new Date()) {
    console.log(`[buyer-auth] Expired reset token for: ${buyer.email}`);
    return jsonResponse({ valid: false, error: "Link expirado. Solicite um novo." }, 400, corsHeaders);
  }

  return jsonResponse({ valid: true, email: buyer.email }, 200, corsHeaders);
}

// ============================================
// RESET-PASSWORD HANDLER
// ============================================
export async function handleResetPassword(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { token, password } = await req.json();

  if (!token || !password) {
    return jsonResponse({ error: "Token e senha são obrigatórios" }, 400, corsHeaders);
  }

  const { data: buyer, error: findError } = await supabase
    .from("buyer_profiles")
    .select("id, email, reset_token_expires_at")
    .eq("reset_token", token)
    .single();

  if (findError || !buyer) {
    return jsonResponse({ error: "Link inválido ou já utilizado" }, 400, corsHeaders);
  }

  if (!buyer.reset_token_expires_at || new Date(buyer.reset_token_expires_at) < new Date()) {
    return jsonResponse({ error: "Link expirado. Solicite um novo." }, 400, corsHeaders);
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return jsonResponse({ 
      error: formatPasswordError(passwordValidation),
      validation: {
        score: passwordValidation.score,
        errors: passwordValidation.errors,
        suggestions: passwordValidation.suggestions,
      }
    }, 400, corsHeaders);
  }

  const passwordHash = hashPassword(password);

  const { error: updateError } = await supabase
    .from("buyer_profiles")
    .update({
      password_hash: passwordHash,
      password_hash_version: CURRENT_HASH_VERSION,
      reset_token: null,
      reset_token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", buyer.id);

  if (updateError) {
    console.error("[buyer-auth] Error updating password:", updateError);
    return jsonResponse({ error: "Erro ao redefinir senha" }, 500, corsHeaders);
  }

  await logSecurityEvent(supabase, {
    userId: buyer.id,
    action: SecurityAction.LOGIN_SUCCESS,
    resource: "buyer_auth_password_reset",
    success: true,
    request: req,
    metadata: { email: buyer.email, type: "password_reset" }
  });

  console.log(`[buyer-auth] Password reset successful for: ${buyer.email}`);
  return jsonResponse({ success: true, message: "Senha redefinida com sucesso" }, 200, corsHeaders);
}
