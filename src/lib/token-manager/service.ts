/**
 * Token Service - Public API for Token Lifecycle Management
 * 
 * RISE Protocol V3: Encapsulated FSM with Reactive Subscriptions
 * 
 * This service wraps the FSM and provides:
 * - Public methods for auth operations
 * - Automatic timer management
 * - State persistence
 * - Subscriber notifications
 */

import type { 
  TokenState, 
  TokenEvent, 
  TokenContext,
  TokenType,
  TokenStateSubscriber,
  RefreshResponse,
} from "./types";
import { STORAGE_KEYS, TOKEN_TIMING } from "./types";
import { transition, INITIAL_STATE, INITIAL_CONTEXT, needsRefresh, isExpired } from "./machine";
import { SUPABASE_URL } from "@/config/supabase";
import { createLogger } from "@/lib/logger";

// ============================================
// TOKEN SERVICE CLASS
// ============================================

export class TokenService {
  private type: TokenType;
  private state: TokenState = INITIAL_STATE;
  private context: TokenContext = { ...INITIAL_CONTEXT };
  private subscribers: Set<TokenStateSubscriber> = new Set();
  private heartbeatTimer: number | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private log;
  
  constructor(type: TokenType) {
    this.type = type;
    this.log = createLogger(`TokenService:${type}`);
    this.restoreState();
    this.startHeartbeat();
  }
  
  // ========== PUBLIC API ==========
  
  /**
   * Mark as authenticated after successful login
   */
  setAuthenticated(expiresIn: number): void {
    this.dispatch({ type: "LOGIN_SUCCESS", expiresIn });
  }
  
  /**
   * Get current state
   */
  getState(): TokenState {
    return this.state;
  }
  
  /**
   * Get current context
   */
  getContext(): TokenContext {
    return { ...this.context };
  }
  
  /**
   * Check if authenticated and valid
   */
  hasValidToken(): boolean {
    return (
      (this.state === "authenticated" || this.state === "expiring" || this.state === "refreshing") &&
      !isExpired(this.context)
    );
  }
  
  /**
   * Get valid access token (with auto-refresh if needed)
   * Returns marker string since actual token is in httpOnly cookie
   */
  async getValidAccessToken(): Promise<string | null> {
    // Not authenticated at all
    if (this.state === "idle" || this.state === "error") {
      return null;
    }
    
    // Already refreshing - wait for it
    if (this.state === "refreshing" && this.refreshPromise) {
      const success = await this.refreshPromise;
      return success ? "cookie-authenticated" : null;
    }
    
    // Check if needs refresh
    if (needsRefresh(this.context) && this.state === "authenticated") {
      this.dispatch({ type: "TIMER_NEAR_EXPIRY" });
    }
    
    // If now expiring, trigger refresh
    if (this.state === "expiring") {
      const success = await this.refresh();
      return success ? "cookie-authenticated" : null;
    }
    
    // Expired - try one refresh
    if (this.state === "expired") {
      const success = await this.refresh();
      return success ? "cookie-authenticated" : null;
    }
    
    return this.hasValidToken() ? "cookie-authenticated" : null;
  }
  
  /**
   * Synchronous token check (no refresh attempt)
   */
  getAccessTokenSync(): string | null {
    return this.hasValidToken() ? "cookie-authenticated" : null;
  }
  
  /**
   * Trigger token refresh
   */
  async refresh(): Promise<boolean> {
    // Prevent concurrent refreshes
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    // Can only refresh from certain states
    if (this.state === "idle" || this.state === "error") {
      return false;
    }
    
    this.dispatch({ type: "REFRESH_START" });
    
    this.refreshPromise = this.doRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    
    return result;
  }
  
  /**
   * Clear all auth state (logout)
   */
  clearTokens(): void {
    this.dispatch({ type: "LOGOUT" });
  }
  
  /**
   * Subscribe to state changes
   */
  subscribe(callback: TokenStateSubscriber): () => void {
    this.subscribers.add(callback);
    
    // Immediately notify of current state
    callback(this.state, this.context);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }
  
  /**
   * Wait for refresh to complete if one is in progress
   */
  async waitForRefresh(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    return this.state === "authenticated";
  }
  
  // ========== PRIVATE METHODS ==========
  
