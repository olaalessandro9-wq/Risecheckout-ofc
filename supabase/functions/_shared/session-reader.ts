/**
 * Session Reader - Unified Token Extraction
 * 
 * RISE Protocol V3: Reads auth tokens from cookies with priority:
 * 1. Unified cookies (__Host-rise_*) - new system
 * 2. Producer cookies (__Host-producer_*) - legacy
 * 3. Buyer cookies (__Host-buyer_*) - legacy
 * 
 * @version 2.0.0 - Security fix: try unified cookies first
 */

import { 
  getAccessToken, 
  getRefreshToken, 
  getCookie,
  type CookieDomain 
} from "./cookie-helper.ts";
import { UNIFIED_COOKIE_NAMES } from "./unified-auth-v2.ts";

// ============================================
// SESSION TOKEN READERS
// ============================================

/**
 * Gets producer access token, trying unified format first.
 * 
 * Priority:
 * 1. __Host-rise_access (unified)
 * 2. __Host-producer_access (legacy)
 * 
 * @param req - Request object
 * @returns Access token or null
 */
export function getProducerAccessToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) return null;
  
  // Try unified format first (new system)
  const unified = getCookie(cookieHeader, UNIFIED_COOKIE_NAMES.access);
  if (unified) return unified;
  
  // Fallback to legacy producer format
  return getAccessToken(req, "producer");
}

/**
 * Gets producer refresh token, trying unified format first.
 * 
 * @param req - Request object
 * @returns Refresh token or null
 */
export function getProducerRefreshToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) return null;
  
  // Try unified format first
  const unified = getCookie(cookieHeader, UNIFIED_COOKIE_NAMES.refresh);
  if (unified) return unified;
  
  // Fallback to legacy
  return getRefreshToken(req, "producer");
}

/**
 * Gets buyer access token, trying unified format first.
 * 
 * Priority:
 * 1. __Host-rise_access (unified)
 * 2. __Host-buyer_access (legacy)
 * 
 * @param req - Request object
 * @returns Access token or null
 */
export function getBuyerAccessToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) return null;
  
  // Try unified format first (new system)
  const unified = getCookie(cookieHeader, UNIFIED_COOKIE_NAMES.access);
  if (unified) return unified;
  
  // Fallback to legacy buyer format
  return getAccessToken(req, "buyer");
}

/**
 * Gets buyer refresh token, trying unified format first.
 * 
 * @param req - Request object
 * @returns Refresh token or null
 */
export function getBuyerRefreshToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) return null;
  
  // Try unified format first
  const unified = getCookie(cookieHeader, UNIFIED_COOKIE_NAMES.refresh);
  if (unified) return unified;
  
  // Fallback to legacy
  return getRefreshToken(req, "buyer");
}

// ============================================
// GENERIC READER
// ============================================

/**
 * Gets access token for a specific domain, trying unified format first.
 * 
 * @param req - Request object
 * @param domain - "producer" or "buyer"
 * @returns Access token or null
 */
export function getSessionToken(req: Request, domain: CookieDomain): string | null {
  if (domain === "producer") {
    return getProducerAccessToken(req);
  }
  return getBuyerAccessToken(req);
}
