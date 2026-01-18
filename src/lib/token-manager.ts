/**
 * Token Manager - Centralized authentication state management
 * 
 * RISE Protocol V3: Single source of truth for authentication
 * 
 * ENHANCED V4: httpOnly Cookies
 * - Tokens are now stored in httpOnly cookies (invisible to JS)
 * - This class manages authentication STATE only
 * - Actual tokens are sent/received via cookies automatically
 * - XSS attacks can no longer steal tokens
 * 
 * Features:
 * - Automatic token refresh before expiration
 * - Prevents concurrent refresh calls
 * - Clears state on refresh failure
 * - Type-safe for producer and buyer domains
 * - Supports Refresh Token Rotation
 */

import { SUPABASE_URL } from "@/config/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("TokenManager");

// ============================================
// TYPES
// ============================================

interface RefreshResponse {
  success: boolean;
  expiresIn?: number;
  error?: string;
}

type TokenType = "producer" | "buyer";

// ============================================
// CONSTANTS
// ============================================

// Local state keys (NOT tokens - just auth state)
const STATE_KEYS = {
  producer: {
    authenticated: "producer_authenticated",
    expiresAt: "producer_auth_expires_at",
  },
  buyer: {
    authenticated: "buyer_authenticated",
    expiresAt: "buyer_auth_expires_at",
  },
} as const;

// Refresh 1 minute before expiration
const REFRESH_BUFFER_MS = 60 * 1000;

// ============================================
// TOKEN MANAGER CLASS
// ============================================

export class TokenManager {
  private type: TokenType;
  private refreshPromise: Promise<boolean> | null = null;
  
  constructor(type: TokenType) {
    this.type = type;
  }
  
  // ========== PUBLIC METHODS ==========
  
  /**
   * Mark as authenticated after login
   * Tokens are stored in httpOnly cookies by the backend
   */
  setAuthenticated(expiresIn: number): void {
    const keys = STATE_KEYS[this.type];
    const expiresAt = Date.now() + expiresIn * 1000;
    
    try {
      localStorage.setItem(keys.authenticated, "true");
      localStorage.setItem(keys.expiresAt, String(expiresAt));
      log.info(`Authenticated for ${this.type} (httpOnly cookies)`);
    } catch (error) {
      log.error("Failed to store auth state", error);
    }
  }
  
  /**
   * Legacy method for backward compatibility during migration
   * Will be removed after full migration to cookies
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    // During migration, we still mark as authenticated
    // but tokens are also being set as httpOnly cookies by backend
    this.setAuthenticated(expiresIn);
    log.info(`Tokens received for ${this.type} - cookies will handle storage`);
  }
  
  /**
   * Check if authenticated - uses local state
   * Actual token validation happens via httpOnly cookie on backend
   */
  async getValidAccessToken(): Promise<string | null> {
    const keys = STATE_KEYS[this.type];
    
    try {
      const isAuthenticated = localStorage.getItem(keys.authenticated) === "true";
      const expiresAt = Number(localStorage.getItem(keys.expiresAt) || 0);
      
      if (!isAuthenticated) {
        return null;
      }
      
      // Check if we need to refresh (based on local expiry tracking)
      if (this.needsRefresh(expiresAt)) {
        log.info(`Auth expiring for ${this.type}, attempting refresh...`);
        const refreshed = await this.refresh();
        
        if (!refreshed) {
          log.warn(`Auth refresh failed for ${this.type}`);
          return null;
        }
      }
      
      // Return a marker that auth is valid - actual token is in cookie
      return "cookie-authenticated";
    } catch (error) {
      log.error("Error checking auth state", error);
      return null;
    }
  }
  
  /**
   * Check if authenticated synchronously (no refresh)
   */
  getAccessTokenSync(): string | null {
    const keys = STATE_KEYS[this.type];
    try {
      const isAuthenticated = localStorage.getItem(keys.authenticated) === "true";
      return isAuthenticated ? "cookie-authenticated" : null;
    } catch {
      return null;
    }
  }
  
  /**
   * Check if authenticated without checking expiry
   */
  hasValidToken(): boolean {
    const keys = STATE_KEYS[this.type];
    try {
      const isAuthenticated = localStorage.getItem(keys.authenticated) === "true";
      const expiresAt = Number(localStorage.getItem(keys.expiresAt) || 0);
      return isAuthenticated && Date.now() < expiresAt;
    } catch {
      return false;
    }
  }
  
  /**
   * Refresh authentication using httpOnly refresh cookie
   */
  async refresh(): Promise<boolean> {
    // Prevent concurrent refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    this.refreshPromise = this.doRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }
  
  /**
   * Clear authentication state (on logout)
   */
  clearTokens(): void {
    const keys = STATE_KEYS[this.type];
    try {
      localStorage.removeItem(keys.authenticated);
      localStorage.removeItem(keys.expiresAt);
      log.info(`Auth state cleared for ${this.type}`);
    } catch (error) {
      log.error("Failed to clear auth state", error);
    }
  }
  
  // ========== PRIVATE METHODS ==========
  
  private needsRefresh(expiresAt: number): boolean {
    return Date.now() + REFRESH_BUFFER_MS >= expiresAt;
  }
  
  private async doRefresh(): Promise<boolean> {
    const keys = STATE_KEYS[this.type];
    const isAuthenticated = localStorage.getItem(keys.authenticated) === "true";
    
    if (!isAuthenticated) {
      log.warn(`Not authenticated for ${this.type}`);
      this.clearTokens();
      return false;
    }
    
    try {
      const endpoint = this.type === "producer" 
        ? "/functions/v1/producer-auth/refresh"
        : "/functions/v1/buyer-auth/refresh";
        
      const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
        method: "POST",
        credentials: "include", // CRITICAL: Send/receive httpOnly cookies
        headers: { "Content-Type": "application/json" },
      });
      
      const data: RefreshResponse = await response.json();
      
      if (data.success && data.expiresIn) {
        const expiresAt = Date.now() + data.expiresIn * 1000;
        localStorage.setItem(keys.authenticated, "true");
        localStorage.setItem(keys.expiresAt, String(expiresAt));
        
        log.info(`Auth refreshed for ${this.type} (via httpOnly cookies)`);
        return true;
      }
      
      // Refresh failed - clear state
      log.warn(`Refresh response invalid for ${this.type}: ${data.error}`);
      this.clearTokens();
      return false;
    } catch (error) {
      log.error(`Refresh request failed for ${this.type}`, error);
      this.clearTokens();
      return false;
    }
  }
}

// ============================================
// SINGLETON INSTANCES
// ============================================

export const producerTokenManager = new TokenManager("producer");
export const buyerTokenManager = new TokenManager("buyer");
