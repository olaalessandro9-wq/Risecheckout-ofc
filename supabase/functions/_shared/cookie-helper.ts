/**
 * Cookie Helper - Secure httpOnly Cookie Management
 * 
 * RISE Protocol V3: Centralized cookie management for auth security.
 * All auth tokens are now stored in httpOnly cookies (invisible to JavaScript).
 * 
 * Security Features:
 * - httpOnly: Prevents XSS attacks from reading tokens
 * - Secure: Only sent over HTTPS
 * - SameSite=None: Required for cross-origin with credentials
 * - Partitioned: CHIPS for third-party context isolation
 * - __Host- prefix: Prevents domain override attacks
 * 
 * @version 1.0.0
 */

import { ACCESS_TOKEN_DURATION_MINUTES, REFRESH_TOKEN_DURATION_DAYS } from "./auth-constants.ts";

// ============================================
// COOKIE NAMES
// ============================================

/**
 * Cookie names with __Host- prefix for maximum security.
 * __Host- prefix requirements:
 * - Secure flag MUST be set
 * - Path MUST be "/"
 * - Domain MUST NOT be set
 */
export const COOKIE_NAMES = {
  producer: {
    access: "__Host-producer_access",
    refresh: "__Host-producer_refresh",
  },
  buyer: {
    access: "__Host-buyer_access",
    refresh: "__Host-buyer_refresh",
  },
} as const;

export type CookieDomain = "producer" | "buyer";

// ============================================
// COOKIE OPTIONS
// ============================================

export interface CookieOptions {
  maxAge: number;       // seconds
  httpOnly: boolean;
  secure: boolean;
  sameSite: "None" | "Lax" | "Strict";
  path: string;
}

const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  maxAge: ACCESS_TOKEN_DURATION_MINUTES * 60, // 15 minutes in seconds
  httpOnly: true,
  secure: true,
  sameSite: "None",
  path: "/",
};

// ============================================
// COOKIE CREATION
// ============================================

/**
 * Creates a secure cookie string with all security flags.
 * 
 * @param name - Cookie name (use COOKIE_NAMES)
 * @param value - Cookie value (token)
 * @param options - Override default options
 * @returns Cookie string for Set-Cookie header
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
  
  // CHIPS: Partitioned cookies for third-party context
  parts.push("Partitioned");
  
  return parts.join("; ");
}

/**
 * Creates access token cookie.
 */
export function createAccessCookie(domain: CookieDomain, accessToken: string): string {
  const name = COOKIE_NAMES[domain].access;
  return createSecureCookie(name, accessToken, {
    maxAge: ACCESS_TOKEN_DURATION_MINUTES * 60,
  });
}

/**
 * Creates refresh token cookie.
 */
export function createRefreshCookie(domain: CookieDomain, refreshToken: string): string {
  const name = COOKIE_NAMES[domain].refresh;
  return createSecureCookie(name, refreshToken, {
    maxAge: REFRESH_TOKEN_DURATION_DAYS * 24 * 60 * 60, // days to seconds
  });
}

// ============================================
// COOKIE EXPIRATION (LOGOUT)
// ============================================

/**
 * Creates an expired cookie to clear it from the browser.
 * 
 * @param name - Cookie name to expire
 * @returns Cookie string that expires immediately
 */
export function createExpiredCookie(name: string): string {
  return `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`;
}

/**
 * Creates expired access token cookie for logout.
 */
export function createExpiredAccessCookie(domain: CookieDomain): string {
  return createExpiredCookie(COOKIE_NAMES[domain].access);
}

/**
 * Creates expired refresh token cookie for logout.
 */
export function createExpiredRefreshCookie(domain: CookieDomain): string {
  return createExpiredCookie(COOKIE_NAMES[domain].refresh);
}

// ============================================
// COOKIE READING
// ============================================

/**
 * Extracts a cookie value from the Cookie header.
 * 
 * @param cookieHeader - Raw Cookie header string
 * @param name - Cookie name to extract
 * @returns Cookie value or null if not found
 */
export function getCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  
  // Match the cookie name with proper boundary handling
  // Handles: "name=value", "; name=value", "name=value; ..."
  const regex = new RegExp(`(?:^|; )${escapeRegex(name)}=([^;]*)`);
  const match = cookieHeader.match(regex);
  
  return match ? match[1] : null;
}

/**
 * Gets access token from cookies.
 */
export function getAccessToken(req: Request, domain: CookieDomain): string | null {
  const cookieHeader = req.headers.get("Cookie");
  return getCookie(cookieHeader, COOKIE_NAMES[domain].access);
}

/**
 * Gets refresh token from cookies.
 */
export function getRefreshToken(req: Request, domain: CookieDomain): string | null {
  const cookieHeader = req.headers.get("Cookie");
  return getCookie(cookieHeader, COOKIE_NAMES[domain].refresh);
}

// ============================================
// RESPONSE HELPERS
// ============================================

/**
 * Creates a Response with multiple Set-Cookie headers.
 * 
 * @param data - Response body
 * @param corsHeaders - CORS headers
 * @param cookies - Array of cookie strings
 * @param status - HTTP status code
 */
export function jsonResponseWithCookies(
  data: unknown,
  corsHeaders: Record<string, string>,
  cookies: string[],
  status = 200
): Response {
  const headers = new Headers(corsHeaders);
  headers.set("Content-Type", "application/json");
  
  // Add each cookie as a separate Set-Cookie header
  for (const cookie of cookies) {
    headers.append("Set-Cookie", cookie);
  }
  
  return new Response(JSON.stringify(data), { status, headers });
}

/**
 * Creates auth cookies (access + refresh) for login/refresh responses.
 */
export function createAuthCookies(
  domain: CookieDomain,
  accessToken: string,
  refreshToken: string
): string[] {
  return [
    createAccessCookie(domain, accessToken),
    createRefreshCookie(domain, refreshToken),
  ];
}

/**
 * Creates expired cookies for logout.
 */
export function createLogoutCookies(domain: CookieDomain): string[] {
  return [
    createExpiredAccessCookie(domain),
    createExpiredRefreshCookie(domain),
  ];
}

// ============================================
// UTILITIES
// ============================================

/**
 * Escapes special regex characters in cookie name.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
