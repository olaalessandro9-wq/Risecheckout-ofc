/**
 * Unified Token Service
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * This is the SINGLE SOURCE OF TRUTH for token management.
 * Replaces the split producer/buyer token services with a unified approach.
 * 
 * Key differences from legacy services:
 * 1. Uses unified-auth/refresh endpoint
 * 2. Works with __Host-rise_access and __Host-rise_refresh cookies
 * 3. Supports all user roles (producer, buyer, etc.)
 * 
 * @module unified-service
 */

import { TokenService } from "./service";
import { createLogger } from "@/lib/logger";

const log = createLogger("UnifiedTokenService");

// ============================================
// SINGLETON INSTANCE
// ============================================

/**
 * Unified Token Service
 * 
 * This is the ONLY token service that should be used for authentication.
 * It uses the "unified" token type which routes to unified-auth/refresh.
 * 
 * Usage:
 * ```typescript
 * import { unifiedTokenService } from "@/lib/token-manager/unified-service";
 * 
 * // Check if user is authenticated
 * const isValid = unifiedTokenService.hasValidToken();
 * 
 * // Trigger manual refresh
 * const success = await unifiedTokenService.refresh();
 * 
 * // Clear tokens on logout
 * unifiedTokenService.clearTokens();
 * ```
 */
export const unifiedTokenService = new TokenService("unified");

log.info("Unified Token Service initialized");

// ============================================
// CONVENIENCE EXPORTS
// ============================================

/**
 * Check if user is currently authenticated (synchronous)
 */
export function isAuthenticated(): boolean {
  return unifiedTokenService.hasValidToken();
}

/**
 * Trigger token refresh
 */
export async function refreshToken(): Promise<boolean> {
  return unifiedTokenService.refresh();
}

/**
 * Clear all authentication state
 */
export function clearAuth(): void {
  unifiedTokenService.clearTokens();
}

/**
 * Set authenticated state after login
 */
export function setAuthenticated(expiresIn: number): void {
  unifiedTokenService.setAuthenticated(expiresIn);
}

/**
 * Subscribe to authentication state changes
 */
export function subscribeToAuth(
  callback: Parameters<typeof unifiedTokenService.subscribe>[0]
): () => void {
  return unifiedTokenService.subscribe(callback);
}
