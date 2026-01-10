/**
 * producer-auth Edge Function
 * 
 * Handles producer authentication with bcrypt password hashing
 * Mirrors buyer-auth for consistency across the platform
 * 
 * Endpoints:
 * - POST /register - Create new producer account
 * - POST /login - Authenticate producer
 * - POST /logout - Invalidate session
 * - POST /validate - Validate existing session
 * - POST /request-password-reset - Request password reset email
 * - POST /verify-reset-token - Verify reset token validity
 * - POST /reset-password - Reset password with token
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

// Hash password with bcrypt
function hashPassword(password: string): string {
  const salt = genSaltSync(BCRYPT_COST);
  return hashSync(password, salt);
}

// Verify password (supports bcrypt)
function verifyPassword(password: string, hash: string): boolean {
  return compareSync(password, hash);
}

// Generate session token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

// Generate reset token
function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

// Log audit event
async function logAuditEvent(
  supabase: any,
  producerId: string | null,
  action: string,
  success: boolean,
  req: Request,
  details?: any
) {
  try {
    await supabase.from("producer_audit_log").insert({
      producer_id: producerId,
      action,
      success,
      ip_address: getClientIP(req),
      user_agent: req.headers.get("user-agent"),
      details,
    });
  } catch (error) {
    console.error("[producer-auth] Audit log error:", error);
  }
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

    console.log(`[producer-auth] Action: ${action}`);

    // ============================================
    // REGISTER - Create new producer account
    // ============================================
    if (action === "register" && req.method === "POST") {
      // Rate limit
      const rateLimitResult = await rateLimitMiddleware(
        supabase, 
        req, 
        RATE_LIMIT_CONFIGS.BUYER_AUTH_REGISTER // Reuse same limits
      );
      if (rateLimitResult) {
        console.warn(`[producer-auth] Rate limit exceeded for register`);
        return rateLimitResult;
      }

      const rawBody = await req.json();
      
      const email = sanitizeEmail(rawBody.email);
      const password = rawBody.password;
      const name = sanitizeName(rawBody.name);
      const phone = sanitizePhone(rawBody.phone);
      const cpfCnpj = rawBody.cpf_cnpj;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email e senha são obrigatórios" }),
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

      // Check if producer exists in profiles
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, email, password_hash")
        .eq("email", email.toLowerCase())
        .single();

      if (existingProfile) {
        // If has password, already registered
        if (existingProfile.password_hash && existingProfile.password_hash !== "PENDING_MIGRATION") {
          return new Response(
            JSON.stringify({ error: "Este email já está cadastrado" }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Existing user without password - set password (migration case)
        const passwordHash = hashPassword(password);
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ 
            password_hash: passwordHash,
            password_hash_version: CURRENT_HASH_VERSION,
            name: name || undefined,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingProfile.id);

        if (updateError) {
          console.error("[producer-auth] Error updating password:", updateError);
          return new Response(
            JSON.stringify({ error: "Erro ao definir senha" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[producer-auth] Password set for existing producer: ${email}`);
        return new Response(
          JSON.stringify({ success: true, message: "Senha definida com sucesso", producerId: existingProfile.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create new producer - first in auth.users, then in profiles
      // We still use Supabase Auth for now to maintain compatibility
      const { data: authData, error: signupError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: password,
        email_confirm: true, // Auto-confirm for now
        user_metadata: { name },
      });

      if (signupError) {
        console.error("[producer-auth] Auth signup error:", signupError);
        return new Response(
          JSON.stringify({ error: signupError.message || "Erro ao criar conta" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update profiles with password hash
      const passwordHash = hashPassword(password);
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          password_hash_version: CURRENT_HASH_VERSION,
          name: name || null,
        })
        .eq("id", authData.user.id);

      if (profileError) {
        console.error("[producer-auth] Profile update error:", profileError);
      }

      // Create vendor_profiles if cpf_cnpj provided
      if (cpfCnpj) {
        await supabase
          .from("vendor_profiles")
          .insert({
            user_id: authData.user.id,
            name: name || "",
            phone: phone || "",
            cpf_cnpj: cpfCnpj,
          });
      }

      await logAuditEvent(supabase, authData.user.id, "REGISTER", true, req, { email });

      console.log(`[producer-auth] New producer created: ${email}`);
      return new Response(
        JSON.stringify({ success: true, producerId: authData.user.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // LOGIN - Authenticate producer
    // ============================================
    if (action === "login" && req.method === "POST") {
      // Rate limit
      const rateLimitResult = await rateLimitMiddleware(
        supabase, 
        req, 
        RATE_LIMIT_CONFIGS.BUYER_AUTH_LOGIN
      );
      if (rateLimitResult) {
        console.warn(`[producer-auth] Rate limit exceeded for login`);
        return rateLimitResult;
      }

      const rawBody = await req.json();
      const email = sanitizeEmail(rawBody.email);
      const password = rawBody.password;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email e senha são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find producer by email
      const { data: producer, error: findError } = await supabase
        .from("profiles")
        .select("id, email, name, password_hash, password_hash_version, is_active")
        .eq("email", email.toLowerCase())
        .single();

      if (findError || !producer) {
        console.log(`[producer-auth] Login failed - producer not found: ${email}`);
        return new Response(
          JSON.stringify({ error: "Email ou senha inválidos" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (producer.is_active === false) {
        return new Response(
          JSON.stringify({ error: "Conta desativada" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If no custom password, try Supabase Auth and migrate
      if (!producer.password_hash || producer.password_hash === "PENDING_MIGRATION") {
        // Try Supabase Auth login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password,
        });

        if (authError || !authData.user) {
          await logAuditEvent(supabase, producer.id, "LOGIN_FAILED", false, req, { email, reason: "invalid_password" });
          return new Response(
            JSON.stringify({ error: "Email ou senha inválidos" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Migrate password to custom system
        const passwordHash = hashPassword(password);
        await supabase
          .from("profiles")
          .update({ 
            password_hash: passwordHash,
            password_hash_version: CURRENT_HASH_VERSION 
          })
          .eq("id", producer.id);
        console.log(`[producer-auth] Migrated password for: ${email}`);
      } else {
        // Verify with custom system
        const isValid = verifyPassword(password, producer.password_hash);
        
        if (!isValid) {
          console.log(`[producer-auth] Login failed - wrong password: ${email}`);
          await logAuditEvent(supabase, producer.id, "LOGIN_FAILED", false, req, { email, reason: "invalid_password" });
          return new Response(
            JSON.stringify({ error: "Email ou senha inválidos" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      const { error: sessionError } = await supabase
        .from("producer_sessions")
        .insert({
          producer_id: producer.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          ip_address: getClientIP(req),
          user_agent: req.headers.get("user-agent"),
        });

      if (sessionError) {
        console.error("[producer-auth] Session error:", sessionError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar sessão" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update last login
      await supabase
        .from("profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", producer.id);

      await logAuditEvent(supabase, producer.id, "LOGIN_SUCCESS", true, req, { email });

      console.log(`[producer-auth] Login successful: ${email}`);
      return new Response(
        JSON.stringify({
          success: true,
          sessionToken,
          expiresAt: expiresAt.toISOString(),
          producer: {
            id: producer.id,
            email: producer.email,
            name: producer.name,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // LOGOUT - Invalidate session
    // ============================================
    if (action === "logout" && req.method === "POST") {
      const { sessionToken } = await req.json();

      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: "Token de sessão é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get session to log audit
      const { data: session } = await supabase
        .from("producer_sessions")
        .select("producer_id")
        .eq("session_token", sessionToken)
        .single();

      await supabase
        .from("producer_sessions")
        .update({ is_valid: false })
        .eq("session_token", sessionToken);

      if (session?.producer_id) {
        await logAuditEvent(supabase, session.producer_id, "LOGOUT", true, req);
      }

      console.log("[producer-auth] Logout successful");
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // VALIDATE - Validate existing session
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
        .from("producer_sessions")
        .select(`
          id,
          expires_at,
          is_valid,
          producer:producer_id (
            id,
            email,
            name,
            is_active
          )
        `)
        .eq("session_token", sessionToken)
        .single();

      if (!session || !session.is_valid || !session.producer) {
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const producerData = Array.isArray(session.producer) ? session.producer[0] : session.producer;

      if (producerData.is_active === false) {
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (new Date(session.expires_at) < new Date()) {
        await supabase
          .from("producer_sessions")
          .update({ is_valid: false })
          .eq("id", session.id);

        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update last activity
      await supabase
        .from("producer_sessions")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", session.id);

      return new Response(
        JSON.stringify({
          valid: true,
          producer: {
            id: producerData.id,
            email: producerData.email,
            name: producerData.name,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // REQUEST-PASSWORD-RESET - Request reset email
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

      // Find producer by email
      const { data: producer, error: findError } = await supabase
        .from("profiles")
        .select("id, email, name")
        .eq("email", email.toLowerCase())
        .single();

      if (findError || !producer) {
        console.log(`[producer-auth] Password reset for unknown email: ${email}`);
        return new Response(
          JSON.stringify({ error: "E-mail não encontrado na base de dados" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate reset token
      const resetToken = generateResetToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

      // Save token
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          reset_token: resetToken,
          reset_token_expires_at: expiresAt.toISOString(),
        })
        .eq("id", producer.id);

      if (updateError) {
        console.error("[producer-auth] Error saving reset token:", updateError);
        return new Response(
          JSON.stringify({ error: "Erro ao processar solicitação" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build reset link
      const siteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://risecheckout.com";
      const resetLink = `${siteUrl}/redefinir-senha?token=${resetToken}`;

      // Send email via ZeptoMail
      const emailResult = await sendEmail({
        to: { email: producer.email, name: producer.name || undefined },
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
                        <h2 style="color: white; margin: 0 0 20px 0; font-size: 20px;">Olá${producer.name ? `, ${producer.name}` : ''}!</h2>
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
Olá${producer.name ? `, ${producer.name}` : ''}!

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
        console.error("[producer-auth] Error sending reset email:", emailResult.error);
        return new Response(
          JSON.stringify({ error: "Erro ao enviar email. Tente novamente." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await logAuditEvent(supabase, producer.id, "PASSWORD_RESET_REQUESTED", true, req, { email });

      console.log(`[producer-auth] Password reset email sent to: ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: "Email enviado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // VERIFY-RESET-TOKEN - Verify token validity
    // ============================================
    if (action === "verify-reset-token" && req.method === "POST") {
      const { token } = await req.json();

      if (!token) {
        return new Response(
          JSON.stringify({ valid: false, error: "Token não fornecido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find producer by reset token
      const { data: producer, error: findError } = await supabase
        .from("profiles")
        .select("id, email, reset_token_expires_at")
        .eq("reset_token", token)
        .single();

      if (findError || !producer) {
        console.log(`[producer-auth] Invalid reset token: ${token.substring(0, 10)}...`);
        return new Response(
          JSON.stringify({ valid: false, error: "Link inválido ou já utilizado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if expired
      if (!producer.reset_token_expires_at || new Date(producer.reset_token_expires_at) < new Date()) {
        console.log(`[producer-auth] Expired reset token for: ${producer.email}`);
        return new Response(
          JSON.stringify({ valid: false, error: "Link expirado. Solicite um novo." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true, email: producer.email }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // RESET-PASSWORD - Reset password with token
    // ============================================
    if (action === "reset-password" && req.method === "POST") {
      const { token, password } = await req.json();

      if (!token || !password) {
        return new Response(
          JSON.stringify({ error: "Token e senha são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find producer by reset token
      const { data: producer, error: findError } = await supabase
        .from("profiles")
        .select("id, email, reset_token_expires_at")
        .eq("reset_token", token)
        .single();

      if (findError || !producer) {
        return new Response(
          JSON.stringify({ error: "Link inválido ou já utilizado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if expired
      if (!producer.reset_token_expires_at || new Date(producer.reset_token_expires_at) < new Date()) {
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
        .from("profiles")
        .update({
          password_hash: passwordHash,
          password_hash_version: CURRENT_HASH_VERSION,
          reset_token: null,
          reset_token_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", producer.id);

      if (updateError) {
        console.error("[producer-auth] Error updating password:", updateError);
        return new Response(
          JSON.stringify({ error: "Erro ao redefinir senha" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Also update in Supabase Auth for compatibility
      try {
        await supabase.auth.admin.updateUserById(producer.id, { password });
      } catch (authError) {
        console.warn("[producer-auth] Could not update Supabase Auth password:", authError);
        // Continue anyway - custom auth is primary
      }

      await logAuditEvent(supabase, producer.id, "PASSWORD_RESET_COMPLETED", true, req, { email: producer.email });

      console.log(`[producer-auth] Password reset successful for: ${producer.email}`);
      return new Response(
        JSON.stringify({ success: true, message: "Senha redefinida com sucesso" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // Unknown action
    // ============================================
    console.log(`[producer-auth] Unknown action: ${action}`);
    return new Response(
      JSON.stringify({ error: "Ação não encontrada" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[producer-auth] Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
