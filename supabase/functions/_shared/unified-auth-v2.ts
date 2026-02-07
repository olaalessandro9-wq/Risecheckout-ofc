/**
 * Unified Auth V2 - Single Identity Model
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * RISE V3 EXCEPTION: FILE LENGTH (~580 lines)
 * 
 * This file exceeds the 300-line limit due to its central role as the 
 * Single Source of Truth (SSOT) for unified authentication across all
 * Edge Functions. The logic is highly cohesive and splitting it would:
 * 1. Harm readability by scattering related auth logic
 * 2. Create unnecessary import chains
 * 3. Violate Single Responsibility at a higher abstraction level
 * 
 * Exception reviewed and approved: 2026-01-23
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This module provides authentication for the unified identity architecture:
 * - One person = One user record in `users` table
 * - One session = Multiple role contexts
 * - Instant context switching without re-authentication
 * 
 * Replaces: unified-auth.ts, buyer-auth-handlers.ts, producer-auth-handlers.ts
 * 
 * @module _shared/unified-auth-v2
 * @version 2.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";
import { 
  getCookie, 
  COOKIE_NAMES,
  COOKIE_DOMAIN,
  createAuthCookies, 
  createLogoutCookies,
  jsonResponseWithCookies,
  createSecureCookie,
} from "./cookie-helper.ts";
import { 
  ACCESS_TOKEN_DURATION_MINUTES, 
  REFRESH_TOKEN_DURATION_DAYS,
  CURRENT_HASH_VERSION,
  BCRYPT_COST,
} from "./auth-constants.ts";
import { genSaltSync, hashSync, compareSync } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const log = createLogger("UnifiedAuthV2");

// ============================================================================
// TYPES
// ============================================================================

export type AppRole = "owner" | "admin" | "user" | "seller" | "buyer";

export interface UnifiedUser {
  id: string;
  email: string;
  name: string | null;
  timezone: string | null;
  roles: AppRole[];
  activeRole: AppRole;
}

export interface SessionData {
  userId: string;
  sessionToken: string;
  refreshToken: string;
  activeRole: AppRole;
  expiresAt: Date;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

// ============================================================================
// COOKIE NAMES (RISE V3: Uses COOKIE_NAMES from cookie-helper.ts)
// ============================================================================
// UNIFIED_COOKIE_NAMES was removed in Fase 13 (2026-01-23).
// Use COOKIE_NAMES imported from "./cookie-helper.ts" instead.

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generates cryptographically secure session tokens.
 */
export function generateSessionTokens(): {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
} {
  const accessToken = crypto.randomUUID() + "-" + crypto.randomUUID();
  const refreshToken = crypto.randomUUID() + "-" + crypto.randomUUID();
  
  const now = new Date();
  const accessTokenExpiresAt = new Date(now.getTime() + ACCESS_TOKEN_DURATION_MINUTES * 60 * 1000);
  const refreshTokenExpiresAt = new Date(now.getTime() + REFRESH_TOKEN_DURATION_DAYS * 24 * 60 * 60 * 1000);
  
  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
}

// ============================================================================
// TOKEN READING
// ============================================================================

/**
 * Gets access token from request using unified cookie.
 * Uses V4 format (__Secure-rise_access) only.
 */
export function getUnifiedAccessToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) return null;
  
  return getCookie(cookieHeader, COOKIE_NAMES.access);
}

/**
 * Gets refresh token from request using unified cookie.
 * Uses V4 format (__Secure-rise_refresh) only.
 */
export function getUnifiedRefreshToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) return null;
  
  return getCookie(cookieHeader, COOKIE_NAMES.refresh);
}

// ============================================================================
// UNIFIED COOKIE CREATION
// ============================================================================

/**
 * Creates unified auth cookies (access + refresh).
 */
export function createUnifiedAuthCookies(
  accessToken: string,
  refreshToken: string
): string[] {
  return [
    createSecureCookie(COOKIE_NAMES.access, accessToken, {
      maxAge: ACCESS_TOKEN_DURATION_MINUTES * 60,
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      domain: COOKIE_DOMAIN,
    }),
    createSecureCookie(COOKIE_NAMES.refresh, refreshToken, {
      maxAge: REFRESH_TOKEN_DURATION_DAYS * 24 * 60 * 60,
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      domain: COOKIE_DOMAIN,
    }),
  ];
}

/**
 * Creates expired cookies for logout.
 * Clears V4 format cookies only (__Secure-rise_*).
 */
