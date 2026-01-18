/**
 * Session Reader - Unified Token Extraction
 * 
 * RISE Protocol V3: Reads auth tokens from cookies (new) OR headers (fallback).
 * Provides backwards compatibility during migration to httpOnly cookies.
 * 
 * Priority:
 * 1. Cookie (httpOnly, secure, invisible to JS)
 * 2. Header (legacy, for backwards compatibility)
 * 
 * @version 1.0.0
 */

import { getAccessToken, getRefreshToken, type CookieDomain } from "./cookie-helper.ts";

// ============================================
// SESSION TOKEN READERS
// ============================================

/**
 * Gets producer access token from httpOnly cookie.
 * RISE V3: Zero legacy code - cookies only.
 * 
 * @param req - Request object
 * @returns Access token or null
 */
export function getProducerAccessToken(req: Request): string | null {
  return getAccessToken(req, "producer");
}

/**
 * Gets producer refresh token from cookie or body.
 * 
 * @param req - Request object
 * @returns Refresh token or null
 */
export function getProducerRefreshToken(req: Request): string | null {
  return getRefreshToken(req, "producer");
}

/**
 * Gets buyer access token from httpOnly cookie.
 * RISE V3: Zero legacy code - cookies only.
 * 
 * @param req - Request object
 * @returns Access token or null
 */
export function getBuyerAccessToken(req: Request): string | null {
  return getAccessToken(req, "buyer");
}

/**
 * Gets buyer refresh token from cookie.
 * 
 * @param req - Request object
 * @returns Refresh token or null
 */
export function getBuyerRefreshToken(req: Request): string | null {
  return getRefreshToken(req, "buyer");
}

// ============================================
// GENERIC READER
// ============================================

/**
 * Gets access token for a specific domain.
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
