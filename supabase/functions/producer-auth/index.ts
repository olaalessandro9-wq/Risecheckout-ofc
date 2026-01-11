/**
 * producer-auth Edge Function
 * 
 * Handles producer authentication with bcrypt password hashing.
 * Mirrors buyer-auth for consistency across the platform.
 * 
 * RISE Protocol Compliant:
 * - Secure CORS (no wildcards)
 * - Rate limiting on all auth endpoints
 * - Extracted helpers to _shared/
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

// CORS - Secure centralized handler
import { handleCors } from "../_shared/cors.ts";

// Rate Limiting
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "../_shared/rate-limiter.ts";

// Password Policy
import { validatePassword, formatPasswordError } from "../_shared/password-policy.ts";

// Sanitization
import { sanitizeEmail, sanitizeName, sanitizePhone } from "../_shared/sanitizer.ts";

// Email sending
import { sendEmail } from "../_shared/zeptomail.ts";

// Helpers
import {
  CURRENT_HASH_VERSION,
  hashPassword,
  verifyPassword,
  generateSessionToken,
  generateResetToken,
  logAuditEvent,
  getPasswordResetEmailHtml,
  getPasswordResetEmailText,
  jsonResponse,
  errorResponse,
} from "../_shared/producer-auth-helpers.ts";

// Rate limit config for password reset (prevent email spam)
const PASSWORD_RESET_RATE_LIMIT = {
  action: "producer_password_reset",
  maxAttempts: 3,
  windowMinutes: 60, // 1 hour
  blockDurationMinutes: 60,
};

serve(async (req) => {
  // ============================================
  // CORS VALIDATION (SECURITY)
  // ============================================
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult; // Preflight or blocked origin
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();
    const clientIP = getClientIP(req);
    const userAgent = req.headers.get("user-agent");

    console.log(`[producer-auth] Action: ${action}`);

    // ============================================
    // REGISTER
    // ============================================
    if (action === "register" && req.method === "POST") {
      const rateLimitResult = await rateLimitMiddleware(supabase, req, RATE_LIMIT_CONFIGS.BUYER_AUTH_REGISTER, corsHeaders);
      if (rateLimitResult) return rateLimitResult;

      const rawBody = await req.json();
      const email = sanitizeEmail(rawBody.email);
      const password = rawBody.password;
      const name = sanitizeName(rawBody.name);
      const phone = sanitizePhone(rawBody.phone);
      const cpfCnpj = rawBody.cpf_cnpj;

      if (!email || !password) {
        return errorResponse("Email e senha são obrigatórios", corsHeaders, 400);
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return jsonResponse({
          error: formatPasswordError(passwordValidation),
          validation: {
            score: passwordValidation.score,
            errors: passwordValidation.errors,
            suggestions: passwordValidation.suggestions,
          },
        }, corsHeaders, 400);
      }

      // Check existing profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, email, password_hash")
        .eq("email", email.toLowerCase())
        .single();

      if (existingProfile) {
        if (existingProfile.password_hash && existingProfile.password_hash !== "PENDING_MIGRATION") {
          return errorResponse("Este email já está cadastrado", corsHeaders, 409);
        }
        
        // Migration case - set password for existing user
        const passwordHash = hashPassword(password);
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ 
            password_hash: passwordHash,
            password_hash_version: CURRENT_HASH_VERSION,
            name: name || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProfile.id);

        if (updateError) {
          console.error("[producer-auth] Error updating password:", updateError);
          return errorResponse("Erro ao definir senha", corsHeaders, 500);
        }

        console.log(`[producer-auth] Password set for existing producer: ${email}`);
        return jsonResponse({ success: true, message: "Senha definida com sucesso", producerId: existingProfile.id }, corsHeaders);
      }

      // Create new producer via Supabase Auth (for compatibility)
      const { data: authData, error: signupError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { name },
      });

      if (signupError) {
        console.error("[producer-auth] Auth signup error:", signupError);
        return errorResponse(signupError.message || "Erro ao criar conta", corsHeaders, 400);
      }

      // Update profile with password hash
      const passwordHash = hashPassword(password);
      await supabase.from("profiles").update({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        password_hash_version: CURRENT_HASH_VERSION,
        name: name || null,
      }).eq("id", authData.user.id);

      // Create vendor_profiles if cpf_cnpj provided
      if (cpfCnpj) {
        await supabase.from("vendor_profiles").insert({
          user_id: authData.user.id,
          name: name || "",
          phone: phone || "",
          cpf_cnpj: cpfCnpj,
        });
      }

      await logAuditEvent(supabase, authData.user.id, "REGISTER", true, clientIP, userAgent, { email });

      console.log(`[producer-auth] New producer created: ${email}`);
      return jsonResponse({ success: true, producerId: authData.user.id }, corsHeaders);
    }

    // ============================================
    // LOGIN
    // ============================================
    if (action === "login" && req.method === "POST") {
      const rateLimitResult = await rateLimitMiddleware(supabase, req, RATE_LIMIT_CONFIGS.BUYER_AUTH_LOGIN, corsHeaders);
      if (rateLimitResult) return rateLimitResult;

      const rawBody = await req.json();
      const email = sanitizeEmail(rawBody.email);
      const password = rawBody.password;

      if (!email || !password) {
        return errorResponse("Email e senha são obrigatórios", corsHeaders, 400);
      }

      const { data: producer, error: findError } = await supabase
        .from("profiles")
        .select("id, email, name, password_hash, password_hash_version, is_active")
        .eq("email", email.toLowerCase())
        .single();

      if (findError || !producer) {
        console.log(`[producer-auth] Login failed - producer not found: ${email}`);
        return errorResponse("Email ou senha inválidos", corsHeaders, 401);
      }

      if (producer.is_active === false) {
        return errorResponse("Conta desativada", corsHeaders, 403);
      }

      // Handle legacy Supabase Auth migration
      if (!producer.password_hash || producer.password_hash === "PENDING_MIGRATION") {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password,
        });

        if (authError || !authData.user) {
          await logAuditEvent(supabase, producer.id, "LOGIN_FAILED", false, clientIP, userAgent, { email, reason: "invalid_password" });
          return errorResponse("Email ou senha inválidos", corsHeaders, 401);
        }

        // Migrate password to custom system
        const passwordHash = hashPassword(password);
        await supabase.from("profiles").update({ 
          password_hash: passwordHash,
          password_hash_version: CURRENT_HASH_VERSION,
        }).eq("id", producer.id);
        console.log(`[producer-auth] Migrated password for: ${email}`);
      } else {
        const isValid = verifyPassword(password, producer.password_hash);
        if (!isValid) {
          await logAuditEvent(supabase, producer.id, "LOGIN_FAILED", false, clientIP, userAgent, { email, reason: "invalid_password" });
          return errorResponse("Email ou senha inválidos", corsHeaders, 401);
        }
      }

      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error: sessionError } = await supabase.from("producer_sessions").insert({
        producer_id: producer.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: clientIP,
        user_agent: userAgent,
      });

      if (sessionError) {
        console.error("[producer-auth] Session error:", sessionError);
        return errorResponse("Erro ao criar sessão", corsHeaders, 500);
      }

      await supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", producer.id);
      await logAuditEvent(supabase, producer.id, "LOGIN_SUCCESS", true, clientIP, userAgent, { email });

      // Fetch user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", producer.id)
        .single();

      console.log(`[producer-auth] Login successful: ${email}, role: ${roleData?.role || "user"}`);
      return jsonResponse({
        success: true,
        sessionToken,
        expiresAt: expiresAt.toISOString(),
        producer: { 
          id: producer.id, 
          email: producer.email, 
          name: producer.name,
          role: roleData?.role || "user",
        },
      }, corsHeaders);
    }

    // ============================================
    // LOGOUT
    // ============================================
    if (action === "logout" && req.method === "POST") {
      const { sessionToken } = await req.json();

      if (!sessionToken) {
        return errorResponse("Token de sessão é obrigatório", corsHeaders, 400);
      }

      const { data: session } = await supabase
        .from("producer_sessions")
        .select("producer_id")
        .eq("session_token", sessionToken)
        .single();

      await supabase.from("producer_sessions").update({ is_valid: false }).eq("session_token", sessionToken);

      if (session?.producer_id) {
        await logAuditEvent(supabase, session.producer_id, "LOGOUT", true, clientIP, userAgent);
      }

      console.log("[producer-auth] Logout successful");
      return jsonResponse({ success: true }, corsHeaders);
    }

    // ============================================
    // VALIDATE
    // ============================================
    if (action === "validate" && req.method === "POST") {
      const { sessionToken } = await req.json();

      if (!sessionToken) {
        return jsonResponse({ valid: false }, corsHeaders);
      }

      const { data: session } = await supabase
        .from("producer_sessions")
        .select(`id, expires_at, is_valid, producer:producer_id (id, email, name, is_active)`)
        .eq("session_token", sessionToken)
        .single();

      if (!session || !session.is_valid || !session.producer) {
        return jsonResponse({ valid: false }, corsHeaders);
      }

      const producerData = Array.isArray(session.producer) ? session.producer[0] : session.producer;

      if (producerData.is_active === false) {
        return jsonResponse({ valid: false }, corsHeaders);
      }

      if (new Date(session.expires_at) < new Date()) {
        await supabase.from("producer_sessions").update({ is_valid: false }).eq("id", session.id);
        return jsonResponse({ valid: false }, corsHeaders);
      }

      await supabase.from("producer_sessions").update({ last_activity_at: new Date().toISOString() }).eq("id", session.id);

      // Fetch user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", producerData.id)
        .single();

      return jsonResponse({
        valid: true,
        producer: { 
          id: producerData.id, 
          email: producerData.email, 
          name: producerData.name,
          role: roleData?.role || "user",
        },
      }, corsHeaders);
    }

    // ============================================
    // REQUEST-PASSWORD-RESET (with rate limiting)
    // ============================================
    if (action === "request-password-reset" && req.method === "POST") {
      // Rate limit to prevent email spam
      const rateLimitResult = await rateLimitMiddleware(supabase, req, PASSWORD_RESET_RATE_LIMIT, corsHeaders);
      if (rateLimitResult) {
        console.warn(`[producer-auth] Rate limit exceeded for password-reset`);
        return rateLimitResult;
      }

      const rawBody = await req.json();
      const email = sanitizeEmail(rawBody.email);

      if (!email) {
        return errorResponse("Email é obrigatório", corsHeaders, 400);
      }

      const { data: producer, error: findError } = await supabase
        .from("profiles")
        .select("id, email, name")
        .eq("email", email.toLowerCase())
        .single();

      if (findError || !producer) {
        console.log(`[producer-auth] Password reset for unknown email: ${email}`);
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
        console.error("[producer-auth] Error saving reset token:", updateError);
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
        console.error("[producer-auth] Error sending reset email:", emailResult.error);
        return errorResponse("Erro ao enviar email. Tente novamente.", corsHeaders, 500);
      }

      await logAuditEvent(supabase, producer.id, "PASSWORD_RESET_REQUESTED", true, clientIP, userAgent, { email });

      console.log(`[producer-auth] Password reset email sent to: ${email}`);
      return jsonResponse({ success: true, message: "Email enviado" }, corsHeaders);
    }

    // ============================================
    // VERIFY-RESET-TOKEN
    // ============================================
    if (action === "verify-reset-token" && req.method === "POST") {
      const { token } = await req.json();

      if (!token) {
        return jsonResponse({ valid: false, error: "Token não fornecido" }, corsHeaders, 400);
      }

      const { data: producer, error: findError } = await supabase
        .from("profiles")
        .select("id, email, reset_token_expires_at")
        .eq("reset_token", token)
        .single();

      if (findError || !producer) {
        console.log(`[producer-auth] Invalid reset token: ${token.substring(0, 10)}...`);
        return jsonResponse({ valid: false, error: "Link inválido ou já utilizado" }, corsHeaders, 400);
      }

      if (!producer.reset_token_expires_at || new Date(producer.reset_token_expires_at) < new Date()) {
        console.log(`[producer-auth] Expired reset token for: ${producer.email}`);
        return jsonResponse({ valid: false, error: "Link expirado. Solicite um novo." }, corsHeaders, 400);
      }

      return jsonResponse({ valid: true, email: producer.email }, corsHeaders);
    }

    // ============================================
    // RESET-PASSWORD
    // ============================================
    if (action === "reset-password" && req.method === "POST") {
      const { token, password } = await req.json();

      if (!token || !password) {
        return errorResponse("Token e senha são obrigatórios", corsHeaders, 400);
      }

      const { data: producer, error: findError } = await supabase
        .from("profiles")
        .select("id, email, reset_token_expires_at")
        .eq("reset_token", token)
        .single();

      if (findError || !producer) {
        return errorResponse("Link inválido ou já utilizado", corsHeaders, 400);
      }

      if (!producer.reset_token_expires_at || new Date(producer.reset_token_expires_at) < new Date()) {
        return errorResponse("Link expirado. Solicite um novo.", corsHeaders, 400);
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return jsonResponse({
          error: formatPasswordError(passwordValidation),
          validation: {
            score: passwordValidation.score,
            errors: passwordValidation.errors,
            suggestions: passwordValidation.suggestions,
          },
        }, corsHeaders, 400);
      }

      const passwordHash = hashPassword(password);

      const { error: updateError } = await supabase.from("profiles").update({
        password_hash: passwordHash,
        password_hash_version: CURRENT_HASH_VERSION,
        reset_token: null,
        reset_token_expires_at: null,
        updated_at: new Date().toISOString(),
      }).eq("id", producer.id);

      if (updateError) {
        console.error("[producer-auth] Error updating password:", updateError);
        return errorResponse("Erro ao redefinir senha", corsHeaders, 500);
      }

      // Also update in Supabase Auth for compatibility
      try {
        await supabase.auth.admin.updateUserById(producer.id, { password });
      } catch (authError) {
        console.warn("[producer-auth] Could not update Supabase Auth password:", authError);
      }

      await logAuditEvent(supabase, producer.id, "PASSWORD_RESET_COMPLETED", true, clientIP, userAgent, { email: producer.email });

      console.log(`[producer-auth] Password reset successful for: ${producer.email}`);
      return jsonResponse({ success: true, message: "Senha redefinida com sucesso" }, corsHeaders);
    }

    // ============================================
    // Unknown action
    // ============================================
    console.log(`[producer-auth] Unknown action: ${action}`);
    return errorResponse("Ação não encontrada", corsHeaders, 404);

  } catch (error) {
    console.error("[producer-auth] Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
