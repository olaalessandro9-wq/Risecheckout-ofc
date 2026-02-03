/**
 * Session Reader - Unified Token Extraction
 * 
 * RISE Protocol V3: Reads auth tokens from unified cookies ONLY.
 * 
 * LEGACY REMOVED (2026-02-03):
 * - Zero fallbacks, zero deprecated aliases
 * - Only V4 cookie format (__Secure-rise_*)
 * 
 * @version 5.0.0 - Complete legacy purge
 */

import { 
  getAccessToken, 
  getRefreshToken,
  COOKIE_NAMES,
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
// STANDARD EXPORTS
// ============================================

/**
 * Alias for API consistency.
 * Points to the unified token getter.
 */
export const getSessionToken = getUnifiedAccessToken;

/**
 * Re-export cookie names for convenience.
 */
export { COOKIE_NAMES };
