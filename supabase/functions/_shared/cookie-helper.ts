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

/**
 * Legacy cookie names - kept ONLY for clearing during logout.
 * Includes both old __Host- prefixed cookies (V3) and legacy buyer/producer cookies.
 */
export const LEGACY_COOKIE_NAMES = {
  // V3 cookies (being replaced)
  v3: {
    access: "__Host-rise_access",
    refresh: "__Host-rise_refresh",
  },
  // Legacy producer cookies
  producer: {
    access: "__Host-producer_access",
    refresh: "__Host-producer_refresh",
  },
  // Legacy buyer cookies
  buyer: {
    access: "__Host-buyer_access",
    refresh: "__Host-buyer_refresh",
  },
} as const;

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
 * Tries new __Secure- cookie first, then falls back to legacy __Host- for migration.
 */
export function getAccessToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) return null;
  
  // Try new cookie format first
  const newToken = getCookie(cookieHeader, COOKIE_NAMES.access);
  if (newToken) return newToken;
  
  // Fallback to V3 format during migration period
  return getCookie(cookieHeader, LEGACY_COOKIE_NAMES.v3.access);
}

/**
 * Gets refresh token from request.
 * Tries new __Secure- cookie first, then falls back to legacy __Host- for migration.
 */
export function getRefreshToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) return null;
  
  // Try new cookie format first
  const newToken = getCookie(cookieHeader, COOKIE_NAMES.refresh);
  if (newToken) return newToken;
  
  // Fallback to V3 format during migration period
  return getCookie(cookieHeader, LEGACY_COOKIE_NAMES.v3.refresh);
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
 * Clears ALL cookie formats: new __Secure-, V3 __Host-, and legacy buyer/producer.
 */
export function createLogoutCookies(): string[] {
  // Helper for expired cookies WITH domain (new format)
  const expiredWithDomain = (name: string) => 
    `${name}=; Max-Age=0; Path=/; Domain=${COOKIE_DOMAIN}; HttpOnly; Secure; SameSite=None`;
  
  // Helper for expired cookies WITHOUT domain (legacy __Host- format)
  const expiredHostOnly = (name: string) => 
    `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`;
  
  return [
    // New __Secure- cookies (with domain)
    expiredWithDomain(COOKIE_NAMES.access),
    expiredWithDomain(COOKIE_NAMES.refresh),
    // V3 __Host- cookies (host-only, needs Partitioned)
    expiredHostOnly(LEGACY_COOKIE_NAMES.v3.access),
    expiredHostOnly(LEGACY_COOKIE_NAMES.v3.refresh),
    // Legacy producer cookies
    expiredHostOnly(LEGACY_COOKIE_NAMES.producer.access),
    expiredHostOnly(LEGACY_COOKIE_NAMES.producer.refresh),
    // Legacy buyer cookies
    expiredHostOnly(LEGACY_COOKIE_NAMES.buyer.access),
    expiredHostOnly(LEGACY_COOKIE_NAMES.buyer.refresh),
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