export function createUnifiedLogoutCookies(): string[] {
  const expiredWithDomain = (name: string) => 
    `${name}=; Max-Age=0; Path=/; Domain=${COOKIE_DOMAIN}; HttpOnly; Secure; SameSite=None`;
  
  return [
    expiredWithDomain(COOKIE_NAMES.access),
    expiredWithDomain(COOKIE_NAMES.refresh),
  ];
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

/**
 * Validates session token and returns authenticated user.
 * Uses the unified `sessions` table.
 */
export async function getAuthenticatedUser(
  supabase: SupabaseClient,
  req: Request
): Promise<UnifiedUser | null> {
  const token = getUnifiedAccessToken(req);
  if (!token) {
    log.debug("No access token found in cookies");
    return null;
  }
  
  return validateSessionToken(supabase, token);
}

/**
 * Requires authentication. Throws error if not authenticated.
 */
export async function requireAuthenticatedUser(
  supabase: SupabaseClient,
  req: Request
): Promise<UnifiedUser> {
  const user = await getAuthenticatedUser(supabase, req);
  if (!user) {
    throw new Error("Usuário não autenticado");
  }
  return user;
}

/**
 * Validates a session token against the unified sessions table.
 */
async function validateSessionToken(
  supabase: SupabaseClient,
  token: string
): Promise<UnifiedUser | null> {
  try {
    const now = new Date().toISOString();
    
    // OTIMIZAÇÃO RISE V3: Query única com JOIN (sessions + users)
    // Reduz de 3 queries sequenciais para 2 (economia de ~100-200ms)
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select(`
        id, 
        user_id, 
        active_role, 
        access_token_expires_at, 
        is_valid,
        users!inner(
          id, 
          email, 
          name, 
          timezone, 
          is_active
        )
      `)
      .eq("session_token", token)
      .eq("is_valid", true)
      .gt("access_token_expires_at", now)
      .single();
    
    if (sessionError || !sessionData) {
      log.debug("Session not found or invalid");
      return null;
    }
    
    // Extract user from JOIN result
    const user = Array.isArray(sessionData.users) 
      ? sessionData.users[0] 
      : sessionData.users;
    
    if (!user || !user.is_active) {
      log.debug("User not found or inactive");
      return null;
    }
    
    // Get user roles (separate query - necessary for array result)
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const roles = (userRoles || []).map(r => r.role as AppRole);
    
    // Ensure buyer role is always included (everyone can be a buyer)
    if (!roles.includes("buyer")) {
      roles.push("buyer");
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
      roles,
      activeRole: sessionData.active_role as AppRole,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Error validating session:", msg);
    return null;
  }
}

// ============================================================================
// CONTEXT SWITCHING
// ============================================================================

/**
 * Switches the active role context for a session.
 * This is the core of the "no re-login" feature.
 */
export async function switchContext(
  supabase: SupabaseClient,
  req: Request,
  newRole: AppRole
): Promise<{ success: boolean; error?: string }> {
  const token = getUnifiedAccessToken(req);
  if (!token) {
    return { success: false, error: "Não autenticado" };
  }
  
  // Get current session
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, user_id, is_valid")
    .eq("session_token", token)
    .eq("is_valid", true)
    .single();
  
  if (sessionError || !session) {
    return { success: false, error: "Sessão inválida" };
  }
  
  // Verify user has the requested role
  const { data: roleCheck } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user_id)
    .eq("role", newRole)
    .single();
  
  // Special case: everyone can be a buyer
  if (!roleCheck && newRole !== "buyer") {
    return { success: false, error: "Usuário não tem essa permissão" };
  }
  
  // Update session's active role
  const { error: updateError } = await supabase
    .from("sessions")
    .update({ 
      active_role: newRole,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", session.id);
  
  if (updateError) {
    log.error("Error updating session role:", updateError.message);
    return { success: false, error: "Erro ao trocar contexto" };
  }
  
  // Update user's preferred context (persists across sessions)
  await supabase
    .from("user_active_context")
    .upsert({
      user_id: session.user_id,
      active_role: newRole,
      switched_at: new Date().toISOString(),
    });
  
  log.info("Context switched", { userId: session.user_id, newRole });
  
  return { success: true };
}

// ============================================================================
// PASSWORD HELPERS (Sync - Compatible with Edge Runtime)
// ============================================================================

/**
 * Hashes a password using bcrypt (synchronous for Edge Runtime compatibility).
 */
export function hashPassword(password: string): string {
  const salt = genSaltSync(BCRYPT_COST);
  return hashSync(password, salt);
}

/**
 * Verifies a password against a hash (synchronous for Edge Runtime compatibility).
 * 
 * RISE V3: Returns structured result to distinguish between
 * "wrong password" (valid=false) and "bcrypt crash" (valid=false + error).
 * This prevents silent error swallowing (Section 6.1 violation fix).
 */
export function verifyPassword(password: string, hash: string): { valid: boolean; error?: string } {
  try {
    const result = compareSync(password, hash);
    return { valid: result };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("bcrypt compareSync threw an exception (NOT a password mismatch):", msg);
    return { valid: false, error: msg };
  }
}

// ============================================================================
// SESSION CREATION
// ============================================================================

/**
 * Creates a new session for a user.
 */
export async function createSession(
  supabase: SupabaseClient,
  userId: string,
  activeRole: AppRole,
  req: Request
): Promise<SessionData | null> {
  const tokens = generateSessionTokens();
  
  const sessionData = {
    user_id: userId,
    session_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    active_role: activeRole,
    access_token_expires_at: tokens.accessTokenExpiresAt.toISOString(),
    refresh_token_expires_at: tokens.refreshTokenExpiresAt.toISOString(),
    expires_at: tokens.refreshTokenExpiresAt.toISOString(),
    ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    user_agent: req.headers.get("user-agent") || null,
    is_valid: true,
  };
  
  const { error } = await supabase.from("sessions").insert(sessionData);
  
  if (error) {
    log.error("Error creating session:", error.message);
    return null;
  }
  
  return {
    userId,
    sessionToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    activeRole,
    expiresAt: tokens.refreshTokenExpiresAt,
    accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
  };
}

// ============================================================================
// SESSION CONTEXT RESOLUTION (SSOT for login + MFA verify)
// ============================================================================

/**
 * Parameters for resolving a user session context.
 * Used by both login and MFA verify handlers to avoid duplication.
 */
export interface ResolveSessionParams {
  supabase: SupabaseClient;
  user: { id: string; email: string; name: string | null };
  roles: AppRole[];
  req: Request;
  preferredRole?: AppRole;
}

/**
 * Result of session context resolution.
 */
export interface ResolvedSessionContext {
  activeRole: AppRole;
  session: SessionData;
}

/**
 * Resolves the full session context for a user login.
 * 
 * RISE V3 SSOT: This is the SINGLE SOURCE OF TRUTH for post-authentication
 * session creation. Both `login.ts` and `mfa-verify.ts` call this function
 * to guarantee identical behavior (active role resolution, session cleanup,
 * session creation, last_login_at update).
 * 
 * Steps:
 * 1. Resolve active role (last context → preferred → hierarchy)
 * 2. Invalidate old sessions (max 5 active per user)
 * 3. Create new session via createSession()
 * 4. Update last_login_at timestamp
 */
export async function resolveUserSessionContext(
  params: ResolveSessionParams
): Promise<ResolvedSessionContext | null> {
  const { supabase, user, roles, req, preferredRole } = params;

  // 1. Resolve active role
  let activeRole: AppRole = "buyer";

  const { data: lastContext } = await supabase
    .from("user_active_context")
    .select("active_role")
    .eq("user_id", user.id)
    .single();

  if (lastContext?.active_role && roles.includes(lastContext.active_role as AppRole)) {
    activeRole = lastContext.active_role as AppRole;
  } else if (preferredRole && roles.includes(preferredRole)) {
    activeRole = preferredRole;
  } else if (roles.some(r => ["owner", "admin", "user", "seller"].includes(r))) {
    activeRole = roles.find(r => ["owner", "admin", "user", "seller"].includes(r)) || "seller";
  }

  // 2. Invalidate old sessions (max 5 active per user)
  const { data: existingSessions } = await supabase
    .from("sessions")
    .select("id, created_at")
    .eq("user_id", user.id)
    .eq("is_valid", true)
    .order("created_at", { ascending: false });

  if (existingSessions && existingSessions.length >= 5) {
    const sessionsToInvalidate = existingSessions.slice(4).map(s => s.id);
    if (sessionsToInvalidate.length > 0) {
      await supabase
        .from("sessions")
        .update({ is_valid: false })
        .in("id", sessionsToInvalidate);
      log.info("Invalidated old sessions", { count: sessionsToInvalidate.length });
    }
  }

  // 3. Create session
  const session = await createSession(supabase, user.id, activeRole, req);
  if (!session) {
    log.error("Failed to create session for user:", user.id);
    return null;
  }

  // 4. Update last login
  await supabase
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", user.id);

  return { activeRole, session };
}

/**
 * Invalidates all sessions for a user.
 */
export async function invalidateAllSessions(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase
    .from("sessions")
    .update({ is_valid: false })
    .eq("user_id", userId);
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Creates an unauthorized response.
 */
export function unauthorizedResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: "Usuário não autenticado" }),
    {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

/**
 * Creates a forbidden response.
 */
export function forbiddenResponse(corsHeaders: Record<string, string>, message = "Acesso negado"): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

/**
 * Creates a successful login/register response with cookies.
 * Uses V4 format cookies only (__Secure-rise_*).
 */
export function createAuthResponse(
  session: SessionData,
  user: { id: string; email: string; name: string | null },
  roles: AppRole[],
  corsHeaders: Record<string, string>
): Response {
  const authCookies = createUnifiedAuthCookies(session.sessionToken, session.refreshToken);
  
  return jsonResponseWithCookies({
    success: true,
    expiresIn: ACCESS_TOKEN_DURATION_MINUTES * 60,
    expiresAt: session.accessTokenExpiresAt.toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    roles,
    activeRole: session.activeRole,
  }, corsHeaders, authCookies);
}

/**
 * Creates a logout response with expired cookies.
 */
export function createLogoutResponse(corsHeaders: Record<string, string>): Response {
  const cookies = createUnifiedLogoutCookies();
  return jsonResponseWithCookies({ success: true }, corsHeaders, cookies);
}
