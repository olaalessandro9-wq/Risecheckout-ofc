/**
 * Producer Auth Handlers
 * 
 * Extracted handlers for producer-auth edge function.
 * Keeps index.ts as a clean router (~150 lines).
 * 
 * RISE Protocol Compliant - Zero `any` (exceto SupabaseClient internals)
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "./rate-limiting/index.ts";
import { validatePassword, formatPasswordError } from "./password-policy.ts";
import { sanitizeEmail, sanitizeName, sanitizePhone } from "./sanitizer.ts";
import {
  CURRENT_HASH_VERSION,
  hashPassword,
  verifyPassword,
  generateSessionToken,
  logAuditEvent,
  jsonResponse,
  errorResponse,
} from "./producer-auth-helpers.ts";

import type { ProducerProfile, UserRole } from "./supabase-types.ts";

// Re-export session handlers
export { handleLogout, handleValidate } from "./producer-auth-session-handlers.ts";

// ============================================
// INTERNAL TYPES
// ============================================

interface ExistingProfileResult {
  id: string;
  email: string;
  password_hash: string | null;
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
  if (rateLimitResult) return rateLimitResult;

  const rawBody = await req.json();
  const email = sanitizeEmail(rawBody.email);
  const password = rawBody.password;
  const name = sanitizeName(rawBody.name);
  const phone = sanitizePhone(rawBody.phone);
  const cpfCnpj = rawBody.cpf_cnpj;
  const registrationSource = rawBody.registration_source || "producer";
  const clientIP = getClientIP(req);
  const userAgent = req.headers.get("user-agent");

  const validSources = ["producer", "affiliate"];
  const finalSource = validSources.includes(registrationSource) ? registrationSource : "producer";

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

  // Check existing profile with explicit type
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, email, password_hash")
    .eq("email", email.toLowerCase())
    .single() as { data: ExistingProfileResult | null; error: unknown };

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

  // Create new producer via Supabase Auth
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
    registration_source: finalSource,
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
  if (rateLimitResult) return rateLimitResult;

  const rawBody = await req.json();
  const email = sanitizeEmail(rawBody.email);
  const password = rawBody.password;
  const clientIP = getClientIP(req);
  const userAgent = req.headers.get("user-agent");

  if (!email || !password) {
    return errorResponse("Email e senha são obrigatórios", corsHeaders, 400);
  }

  const { data: producer, error: findError } = await supabase
    .from("profiles")
    .select("id, email, name, password_hash, password_hash_version, is_active")
    .eq("email", email.toLowerCase())
    .single() as { data: ProducerProfile | null; error: unknown };

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
    .single() as { data: UserRole | null; error: unknown };

  // Sync with Supabase Auth for RLS compatibility
  let supabaseSession = null;
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (!authError && authData.session) {
      supabaseSession = {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      };
      console.log(`[producer-auth] Supabase Auth session synced for: ${email}`);
    }
  } catch (syncError) {
    console.warn("[producer-auth] Supabase Auth sync failed (non-blocking):", syncError);
  }

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
    supabaseSession,
  }, corsHeaders);
}
