/**
 * Session Reader - Unified Token Extraction
 * 
 * RISE Protocol V3: Reads auth tokens from unified cookies ONLY.
 * 
 * LEGACY REMOVED (2026-01-23):
 * - Zero deprecated aliases (getProducerAccessToken, getBuyerAccessToken)
 * - Zero legacy cookie reading
 * - Only hasLegacyCookies() kept for logout cleanup
 * 
 * @version 4.0.0 - Complete legacy cleanup
 */

import { 
  getAccessToken, 
  getRefreshToken,
  getCookie,
  COOKIE_NAMES,
  LEGACY_COOKIE_NAMES,
} from "./cookie-helper.ts";

// ============================================
// UNIFIED SESSION TOKEN READERS
// ============================================

/**
 * Gets unified access token from request.
 * 
 * @param req - Request object
 * @returns Access token or null
 */
export function getUnifiedAccessToken(req: Request): string | null {
  return getAccessToken(req);
}

/**
 * Gets unified refresh token from request.
 * 
 * @param req - Request object
 * @returns Refresh token or null
 */
export function getUnifiedRefreshToken(req: Request): string | null {
  return getRefreshToken(req);
}

// ============================================
// LEGACY COOKIE DETECTION (For logout cleanup only)
// ============================================

/**
 * Checks if request has any legacy cookies that should be cleared.
 * Used by logout to ensure complete cleanup.
 * 
 * @param req - Request object
 * @returns true if legacy cookies are present
 */
export function hasLegacyCookies(req: Request): boolean {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) return false;
  
  return (
    getCookie(cookieHeader, LEGACY_COOKIE_NAMES.producer.access) !== null ||
    getCookie(cookieHeader, LEGACY_COOKIE_NAMES.producer.refresh) !== null ||
    getCookie(cookieHeader, LEGACY_COOKIE_NAMES.buyer.access) !== null ||
    getCookie(cookieHeader, LEGACY_COOKIE_NAMES.buyer.refresh) !== null
  );
}

// ============================================
// STANDARD EXPORTS
// ============================================

/**
 * Alias for API consistency.
 * Points to the unified token getter.
 */
export const getSessionToken = getUnifiedAccessToken;
