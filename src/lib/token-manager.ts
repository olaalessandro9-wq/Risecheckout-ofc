/**
 * Token Manager - Centralized token storage and refresh logic
 * 
 * RISE Protocol V3: Single source of truth for token operations
 * 
 * Features:
 * - Automatic token refresh before expiration
 * - Prevents concurrent refresh calls
 * - Clears tokens on refresh failure
 * - Type-safe for producer and buyer domains
 * - ENHANCED: Supports Refresh Token Rotation
 */

import { SUPABASE_URL } from "@/config/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("TokenManager");

// ============================================
// TYPES
// ============================================

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp in ms
}

interface RefreshResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string; // NEW: Rotated refresh token
  expiresIn?: number;
  error?: string;
}

type TokenType = "producer" | "buyer";

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEYS = {
  producer: {
    access: "producer_session_token",
    refresh: "producer_refresh_token",
    expiresAt: "producer_token_expires_at",
  },
  buyer: {
    access: "buyer_session_token",
    refresh: "buyer_refresh_token",
    expiresAt: "buyer_token_expires_at",
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
   * Store tokens after login
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    const keys = STORAGE_KEYS[this.type];
    const expiresAt = Date.now() + expiresIn * 1000;
    
    try {
      localStorage.setItem(keys.access, accessToken);
      localStorage.setItem(keys.refresh, refreshToken);
      localStorage.setItem(keys.expiresAt, String(expiresAt));
      log.info(`Tokens stored for ${this.type}`);
    } catch (error) {
      log.error("Failed to store tokens", error);
    }
  }
  
  /**
   * Get access token - automatically refreshes if needed
   * Returns null if no valid token is available
   */
  async getValidAccessToken(): Promise<string | null> {
    const keys = STORAGE_KEYS[this.type];
    
    try {
      const accessToken = localStorage.getItem(keys.access);
      const expiresAt = Number(localStorage.getItem(keys.expiresAt) || 0);
      
      if (!accessToken) {
        return null;
      }
      
      // Check if token needs refresh (expired or about to expire)
      if (this.needsRefresh(expiresAt)) {
        log.info(`Token expiring for ${this.type}, attempting refresh...`);
        const refreshed = await this.refresh();
        
        if (!refreshed) {
          log.warn(`Token refresh failed for ${this.type}`);
          return null;
        }
        
        // Return the new access token
        return localStorage.getItem(keys.access);
      }
      
      return accessToken;
    } catch (error) {
      log.error("Error getting access token", error);
      return null;
    }
  }
  
  /**
   * Get access token synchronously (no refresh)
   * Use this when you need immediate access without waiting for refresh
   */
  getAccessTokenSync(): string | null {
    const keys = STORAGE_KEYS[this.type];
    try {
      return localStorage.getItem(keys.access);
    } catch {
      return null;
    }
  }
  
  /**
   * Check if a valid access token exists (without refreshing)
   */
  hasValidToken(): boolean {
    const keys = STORAGE_KEYS[this.type];
    try {
      const accessToken = localStorage.getItem(keys.access);
      const expiresAt = Number(localStorage.getItem(keys.expiresAt) || 0);
      return !!accessToken && Date.now() < expiresAt;
    } catch {
      return false;
    }
  }
  
  /**
   * Refresh tokens using the refresh token
   * Returns true if successful, false otherwise
   * ENHANCED: Now handles refresh token rotation
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
   * Clear all tokens (on logout)
   */
  clearTokens(): void {
    const keys = STORAGE_KEYS[this.type];
    try {
      localStorage.removeItem(keys.access);
      localStorage.removeItem(keys.refresh);
      localStorage.removeItem(keys.expiresAt);
      log.info(`Tokens cleared for ${this.type}`);
    } catch (error) {
      log.error("Failed to clear tokens", error);
    }
  }
  
  // ========== PRIVATE METHODS ==========
  
  private needsRefresh(expiresAt: number): boolean {
    return Date.now() + REFRESH_BUFFER_MS >= expiresAt;
  }
  
  private async doRefresh(): Promise<boolean> {
    const keys = STORAGE_KEYS[this.type];
    const refreshToken = localStorage.getItem(keys.refresh);
    
    if (!refreshToken) {
      log.warn(`No refresh token available for ${this.type}`);
      this.clearTokens();
      return false;
    }
    
    try {
      const endpoint = this.type === "producer" 
        ? "/functions/v1/producer-auth/refresh"
        : "/functions/v1/buyer-auth/refresh";
        
      const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      
      const data: RefreshResponse = await response.json();
      
      if (data.success && data.accessToken && data.expiresIn) {
        const expiresAt = Date.now() + data.expiresIn * 1000;
        localStorage.setItem(keys.access, data.accessToken);
        localStorage.setItem(keys.expiresAt, String(expiresAt));
        
        // ROTATION: Store new refresh token if received
        if (data.refreshToken) {
          localStorage.setItem(keys.refresh, data.refreshToken);
          log.info(`Refresh token rotated for ${this.type}`);
        }
        
        log.info(`Token refreshed successfully for ${this.type}`);
        return true;
      }
      
      // Refresh failed - clear all tokens
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
