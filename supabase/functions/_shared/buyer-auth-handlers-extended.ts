/**
 * Buyer Auth Handlers - Extended
 * 
 * Handlers adicionais para password reset e producer login
 * Separado para manter arquivos < 300 linhas
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

import { 
  sanitizeEmail 
} from "./sanitizer.ts";

import { 
  logSecurityEvent, 
  SecurityAction 
} from "./audit-logger.ts";

import { sendEmail } from "./zeptomail.ts";

import {
  CURRENT_HASH_VERSION,
  SESSION_DURATION_DAYS,
  RESET_TOKEN_EXPIRY_HOURS,
} from "./buyer-auth-types.ts";

import {
  hashPassword,
  generateSessionToken,
  generateResetToken,
} from "./buyer-auth-handlers.ts";

function jsonResponse(data: unknown, status = 200, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

// ============================================
// REQUEST-PASSWORD-RESET HANDLER
// ============================================
export async function handleRequestPasswordReset(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Usar BUYER_AUTH_REGISTER para password reset (similar rate limit)
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

  // Retornar sucesso mesmo se não encontrar (segurança)
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
    .update({
      reset_token: resetToken,
      reset_token_expires_at: expiresAt.toISOString(),
    })
    .eq("id", buyer.id);

  if (updateError) {
    console.error("[buyer-auth] Error setting reset token:", updateError);
    return jsonResponse({ error: "Erro ao processar solicitação" }, 500, corsHeaders);
  }

  // Construir URL de reset
  const resetLink = `${Deno.env.get("APP_URL") || "https://risecheckout.lovable.app"}/buyer/reset-password?token=${resetToken}`;

  // Enviar email
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

// ============================================
// CHECK-PRODUCER-BUYER HANDLER
// ============================================
export async function handleCheckProducerBuyer(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { email, producerUserId } = await req.json();

  if (!email) {
    return jsonResponse({ error: "Email é obrigatório" }, 400, corsHeaders);
  }

  let hasOwnProducts = false;
  if (producerUserId) {
    const { data: ownProducts } = await supabase
      .from("products")
      .select("id")
      .eq("user_id", producerUserId)
      .eq("members_area_enabled", true)
      .limit(1);
    hasOwnProducts = !!(ownProducts && ownProducts.length > 0);
  }

  const { data: buyer } = await supabase
    .from("buyer_profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (!buyer && !hasOwnProducts) {
    console.log(`[buyer-auth] No buyer profile or own products for producer: ${email}`);
    return jsonResponse({ hasBuyerProfile: false, hasOwnProducts: false }, 200, corsHeaders);
  }

  let hasActiveAccess = false;
  if (buyer) {
    const { data: access } = await supabase
      .from("buyer_product_access")
      .select("id")
      .eq("buyer_id", buyer.id)
      .eq("is_active", true)
      .limit(1);
    hasActiveAccess = !!(access && access.length > 0);
  }

  const shouldShowStudentPanel = hasActiveAccess || hasOwnProducts;

  console.log(`[buyer-auth] Producer buyer check: ${email}, hasAccess: ${hasActiveAccess}, hasOwnProducts: ${hasOwnProducts}`);
  return jsonResponse({
    hasBuyerProfile: shouldShowStudentPanel,
    hasOwnProducts,
    buyerId: buyer?.id || null,
  }, 200, corsHeaders);
}

// ============================================
// ENSURE-PRODUCER-ACCESS HANDLER
// ============================================
export async function handleEnsureProducerAccess(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { email, productId, producerUserId } = await req.json();

  if (!email || !productId) {
    return jsonResponse({ error: "Email e productId são obrigatórios" }, 400, corsHeaders);
  }

  try {
    let { data: buyer } = await supabase
      .from("buyer_profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (!buyer) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", producerUserId)
        .single();

      const { data: newBuyer, error: createError } = await supabase
        .from("buyer_profiles")
        .insert({
          email: email.toLowerCase(),
          password_hash: "OWNER_NO_PASSWORD",
          password_hash_version: 2,
          name: profile?.name || null,
          is_active: true,
        })
        .select("id")
        .single();

      if (createError) {
        console.error("[buyer-auth] Error creating producer buyer profile:", createError);
        throw createError;
      }
      buyer = newBuyer;
      console.log(`[buyer-auth] Created buyer profile for producer: ${email}`);
    }

    console.log(`[buyer-auth] Producer ${email} has access via product ownership, no buyer_product_access needed`);

    return jsonResponse({ success: true, buyerId: buyer.id }, 200, corsHeaders);
  } catch (error) {
    console.error("[buyer-auth] Error ensuring producer access:", error);
    return jsonResponse({ error: "Erro ao criar acesso do produtor" }, 500, corsHeaders);
  }
}

// ============================================
// PRODUCER-LOGIN HANDLER
// ============================================
export async function handleProducerLogin(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { email } = await req.json();

  if (!email) {
    return jsonResponse({ error: "Email é obrigatório" }, 400, corsHeaders);
  }

  const { data: buyer, error: findError } = await supabase
    .from("buyer_profiles")
    .select("id, email, name, is_active")
    .eq("email", email.toLowerCase())
    .single();

  if (findError || !buyer) {
    console.log(`[buyer-auth] Producer login failed - buyer not found: ${email}`);
    return jsonResponse({ error: "Perfil de comprador não encontrado" }, 404, corsHeaders);
  }

  if (!buyer.is_active) {
    return jsonResponse({ error: "Conta desativada" }, 403, corsHeaders);
  }

  const sessionToken = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const { error: sessionError } = await supabase
    .from("buyer_sessions")
    .insert({
      buyer_id: buyer.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      ip_address: req.headers.get("x-forwarded-for") || null,
      user_agent: req.headers.get("user-agent") || null,
    });

  if (sessionError) {
    console.error("[buyer-auth] Error creating producer session:", sessionError);
    return jsonResponse({ error: "Erro ao criar sessão" }, 500, corsHeaders);
  }

  await supabase
    .from("buyer_profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", buyer.id);

  console.log(`[buyer-auth] Producer login successful: ${email}`);
  return jsonResponse({
    success: true,
    sessionToken,
    expiresAt: expiresAt.toISOString(),
    buyer: { id: buyer.id, email: buyer.email, name: buyer.name },
  }, 200, corsHeaders);
}

// ============================================
// EMAIL TEMPLATES
// ============================================
function generateResetEmailHtml(name: string | null, resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0b; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #141416; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); width: 50px; height: 50px; border-radius: 12px; line-height: 50px; color: white; font-weight: bold; font-size: 24px;">R</div>
                  <h1 style="color: white; margin: 20px 0 0 0; font-size: 24px; font-weight: 600;">RiseCheckout</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px;">
                  <h2 style="color: white; margin: 0 0 20px 0; font-size: 20px;">Olá${name ? `, ${name}` : ''}!</h2>
                  <p style="color: #94a3b8; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                    Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                          Redefinir Senha
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #64748b; margin: 20px 0; font-size: 14px;">
                    Este link expira em <strong style="color: #94a3b8;">1 hora</strong>.
                  </p>
                  <p style="color: #64748b; margin: 20px 0 0 0; font-size: 14px;">
                    Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá a mesma.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 40px 40px; border-top: 1px solid rgba(255,255,255,0.1);">
                  <p style="color: #64748b; margin: 0; font-size: 12px; text-align: center;">
                    © 2025 RiseCheckout Inc. Todos os direitos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function generateResetEmailText(name: string | null, resetLink: string): string {
  return `
Olá${name ? `, ${name}` : ''}!

Recebemos uma solicitação para redefinir sua senha.

Clique no link abaixo para criar uma nova senha:
${resetLink}

Este link expira em 1 hora.

Se você não solicitou esta alteração, ignore este email.

Atenciosamente,
Equipe RiseCheckout
  `;
}