  private dispatch(event: TokenEvent): void {
    const result = transition(this.state, event, this.context);
    
    if (!result) {
      this.log.warn(`Invalid transition: ${this.state} + ${event.type}`);
      return;
    }
    
    const prevState = this.state;
    this.state = result.nextState;
    this.context = result.nextContext;
    
    this.log.info(`State: ${prevState} → ${this.state}`);
    
    // Persist state
    this.persistState();
    
    // Notify subscribers
    this.notifySubscribers();
  }
  
  private async doRefresh(): Promise<boolean> {
    try {
      const endpoint = this.type === "producer"
        ? "/functions/v1/producer-auth/refresh"
        : "/functions/v1/buyer-auth/refresh";
      
      const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
        method: "POST",
        credentials: "include", // CRITICAL: Send httpOnly cookies
        headers: { "Content-Type": "application/json" },
      });
      
      const data: RefreshResponse = await response.json();
      
      if (data.success && data.expiresIn) {
        this.dispatch({ type: "REFRESH_SUCCESS", expiresIn: data.expiresIn });
        return true;
      }
      
      this.dispatch({ 
        type: "REFRESH_FAILED", 
        error: data.error || "Refresh failed",
      });
      return false;
      
    } catch (error) {
      this.log.error("Refresh request failed", error);
      this.dispatch({ 
        type: "REFRESH_FAILED", 
        error: error instanceof Error ? error.message : "Network error",
      });
      return false;
    }
  }
  
  private persistState(): void {
    const keys = STORAGE_KEYS[this.type];
    
    try {
      if (this.state === "idle") {
        localStorage.removeItem(keys.state);
        localStorage.removeItem(keys.expiresAt);
        localStorage.removeItem(keys.lastRefresh);
      } else {
        localStorage.setItem(keys.state, this.state);
        if (this.context.expiresAt) {
          localStorage.setItem(keys.expiresAt, String(this.context.expiresAt));
        }
        if (this.context.lastRefreshAttempt) {
          localStorage.setItem(keys.lastRefresh, String(this.context.lastRefreshAttempt));
        }
      }
    } catch (error) {
      this.log.error("Failed to persist state", error);
    }
  }
  
  private restoreState(): void {
    const keys = STORAGE_KEYS[this.type];
    
    try {
      const savedState = localStorage.getItem(keys.state) as TokenState | null;
      const expiresAt = Number(localStorage.getItem(keys.expiresAt) || 0);
      const lastRefresh = Number(localStorage.getItem(keys.lastRefresh) || 0);
      
      if (!savedState || !expiresAt) {
        return; // Stay in idle
      }
      
      // Check if expired
      if (Date.now() >= expiresAt) {
        this.log.info("Restored session is expired");
        this.state = "expired";
        this.context = {
          ...this.context,
          expiresAt,
          lastRefreshAttempt: lastRefresh || null,
          errorMessage: "Session expired",
        };
        return;
      }
      
      // Restore valid session
      this.state = "authenticated";
      this.context = {
        ...this.context,
        expiresAt,
        lastRefreshAttempt: lastRefresh || null,
      };
      
      this.log.info("Session restored", { expiresIn: Math.round((expiresAt - Date.now()) / 1000) });
      
    } catch (error) {
      this.log.error("Failed to restore state", error);
    }
  }
  
  private startHeartbeat(): void {
    // Clear any existing timer
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    // Check token status periodically
    this.heartbeatTimer = window.setInterval(() => {
      this.checkTokenStatus();
    }, TOKEN_TIMING.HEARTBEAT_INTERVAL_MS);
    
    // Also check immediately
    this.checkTokenStatus();
  }
  
  private checkTokenStatus(): void {
    // Only check if authenticated
    if (this.state !== "authenticated") {
      return;
    }
    
    if (isExpired(this.context)) {
      this.dispatch({ type: "TIMER_EXPIRED" });
      return;
    }
    
    if (needsRefresh(this.context)) {
      this.log.info("Proactive refresh triggered by heartbeat");
      this.dispatch({ type: "TIMER_NEAR_EXPIRY" });
      // Auto-trigger refresh
      this.refresh();
    }
  }
  
  private notifySubscribers(): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(this.state, this.context);
      } catch (error) {
        this.log.error("Subscriber error", error);
      }
    }
  }
}

// ============================================
// SINGLETON INSTANCES
// ============================================

export const producerTokenService = new TokenService("producer");
export const buyerTokenService = new TokenService("buyer");

// Backward compatibility aliases
export const producerTokenManager = producerTokenService;
export const buyerTokenManager = buyerTokenService;
