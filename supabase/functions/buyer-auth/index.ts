/**
 * buyer-auth Edge Function
 * 
 * Handles buyer authentication with bcrypt password hashing
 * Supports transparent migration from SHA-256 (v1) to bcrypt (v2)
 * 
 * SECURITY UPDATES:
 * - VULN-002: Rate limiting para login/register
 * - VULN-007: Política de senhas forte
 * - VULN-006: Sanitização de inputs
 * - Password Reset Flow with email
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { genSaltSync, hashSync, compareSync } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// Rate Limiting imports
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "../_shared/rate-limiter.ts";

// Password Policy imports
import { 
  validatePassword, 
  formatPasswordError 
} from "../_shared/password-policy.ts";

// Sanitization imports  
import { 
  sanitizeEmail, 
  sanitizeName, 
  sanitizePhone 
} from "../_shared/sanitizer.ts";

// Audit Logger for security events
import { 
  logSecurityEvent, 
  SecurityAction 
} from "../_shared/audit-logger.ts";

// Email sending
import { sendEmail } from "../_shared/zeptomail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hash versions
const HASH_VERSION_SHA256 = 1;
const HASH_VERSION_BCRYPT = 2;
const CURRENT_HASH_VERSION = HASH_VERSION_BCRYPT;
const BCRYPT_COST = 10;

// Hash password with bcrypt (current standard) - SYNC for Deno Deploy compatibility
function hashPassword(password: string): string {
  const salt = genSaltSync(BCRYPT_COST);
  return hashSync(password, salt);
}

// Legacy SHA-256 hash (for backwards compatibility)
async function hashPasswordLegacy(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = Deno.env.get("BUYER_AUTH_SALT") || "rise_checkout_salt";
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Verify password (supports both SHA-256 and bcrypt) - SYNC for Deno Deploy compatibility
async function verifyPassword(password: string, hash: string, version: number): Promise<boolean> {
  if (version === HASH_VERSION_SHA256) {
    const legacyHash = await hashPasswordLegacy(password);
    return legacyHash === hash;
  }
  return compareSync(password, hash);
}

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    console.log(`[buyer-auth] Action: ${action}`);

    // ============================================
    // REGISTER - Criar nova conta ou definir senha
    // ============================================
    if (action === "register" && req.method === "POST") {
      // Rate limit para registro
      const rateLimitResult = await rateLimitMiddleware(
        supabase, 
        req, 
        RATE_LIMIT_CONFIGS.BUYER_AUTH_REGISTER,
        corsHeaders
      );
      if (rateLimitResult) {
        console.warn(`[buyer-auth] Rate limit exceeded for register from IP: ${getClientIP(req)}`);
        return rateLimitResult;
      }

      const rawBody = await req.json();
      
      // Sanitizar inputs
      const email = sanitizeEmail(rawBody.email);
      const password = rawBody.password; // Não sanitizar senha (pode ter chars especiais)
      const name = sanitizeName(rawBody.name);
      const phone = sanitizePhone(rawBody.phone);

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email e senha são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // VULN-007: Validação de força da senha
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return new Response(
          JSON.stringify({ 
            error: formatPasswordError(passwordValidation),
            validation: {
              score: passwordValidation.score,
              errors: passwordValidation.errors,
              suggestions: passwordValidation.suggestions,
            }
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if buyer exists
      const { data: existingBuyer } = await supabase
        .from("buyer_profiles")
        .select("id, password_hash")
        .eq("email", email)
        .single();

      // Always use bcrypt for new passwords
      const passwordHash = hashPassword(password);

      if (existingBuyer) {
        // If password is pending, allow setting it
        if (existingBuyer.password_hash === "PENDING_PASSWORD_SETUP") {
          const { error: updateError } = await supabase
            .from("buyer_profiles")
            .update({ 
              password_hash: passwordHash,
              password_hash_version: CURRENT_HASH_VERSION,
              name: name || undefined,
              phone: phone || undefined,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingBuyer.id);

          if (updateError) {
            console.error("[buyer-auth] Error updating password:", updateError);
            return new Response(
              JSON.stringify({ error: "Erro ao definir senha" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          console.log(`[buyer-auth] Password set with bcrypt for existing buyer: ${email}`);
          return new Response(
            JSON.stringify({ success: true, message: "Senha definida com sucesso" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: "Este email já está cadastrado" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create new buyer with bcrypt hash
      const { data: newBuyer, error: createError } = await supabase
        .from("buyer_profiles")
        .insert({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          password_hash_version: CURRENT_HASH_VERSION,
          name: name || null,
          phone: phone || null,
        })
        .select("id")
        .single();

      if (createError) {
        console.error("[buyer-auth] Error creating buyer:", createError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar conta" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[buyer-auth] New buyer created with bcrypt: ${email}`);
      return new Response(
        JSON.stringify({ success: true, buyerId: newBuyer.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // LOGIN - Autenticar buyer
    // ============================================
    if (action === "login" && req.method === "POST") {
      // Rate limit para login (mais restritivo)
      const rateLimitResult = await rateLimitMiddleware(
        supabase, 
        req, 
        RATE_LIMIT_CONFIGS.BUYER_AUTH_LOGIN,
        corsHeaders
      );
      if (rateLimitResult) {
        console.warn(`[buyer-auth] Rate limit exceeded for login from IP: ${getClientIP(req)}`);
        return rateLimitResult;
      }

      const rawBody = await req.json();
      
      // Sanitizar email
      const email = sanitizeEmail(rawBody.email);
      const password = rawBody.password;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email e senha são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find buyer (include password_hash_version)
      const { data: buyer, error: findError } = await supabase
        .from("buyer_profiles")
        .select("id, email, name, password_hash, password_hash_version, is_active")
        .eq("email", email.toLowerCase())
        .single();

      if (findError || !buyer) {
        console.log(`[buyer-auth] Login failed - buyer not found: ${email}`);
        return new Response(
          JSON.stringify({ error: "Email ou senha inválidos" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!buyer.is_active) {
        return new Response(
          JSON.stringify({ error: "Conta desativada" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (buyer.password_hash === "PENDING_PASSWORD_SETUP") {
        return new Response(
          JSON.stringify({ 
            error: "Você precisa definir sua senha primeiro",
            needsPasswordSetup: true 
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify password using appropriate algorithm
      const hashVersion = buyer.password_hash_version || HASH_VERSION_SHA256;
      const isValid = await verifyPassword(password, buyer.password_hash, hashVersion);
      
      if (!isValid) {
        console.log(`[buyer-auth] Login failed - wrong password: ${email}`);
        
        // SECURITY: Log failed login attempt
        await logSecurityEvent(supabase, {
          userId: buyer.id,
          action: SecurityAction.LOGIN_FAILED,
          resource: "buyer_auth",
          success: false,
          request: req,
          metadata: { email: buyer.email, reason: "invalid_password" }
        });
        
        return new Response(
          JSON.stringify({ error: "Email ou senha inválidos" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Transparent rehash: if using legacy SHA-256, upgrade to bcrypt
      if (hashVersion === HASH_VERSION_SHA256) {
        const newHash = hashPassword(password);
        await supabase
          .from("buyer_profiles")
          .update({ 
            password_hash: newHash,
            password_hash_version: CURRENT_HASH_VERSION 
          })
          .eq("id", buyer.id);
        console.log(`[buyer-auth] Upgraded password hash to bcrypt for: ${email}`);
      }

      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

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
        console.error("[buyer-auth] Error creating session:", sessionError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar sessão" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update last login
      await supabase
        .from("buyer_profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", buyer.id);

      // SECURITY: Log successful login
      await logSecurityEvent(supabase, {
        userId: buyer.id,
        action: SecurityAction.LOGIN_SUCCESS,
        resource: "buyer_auth",
        success: true,
        request: req,
        metadata: { email: buyer.email }
      });

      console.log(`[buyer-auth] Login successful: ${email}`);
      return new Response(
        JSON.stringify({
          success: true,
          sessionToken,
          expiresAt: expiresAt.toISOString(),
          buyer: {
            id: buyer.id,
            email: buyer.email,
            name: buyer.name,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // LOGOUT - Invalidar sessão
    // ============================================
    if (action === "logout" && req.method === "POST") {
      const { sessionToken } = await req.json();

      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: "Token de sessão é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get session to retrieve buyer_id for audit log
      const { data: session } = await supabase
        .from("buyer_sessions")
        .select("buyer_id")
        .eq("session_token", sessionToken)
        .single();

      await supabase
        .from("buyer_sessions")
        .update({ is_valid: false })
        .eq("session_token", sessionToken);

      // SECURITY: Log logout event
      if (session?.buyer_id) {
        await logSecurityEvent(supabase, {
          userId: session.buyer_id,
          action: SecurityAction.LOGOUT,
          resource: "buyer_auth",
          success: true,
          request: req,
        });
      }

      console.log("[buyer-auth] Logout successful");
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // VALIDATE - Validar sessão existente
    // ============================================
    if (action === "validate" && req.method === "POST") {
      const { sessionToken } = await req.json();

      if (!sessionToken) {
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: session } = await supabase
        .from("buyer_sessions")
        .select(`
          id,
          expires_at,
          is_valid,
          buyer:buyer_id (
            id,
            email,
            name,
            is_active
          )
        `)
        .eq("session_token", sessionToken)
        .single();

      if (!session || !session.is_valid || !session.buyer) {
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const buyerData = Array.isArray(session.buyer) ? session.buyer[0] : session.buyer;

      if (!buyerData.is_active) {
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (new Date(session.expires_at) < new Date()) {
        await supabase
          .from("buyer_sessions")
          .update({ is_valid: false })
          .eq("id", session.id);

        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update last activity
      await supabase
        .from("buyer_sessions")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", session.id);

      return new Response(
        JSON.stringify({
          valid: true,
          buyer: {
            id: buyerData.id,
            email: buyerData.email,
            name: buyerData.name,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // CHECK-EMAIL - Verificar se email precisa definir senha
    // ============================================
    if (action === "check-email" && req.method === "POST") {
      const { email } = await req.json();

      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: buyer } = await supabase
        .from("buyer_profiles")
        .select("id, password_hash")
        .eq("email", email.toLowerCase())
        .single();

      if (!buyer) {
        return new Response(
          JSON.stringify({ exists: false, needsPasswordSetup: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          exists: true,
          needsPasswordSetup: buyer.password_hash === "PENDING_PASSWORD_SETUP",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // REQUEST-PASSWORD-RESET - Solicitar redefinição de senha
    // ============================================
    if (action === "request-password-reset" && req.method === "POST") {
      const rawBody = await req.json();
      const email = sanitizeEmail(rawBody.email);

      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find buyer by email
      const { data: buyer, error: findError } = await supabase
        .from("buyer_profiles")
        .select("id, email, name")
        .eq("email", email.toLowerCase())
        .single();

      if (findError || !buyer) {
        console.log(`[buyer-auth] Password reset request for unknown email: ${email}`);
        return new Response(
          JSON.stringify({ error: "E-mail não encontrado na base de dados" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate reset token
      const resetToken = generateResetToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

      // Save token to database
      const { error: updateError } = await supabase
        .from("buyer_profiles")
        .update({
          reset_token: resetToken,
          reset_token_expires_at: expiresAt.toISOString(),
        })
        .eq("id", buyer.id);

      if (updateError) {
        console.error("[buyer-auth] Error saving reset token:", updateError);
        return new Response(
          JSON.stringify({ error: "Erro ao processar solicitação" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build reset link
      const siteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://risecheckout.com";
      const resetLink = `${siteUrl}/minha-conta/redefinir-senha?token=${resetToken}`;

      // Send email
      const emailResult = await sendEmail({
        to: { email: buyer.email, name: buyer.name || undefined },
        subject: "Redefinir sua senha - RiseCheckout",
        type: "transactional",
        htmlBody: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0b; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #141416; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); width: 50px; height: 50px; border-radius: 12px; line-height: 50px; color: white; font-weight: bold; font-size: 24px;">R</div>
                        <h1 style="color: white; margin: 20px 0 0 0; font-size: 24px; font-weight: 600;">RiseCheckout</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 20px 40px;">
                        <h2 style="color: white; margin: 0 0 20px 0; font-size: 20px;">Olá${buyer.name ? `, ${buyer.name}` : ''}!</h2>
                        <p style="color: #94a3b8; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                          Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:
                        </p>
                        
                        <!-- Button -->
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
                    
                    <!-- Footer -->
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
        `,
        textBody: `
Olá${buyer.name ? `, ${buyer.name}` : ''}!

Recebemos uma solicitação para redefinir sua senha.

Clique no link abaixo para criar uma nova senha:
${resetLink}

Este link expira em 1 hora.

Se você não solicitou esta alteração, ignore este email.

Atenciosamente,
Equipe RiseCheckout
        `,
      });

      if (!emailResult.success) {
        console.error("[buyer-auth] Error sending reset email:", emailResult.error);
        return new Response(
          JSON.stringify({ error: "Erro ao enviar email. Tente novamente." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[buyer-auth] Password reset email sent to: ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: "Email enviado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // VERIFY-RESET-TOKEN - Verificar token de reset
    // ============================================
    if (action === "verify-reset-token" && req.method === "POST") {
      const { token } = await req.json();

      if (!token) {
        return new Response(
          JSON.stringify({ valid: false, error: "Token não fornecido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find buyer by reset token
      const { data: buyer, error: findError } = await supabase
        .from("buyer_profiles")
        .select("id, email, reset_token_expires_at")
        .eq("reset_token", token)
        .single();

      if (findError || !buyer) {
        console.log(`[buyer-auth] Invalid reset token: ${token.substring(0, 10)}...`);
        return new Response(
          JSON.stringify({ valid: false, error: "Link inválido ou já utilizado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if token is expired
      if (!buyer.reset_token_expires_at || new Date(buyer.reset_token_expires_at) < new Date()) {
        console.log(`[buyer-auth] Expired reset token for: ${buyer.email}`);
        return new Response(
          JSON.stringify({ valid: false, error: "Link expirado. Solicite um novo." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true, email: buyer.email }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // RESET-PASSWORD - Redefinir senha com token
    // ============================================
    if (action === "reset-password" && req.method === "POST") {
      const { token, password } = await req.json();

      if (!token || !password) {
        return new Response(
          JSON.stringify({ error: "Token e senha são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find buyer by reset token
      const { data: buyer, error: findError } = await supabase
        .from("buyer_profiles")
        .select("id, email, reset_token_expires_at")
        .eq("reset_token", token)
        .single();

      if (findError || !buyer) {
        return new Response(
          JSON.stringify({ error: "Link inválido ou já utilizado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if token is expired
      if (!buyer.reset_token_expires_at || new Date(buyer.reset_token_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "Link expirado. Solicite um novo." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return new Response(
          JSON.stringify({ 
            error: formatPasswordError(passwordValidation),
            validation: {
              score: passwordValidation.score,
              errors: passwordValidation.errors,
              suggestions: passwordValidation.suggestions,
            }
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Hash new password
      const passwordHash = hashPassword(password);

      // Update password and clear reset token
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
        return new Response(
          JSON.stringify({ error: "Erro ao redefinir senha" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log security event (using LOGIN_SUCCESS as PASSWORD_RESET may not exist)
      await logSecurityEvent(supabase, {
        userId: buyer.id,
        action: SecurityAction.LOGIN_SUCCESS,
        resource: "buyer_auth_password_reset",
        success: true,
        request: req,
        metadata: { email: buyer.email, type: "password_reset" }
      });

      console.log(`[buyer-auth] Password reset successful for: ${buyer.email}`);
      return new Response(
        JSON.stringify({ success: true, message: "Senha redefinida com sucesso" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // CHECK-PRODUCER-BUYER - Verifica se produtor tem perfil buyer ou produtos próprios
    // ============================================
    if (action === "check-producer-buyer" && req.method === "POST") {
      const { email, producerUserId } = await req.json();

      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verificar se produtor tem produtos com área de membros ativa
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

      // Check if buyer profile exists with purchases
      const { data: buyer } = await supabase
        .from("buyer_profiles")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();

      if (!buyer && !hasOwnProducts) {
        console.log(`[buyer-auth] No buyer profile or own products for producer: ${email}`);
        return new Response(
          JSON.stringify({ hasBuyerProfile: false, hasOwnProducts: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if buyer has any active product access
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
      return new Response(
        JSON.stringify({
          hasBuyerProfile: shouldShowStudentPanel,
          hasOwnProducts,
          buyerId: buyer?.id || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // ENSURE-PRODUCER-ACCESS - Cria buyer_profile e acesso para o produtor
    // ============================================
    if (action === "ensure-producer-access" && req.method === "POST") {
      const { email, productId, producerUserId } = await req.json();

      if (!email || !productId) {
        return new Response(
          JSON.stringify({ error: "Email e productId são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        // Verificar ou criar buyer_profile
        let { data: buyer } = await supabase
          .from("buyer_profiles")
          .select("id")
          .eq("email", email.toLowerCase())
          .single();

        if (!buyer) {
          // Buscar nome do produtor
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", producerUserId)
            .single();

          // Criar buyer_profile para o produtor (senha = OWNER_NO_PASSWORD)
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

        // Producer access is handled via product ownership check, no need to create buyer_product_access
        // This avoids polluting the students list and maintains clean access_type taxonomy
        console.log(`[buyer-auth] Producer ${email} has access via product ownership, no buyer_product_access needed`);

        return new Response(
          JSON.stringify({ success: true, buyerId: buyer.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("[buyer-auth] Error ensuring producer access:", error);
        return new Response(
          JSON.stringify({ error: "Erro ao criar acesso do produtor" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ============================================
    // PRODUCER-LOGIN - Login automático de produtor como buyer
    // ============================================
    if (action === "producer-login" && req.method === "POST") {
      const { email } = await req.json();

      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find buyer by email
      const { data: buyer, error: findError } = await supabase
        .from("buyer_profiles")
        .select("id, email, name, is_active")
        .eq("email", email.toLowerCase())
        .single();

      if (findError || !buyer) {
        console.log(`[buyer-auth] Producer login failed - buyer not found: ${email}`);
        return new Response(
          JSON.stringify({ error: "Perfil de comprador não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!buyer.is_active) {
        return new Response(
          JSON.stringify({ error: "Conta desativada" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create session (no password required - authenticated via producer session)
      const sessionToken = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

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
        return new Response(
          JSON.stringify({ error: "Erro ao criar sessão" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update last login
      await supabase
        .from("buyer_profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", buyer.id);

      console.log(`[buyer-auth] Producer login successful: ${email}`);
      return new Response(
        JSON.stringify({
          success: true,
          sessionToken,
          expiresAt: expiresAt.toISOString(),
          buyer: {
            id: buyer.id,
            email: buyer.email,
            name: buyer.name,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação não encontrada" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[buyer-auth] Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
