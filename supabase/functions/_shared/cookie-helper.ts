/**
 * Cookie Helper - Unified Auth System
 * 
 * RISE Protocol V3: Multi-subdomain cookie architecture.
 * Enables session sharing across *.risecheckout.com subdomains.
 * 
 * @version 4.0.0 - Multi-subdomain support
 */

import { 
  ACCESS_TOKEN_DURATION_MINUTES, 
  REFRESH_TOKEN_DURATION_DAYS 
} from "./auth-constants.ts";

// ============================================
// MULTI-SUBDOMAIN CONFIGURATION
// ============================================

/**
 * Cookie domain for session sharing across subdomains.
 * Enables: api.risecheckout.com, app.risecheckout.com, pay.risecheckout.com
 */
export const COOKIE_DOMAIN = ".risecheckout.com";

// ============================================
// UNIFIED COOKIE NAMES (RISE V3 → V4)
// ============================================

/**
 * Unified cookie names - __Secure- prefix allows Domain attribute.
 * Changed from __Host- which blocks Domain attribute.
 */
export const COOKIE_NAMES = {
  access: "__Secure-rise_access",
  refresh: "__Secure-rise_refresh",
} as const;

// RISE V3 CLEANUP (2026-02-03): LEGACY_COOKIE_NAMES REMOVIDO
// Migração 100% completa - zero fallback necessário
// Todas as sessões ativas já usam __Secure-rise_* (V4)

// ============================================
// COOKIE OPTIONS
// ============================================

export interface CookieOptions {
  maxAge: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  path?: string;
  domain?: string;
}

const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  maxAge: ACCESS_TOKEN_DURATION_MINUTES * 60,
  httpOnly: true,
  secure: true,
  sameSite: "None",
  path: "/",
  domain: COOKIE_DOMAIN,
};

// ============================================
// COOKIE PARSING
// ============================================

/**
 * Escapes special regex characters in cookie name.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parses a cookie value from Cookie header.
 */
export function getCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  
  const regex = new RegExp(`(?:^|; )${escapeRegex(name)}=([^;]*)`);
  const match = cookieHeader.match(regex);
  
  return match ? match[1] : null;
}

/**
 * Gets access token from request.
 * Uses __Secure-rise_access cookie (V4 format).
 */
export function getAccessToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) return null;
  
  return getCookie(cookieHeader, COOKIE_NAMES.access);
}

/**
 * Gets refresh token from request.
 * Uses __Secure-rise_refresh cookie (V4 format).
 */
export function getRefreshToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) return null;
  
  return getCookie(cookieHeader, COOKIE_NAMES.refresh);
}

// ============================================
// SECURE COOKIE CREATION
// ============================================

/**
 * Creates a secure cookie string with __Secure- prefix support.
 * When domain is set, Partitioned attribute is NOT used (incompatible).
 */
export function createSecureCookie(
  name: string,
  value: string,
  options: Partial<CookieOptions> = {}
): string {
  const opts = { ...DEFAULT_COOKIE_OPTIONS, ...options };
  
  const parts = [
    `${name}=${value}`,
    `Max-Age=${opts.maxAge}`,
    `Path=${opts.path}`,
  ];
  
  // Add Domain when specified (enables cross-subdomain sharing)
  if (opts.domain) {
    parts.push(`Domain=${opts.domain}`);
  }
  
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  
  // Only add Partitioned when Domain is NOT set (they are incompatible)
  if (!opts.domain) {
    parts.push("Partitioned");
  }
  
  return parts.join("; ");
}

// ============================================
// UNIFIED AUTH COOKIES
// ============================================

/**
 * Creates auth cookies for unified identity system.
 * Uses Domain=.risecheckout.com for cross-subdomain support.
 */
export function createAuthCookies(
  accessToken: string,
  refreshToken: string
): string[] {
  return [
    createSecureCookie(COOKIE_NAMES.access, accessToken, {
      maxAge: ACCESS_TOKEN_DURATION_MINUTES * 60,
      domain: COOKIE_DOMAIN,
    }),
    createSecureCookie(COOKIE_NAMES.refresh, refreshToken, {
      maxAge: REFRESH_TOKEN_DURATION_DAYS * 24 * 60 * 60,
      domain: COOKIE_DOMAIN,
    }),
  ];
}

/**
 * Creates expired cookies for logout.
 * Clears current __Secure-rise_* cookies only (V4 format).
 */
export function createLogoutCookies(): string[] {
  const expiredWithDomain = (name: string) => 
    `${name}=; Max-Age=0; Path=/; Domain=${COOKIE_DOMAIN}; HttpOnly; Secure; SameSite=None`;
  
  return [
    expiredWithDomain(COOKIE_NAMES.access),
    expiredWithDomain(COOKIE_NAMES.refresh),
  ];
}

// ============================================
// RESPONSE HELPERS
// ============================================

/**
 * Creates a JSON response with Set-Cookie headers.
 */
export function jsonResponseWithCookies(
  data: unknown,
  corsHeaders: Record<string, string>,
  cookies: string[],
  status = 200
): Response {
  const headers = new Headers(corsHeaders);
  headers.set("Content-Type", "application/json");
  
  for (const cookie of cookies) {
    headers.append("Set-Cookie", cookie);
  }
  
  return new Response(JSON.stringify(data), { status, headers });
}
