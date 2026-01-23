/**
 * Session Reader - Unified Token Extraction
 * 
 * RISE Protocol V3: Reads auth tokens from unified cookies only.
 * Legacy cookie support removed - use cookie-helper.ts LEGACY_COOKIE_NAMES for clearing only.
 * 
 * @version 3.0.0 - Legacy cleanup complete
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
// LEGACY READERS (For clearing old sessions)
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
// ALIASES (Backwards compatibility during migration)
// ============================================

/**
 * @deprecated Use getUnifiedAccessToken instead
 */
export const getSessionToken = getUnifiedAccessToken;

/**
 * @deprecated Use getUnifiedAccessToken instead
 */
export const getProducerAccessToken = getUnifiedAccessToken;

/**
 * @deprecated Use getUnifiedRefreshToken instead
 */
export const getProducerRefreshToken = getUnifiedRefreshToken;

/**
 * @deprecated Use getUnifiedAccessToken instead
 */
export const getBuyerAccessToken = getUnifiedAccessToken;

/**
 * @deprecated Use getUnifiedRefreshToken instead
 */
export const getBuyerRefreshToken = getUnifiedRefreshToken;
