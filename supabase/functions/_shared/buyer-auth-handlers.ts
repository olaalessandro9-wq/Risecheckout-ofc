/**
 * Buyer Auth Handlers - Core
 * 
 * Handlers principais: register, login, logout
 * Separado para manter arquivos < 300 linhas
 * 
 * @refactored 2026-01-13 - Password utilities extraídas para buyer-auth-password.ts
 * @refactored 2026-01-18 - RISE V3: jsonResponse signature standardized
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "./rate-limiting/index.ts";

import { 
  validatePassword, 
  formatPasswordError 
} from "./password-policy.ts";

import { 
  sanitizeEmail, 
  sanitizeName, 
  sanitizePhone 
} from "./sanitizer.ts";

import { 
  logSecurityEvent, 
  SecurityAction 
} from "./audit-logger.ts";

import {
  CURRENT_HASH_VERSION,
} from "./buyer-auth-types.ts";
import { generateSessionTokens } from "./buyer-auth-refresh-handler.ts";
import { ACCESS_TOKEN_DURATION_MINUTES } from "./auth-constants.ts";

// Import and re-export from password module
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  generateResetToken,
  jsonResponse,
} from "./buyer-auth-password.ts";

export { hashPassword, verifyPassword, generateSessionToken, generateResetToken, jsonResponse };

// ============================================
// REGISTER HANDLER
// ============================================
export async function handleRegister(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const rateLimitResult = await rateLimitMiddleware(
    supabase, req, RATE_LIMIT_CONFIGS.BUYER_AUTH_REGISTER, corsHeaders
  );
  if (rateLimitResult) {
    console.warn(`[buyer-auth] Rate limit exceeded for register from IP: ${getClientIP(req)}`);
    return rateLimitResult;
  }

  const rawBody = await req.json();
  const email = sanitizeEmail(rawBody.email);
  const password = rawBody.password;
  const name = sanitizeName(rawBody.name);
  const phone = sanitizePhone(rawBody.phone);

  if (!email || !password) {
    return jsonResponse({ error: "Email e senha são obrigatórios" }, corsHeaders, 400);
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
    }, corsHeaders, 400);
  }

  const { data: existingBuyer } = await supabase
    .from("buyer_profiles")
    .select("id, account_status")
    .eq("email", email)
    .single();

  const passwordHash = hashPassword(password);

  if (existingBuyer) {
    // RISE V3: Use account_status instead of password_hash markers
    if (existingBuyer.account_status === "pending_setup") {
      const { error: updateError } = await supabase
        .from("buyer_profiles")
        .update({ 
          password_hash: passwordHash,
          password_hash_version: CURRENT_HASH_VERSION,
          account_status: "active",
          name: name || undefined,
          phone: phone || undefined,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingBuyer.id);

      if (updateError) {
        console.error("[buyer-auth] Error updating password:", updateError);
        return jsonResponse({ error: "Erro ao definir senha" }, corsHeaders, 500);
      }

      console.log(`[buyer-auth] Password set with bcrypt for existing buyer: ${email}`);
      return jsonResponse({ success: true, message: "Senha definida com sucesso" }, corsHeaders, 200);
    }

    return jsonResponse({ error: "Este email já está cadastrado" }, corsHeaders, 409);
  }

  const { data: newBuyer, error: createError } = await supabase
    .from("buyer_profiles")
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      password_hash_version: CURRENT_HASH_VERSION,
      account_status: "active",
      name: name || null,
      phone: phone || null,
    })
    .select("id")
    .single();

  if (createError) {
    console.error("[buyer-auth] Error creating buyer:", createError);
    return jsonResponse({ error: "Erro ao criar conta" }, corsHeaders, 500);
  }

  console.log(`[buyer-auth] New buyer created with bcrypt: ${email}`);
  return jsonResponse({ success: true, buyerId: newBuyer.id }, corsHeaders, 200);
}

// ============================================
// LOGIN HANDLER
// ============================================
export async function handleLogin(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const rateLimitResult = await rateLimitMiddleware(
    supabase, req, RATE_LIMIT_CONFIGS.BUYER_AUTH_LOGIN, corsHeaders
  );
  if (rateLimitResult) {
    console.warn(`[buyer-auth] Rate limit exceeded for login from IP: ${getClientIP(req)}`);
    return rateLimitResult;
  }

  const rawBody = await req.json();
  const email = sanitizeEmail(rawBody.email);
  const password = rawBody.password;

  if (!email || !password) {
    return jsonResponse({ error: "Email e senha são obrigatórios" }, corsHeaders, 400);
  }

  const { data: buyer, error: findError } = await supabase
    .from("buyer_profiles")
    .select("id, email, name, password_hash, password_hash_version, is_active, account_status")
    .eq("email", email.toLowerCase())
    .single();

  if (findError || !buyer) {
    console.log(`[buyer-auth] Login failed - buyer not found: ${email}`);
    return jsonResponse({ error: "Email ou senha inválidos" }, corsHeaders, 401);
  }

  if (!buyer.is_active) {
    return jsonResponse({ error: "Conta desativada" }, corsHeaders, 403);
  }

  // RISE V3: Use account_status instead of password_hash markers
  if (buyer.account_status === "pending_setup") {
    return jsonResponse({ 
      error: "Você precisa definir sua senha primeiro",
      needsPasswordSetup: true 
    }, corsHeaders, 401);
  }

  // RISE V3: Apenas bcrypt - não precisa verificar versão
  const isValid = verifyPassword(password, buyer.password_hash);
  
  if (!isValid) {
    console.log(`[buyer-auth] Login failed - wrong password: ${email}`);
    await logSecurityEvent(supabase, {
      userId: buyer.id,
      action: SecurityAction.LOGIN_FAILED,
      resource: "buyer_auth",
      success: false,
      request: req,
      metadata: { email: buyer.email, reason: "invalid_password" }
    });
    return jsonResponse({ error: "Email ou senha inválidos" }, corsHeaders, 401);
  }

  // Create session with refresh tokens
  const { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt } = generateSessionTokens();

  const { error: sessionError } = await supabase
    .from("buyer_sessions")
    .insert({
      buyer_id: buyer.id,
      session_token: accessToken,
      refresh_token: refreshToken,
      access_token_expires_at: accessTokenExpiresAt.toISOString(),
      refresh_token_expires_at: refreshTokenExpiresAt.toISOString(),
      expires_at: refreshTokenExpiresAt.toISOString(), // Backwards compatibility
      ip_address: req.headers.get("x-forwarded-for") || null,
      user_agent: req.headers.get("user-agent") || null,
    });

  if (sessionError) {
    console.error("[buyer-auth] Error creating session:", sessionError);
    return jsonResponse({ error: "Erro ao criar sessão" }, corsHeaders, 500);
  }

  await supabase
    .from("buyer_profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", buyer.id);

  await logSecurityEvent(supabase, {
    userId: buyer.id,
    action: SecurityAction.LOGIN_SUCCESS,
    resource: "buyer_auth",
    success: true,
    request: req,
    metadata: { email: buyer.email }
  });

  console.log(`[buyer-auth] Login successful: ${email}`);
  
  // RISE V3: Return access token, refresh token, and expiry info
  return jsonResponse({
    success: true,
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_DURATION_MINUTES * 60, // seconds
    expiresAt: accessTokenExpiresAt.toISOString(),
    buyer: { id: buyer.id, email: buyer.email, name: buyer.name },
  }, corsHeaders, 200);
}

// ============================================
// LOGOUT HANDLER
// ============================================
export async function handleLogout(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { sessionToken } = await req.json();

  if (!sessionToken) {
    return jsonResponse({ error: "Token de sessão é obrigatório" }, corsHeaders, 400);
  }

  const { data: session } = await supabase
    .from("buyer_sessions")
    .select("buyer_id")
    .eq("session_token", sessionToken)
    .single();

  await supabase
    .from("buyer_sessions")
    .update({ is_valid: false })
    .eq("session_token", sessionToken);

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
  return jsonResponse({ success: true }, corsHeaders, 200);
}
