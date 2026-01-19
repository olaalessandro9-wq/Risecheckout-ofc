/**
 * Token Refresh - Backend Communication
 * 
 * RISE Protocol V3: Single Responsibility - HTTP Only
 * 
 * This module handles all HTTP communication for token refresh,
 * isolating network I/O from the main service logic.
 */

import type { TokenType, RefreshResponse } from "./types";
import { SUPABASE_URL } from "@/config/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("TokenRefresh");

// ============================================
// TYPES
// ============================================

export interface RefreshResult {
  success: boolean;
  expiresIn?: number;
  error?: string;
}

// ============================================
// ENDPOINT MAPPING
// ============================================

const REFRESH_ENDPOINTS: Record<TokenType, string> = {
  producer: "/functions/v1/producer-auth/refresh",
  buyer: "/functions/v1/buyer-auth/refresh",
} as const;

// ============================================
// REFRESH FUNCTION
// ============================================

/**
 * Execute token refresh request to backend
 * 
 * Makes HTTP POST with credentials (httpOnly cookies)
 * to the appropriate auth endpoint.
 */
export async function executeRefresh(type: TokenType): Promise<RefreshResult> {
  const endpoint = REFRESH_ENDPOINTS[type];
  const url = `${SUPABASE_URL}${endpoint}`;
  
  log.debug("Executing refresh", { type, endpoint });
  
  try {
    const response = await fetch(url, {
      method: "POST",
      credentials: "include", // CRITICAL: Send httpOnly cookies
      headers: { "Content-Type": "application/json" },
    });
    
    const data: RefreshResponse = await response.json();
    
    if (data.success && data.expiresIn) {
      log.info("Refresh successful", { expiresIn: data.expiresIn });
      return { success: true, expiresIn: data.expiresIn };
    }
    
    const error = data.error || "Refresh failed";
    log.warn("Refresh failed", { error });
    return { success: false, error };
    
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    log.error("Refresh request failed", error);
    return { success: false, error: message };
  }
}
