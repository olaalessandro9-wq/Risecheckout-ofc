/**
 * Cookie Helper - Unified Auth System
 * 
 * RISE Protocol V3: Simplified cookie management for unified identity.
 * Legacy cookie names kept only for clearing during logout.
 * 
 * @version 3.0.0 - Legacy cleanup complete
 */

import { 
  ACCESS_TOKEN_DURATION_MINUTES, 
  REFRESH_TOKEN_DURATION_DAYS 
} from "./auth-constants.ts";

// ============================================
// UNIFIED COOKIE NAMES (RISE V3)
// ============================================

/**
 * Unified cookie names - single identity architecture.
 */
export const COOKIE_NAMES = {
  access: "__Host-rise_access",
  refresh: "__Host-rise_refresh",
} as const;

/**
 * Legacy cookie names - kept ONLY for clearing during logout.
 * DO NOT use these for creating new cookies.
 */
export const LEGACY_COOKIE_NAMES = {
  producer: {
    access: "__Host-producer_access",
    refresh: "__Host-producer_refresh",
  },
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
}

const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  maxAge: ACCESS_TOKEN_DURATION_MINUTES * 60,
  httpOnly: true,
  secure: true,
  sameSite: "None",
  path: "/",
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
 * Gets access token from request using unified cookie name.
 */
export function getAccessToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  return getCookie(cookieHeader, COOKIE_NAMES.access);
}

/**
 * Gets refresh token from request using unified cookie name.
 */
export function getRefreshToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  return getCookie(cookieHeader, COOKIE_NAMES.refresh);
}

// ============================================
// SECURE COOKIE CREATION
// ============================================

/**
 * Creates a secure cookie string with __Host- prefix support.
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
  
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  
  // Add Partitioned for Chrome third-party cookie support
  parts.push("Partitioned");
  
  return parts.join("; ");
}

// ============================================
// UNIFIED AUTH COOKIES
// ============================================

/**
 * Creates auth cookies for unified identity system.
 */
export function createAuthCookies(
  accessToken: string,
  refreshToken: string
): string[] {
  return [
    createSecureCookie(COOKIE_NAMES.access, accessToken, {
      maxAge: ACCESS_TOKEN_DURATION_MINUTES * 60,
    }),
    createSecureCookie(COOKIE_NAMES.refresh, refreshToken, {
      maxAge: REFRESH_TOKEN_DURATION_DAYS * 24 * 60 * 60,
    }),
  ];
}

/**
 * Creates expired cookies for logout - clears both unified and legacy cookies.
 */
export function createLogoutCookies(): string[] {
  const expired = (name: string) => 
    `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`;
  
  return [
    // Unified cookies
    expired(COOKIE_NAMES.access),
    expired(COOKIE_NAMES.refresh),
    // Legacy producer cookies (clear from old sessions)
    expired(LEGACY_COOKIE_NAMES.producer.access),
    expired(LEGACY_COOKIE_NAMES.producer.refresh),
    // Legacy buyer cookies (clear from old sessions)
    expired(LEGACY_COOKIE_NAMES.buyer.access),
    expired(LEGACY_COOKIE_NAMES.buyer.refresh),
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
