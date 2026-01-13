/**
 * Buyer Auth Handlers - Core
 * 
 * Handlers principais: register, login, logout
 * Separado para manter arquivos < 300 linhas
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { genSaltSync, hashSync, compareSync } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

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
  sanitizeEmail, 
  sanitizeName, 
  sanitizePhone 
} from "./sanitizer.ts";

import { 
  logSecurityEvent, 
  SecurityAction 
} from "./audit-logger.ts";

import {
  HASH_VERSION_SHA256,
  CURRENT_HASH_VERSION,
  BCRYPT_COST,
  SESSION_DURATION_DAYS,
} from "./buyer-auth-types.ts";

// ============================================
// PASSWORD UTILITIES
// ============================================
export function hashPassword(password: string): string {
  const salt = genSaltSync(BCRYPT_COST);
  return hashSync(password, salt);
}

async function hashPasswordLegacy(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = Deno.env.get("BUYER_AUTH_SALT") || "rise_checkout_salt";
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(password: string, hash: string, version: number): Promise<boolean> {
  if (version === HASH_VERSION_SHA256) {
    const legacyHash = await hashPasswordLegacy(password);
    return legacyHash === hash;
  }
  return compareSync(password, hash);
}

export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

export function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

function jsonResponse(data: unknown, status = 200, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

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
    return jsonResponse({ error: "Email e senha são obrigatórios" }, 400, corsHeaders);
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

  const { data: existingBuyer } = await supabase
    .from("buyer_profiles")
    .select("id, password_hash")
    .eq("email", email)
    .single();

  const passwordHash = hashPassword(password);

  if (existingBuyer) {
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
        return jsonResponse({ error: "Erro ao definir senha" }, 500, corsHeaders);
      }

      console.log(`[buyer-auth] Password set with bcrypt for existing buyer: ${email}`);
      return jsonResponse({ success: true, message: "Senha definida com sucesso" }, 200, corsHeaders);
    }

    return jsonResponse({ error: "Este email já está cadastrado" }, 409, corsHeaders);
  }

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
    return jsonResponse({ error: "Erro ao criar conta" }, 500, corsHeaders);
  }

  console.log(`[buyer-auth] New buyer created with bcrypt: ${email}`);
  return jsonResponse({ success: true, buyerId: newBuyer.id }, 200, corsHeaders);
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
    return jsonResponse({ error: "Email e senha são obrigatórios" }, 400, corsHeaders);
  }

  const { data: buyer, error: findError } = await supabase
    .from("buyer_profiles")
    .select("id, email, name, password_hash, password_hash_version, is_active")
    .eq("email", email.toLowerCase())
    .single();

  if (findError || !buyer) {
    console.log(`[buyer-auth] Login failed - buyer not found: ${email}`);
    return jsonResponse({ error: "Email ou senha inválidos" }, 401, corsHeaders);
  }

  if (!buyer.is_active) {
    return jsonResponse({ error: "Conta desativada" }, 403, corsHeaders);
  }

  if (buyer.password_hash === "PENDING_PASSWORD_SETUP") {
    return jsonResponse({ 
      error: "Você precisa definir sua senha primeiro",
      needsPasswordSetup: true 
    }, 401, corsHeaders);
  }

  const hashVersion = buyer.password_hash_version || HASH_VERSION_SHA256;
  const isValid = await verifyPassword(password, buyer.password_hash, hashVersion);
  
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
    return jsonResponse({ error: "Email ou senha inválidos" }, 401, corsHeaders);
  }

  // Transparent rehash: upgrade to bcrypt if using legacy hash
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
    console.error("[buyer-auth] Error creating session:", sessionError);
    return jsonResponse({ error: "Erro ao criar sessão" }, 500, corsHeaders);
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
  return jsonResponse({
    success: true,
    sessionToken,
    expiresAt: expiresAt.toISOString(),
    buyer: { id: buyer.id, email: buyer.email, name: buyer.name },
  }, 200, corsHeaders);
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
    return jsonResponse({ error: "Token de sessão é obrigatório" }, 400, corsHeaders);
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
  return jsonResponse({ success: true }, 200, corsHeaders);
}
