/**
 * Unified Auth V2 - Single Identity Model
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
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
  createAuthCookies, 
  createLogoutCookies,
  jsonResponseWithCookies,
  createSecureCookie,
  type CookieDomain,
} from "./cookie-helper.ts";
import { 
  ACCESS_TOKEN_DURATION_MINUTES, 
  REFRESH_TOKEN_DURATION_DAYS,
  CURRENT_HASH_VERSION,
  BCRYPT_COST,
} from "./auth-constants.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const log = createLogger("UnifiedAuthV2");

// ============================================================================
// TYPES
// ============================================================================

export type AppRole = "owner" | "admin" | "user" | "seller" | "buyer";

export interface UnifiedUser {
  id: string;
  email: string;
  name: string | null;
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
// COOKIE NAMES (Unified - Phase 6)
// ============================================================================

/**
 * Unified cookie names - used for the new single-identity architecture.
 * During transition period, we read from both old and new formats.
 */
export const UNIFIED_COOKIE_NAMES = {
  access: "__Host-rise_access",
  refresh: "__Host-rise_refresh",
} as const;

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
// TOKEN READING (with backwards compatibility)
// ============================================================================

/**
 * Gets access token from request, checking multiple cookie formats for compatibility.
 * Order: unified > producer > buyer
 */
export function getUnifiedAccessToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) return null;
  
  // Try unified format first
  const unified = getCookie(cookieHeader, UNIFIED_COOKIE_NAMES.access);
  if (unified) return unified;
  
  // Fallback to producer format
  const producer = getCookie(cookieHeader, COOKIE_NAMES.producer.access);
  if (producer) return producer;
  
  // Fallback to buyer format
  const buyer = getCookie(cookieHeader, COOKIE_NAMES.buyer.access);
  return buyer;
}

/**
 * Gets refresh token from request, checking multiple cookie formats.
 */
export function getUnifiedRefreshToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) return null;
  
  // Try unified format first
  const unified = getCookie(cookieHeader, UNIFIED_COOKIE_NAMES.refresh);
  if (unified) return unified;
  
  // Fallback to producer format
  const producer = getCookie(cookieHeader, COOKIE_NAMES.producer.refresh);
  if (producer) return producer;
  
  // Fallback to buyer format
  const buyer = getCookie(cookieHeader, COOKIE_NAMES.buyer.refresh);
  return buyer;
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
    createSecureCookie(UNIFIED_COOKIE_NAMES.access, accessToken, {
      maxAge: ACCESS_TOKEN_DURATION_MINUTES * 60,
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    }),
    createSecureCookie(UNIFIED_COOKIE_NAMES.refresh, refreshToken, {
      maxAge: REFRESH_TOKEN_DURATION_DAYS * 24 * 60 * 60,
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    }),
  ];
}

/**
 * Creates expired cookies for logout (clears all possible cookie names).
 */
export function createUnifiedLogoutCookies(): string[] {
  const expired = (name: string) => 
    `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`;
  
  return [
    // Unified cookies
    expired(UNIFIED_COOKIE_NAMES.access),
    expired(UNIFIED_COOKIE_NAMES.refresh),
    // Legacy producer cookies
    expired(COOKIE_NAMES.producer.access),
    expired(COOKIE_NAMES.producer.refresh),
    // Legacy buyer cookies
    expired(COOKIE_NAMES.buyer.access),
    expired(COOKIE_NAMES.buyer.refresh),
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
    
    // Get session from unified sessions table
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, user_id, active_role, access_token_expires_at, is_valid")
      .eq("session_token", token)
      .eq("is_valid", true)
      .single();
    
    if (sessionError || !session) {
      log.debug("Session not found or invalid");
      return null;
    }
    
    // Check expiration
    if (session.access_token_expires_at && session.access_token_expires_at < now) {
      log.debug("Access token expired");
      return null;
    }
    
    // Get user from unified users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, is_active")
      .eq("id", session.user_id)
      .single();
    
    if (userError || !user || !user.is_active) {
      log.debug("User not found or inactive");
      return null;
    }
    
    // Get user roles
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
      roles,
      activeRole: session.active_role as AppRole,
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
// PASSWORD HELPERS
// ============================================================================

/**
 * Hashes a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_COST);
  return await bcrypt.hash(password, salt);
}

/**
 * Verifies a password against a hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
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
 */
export function createAuthResponse(
  session: SessionData,
  user: { id: string; email: string; name: string | null },
  roles: AppRole[],
  corsHeaders: Record<string, string>
): Response {
  const cookies = createUnifiedAuthCookies(session.sessionToken, session.refreshToken);
  
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
  }, corsHeaders, cookies);
}

/**
 * Creates a logout response with expired cookies.
 */
export function createLogoutResponse(corsHeaders: Record<string, string>): Response {
  const cookies = createUnifiedLogoutCookies();
  return jsonResponseWithCookies({ success: true }, corsHeaders, cookies);
}
