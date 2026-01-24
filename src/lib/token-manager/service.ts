/**
 * Token Service - Public API for Token Lifecycle Management
 * 
 * RISE Protocol V3: Unified Token Service
 * 
 * All authentication flows now use the unified service.
 * Legacy buyer/producer services have been removed.
 */

import type { 
  TokenState, 
  TokenEvent, 
  TokenContext,
  TokenType,
  TokenStateSubscriber,
} from "./types";
import { transition, INITIAL_STATE, INITIAL_CONTEXT, needsRefresh, isExpired } from "./machine";
import { persistTokenState, restoreTokenState, clearPersistedState } from "./persistence";
import { HeartbeatManager } from "./heartbeat";
import { executeRefresh } from "./refresh";
import { createLogger } from "@/lib/logger";

// ============================================
// TOKEN SERVICE CLASS
// ============================================

export class TokenService {
  private readonly type: TokenType;
  private state: TokenState = INITIAL_STATE;
  private context: TokenContext = { ...INITIAL_CONTEXT };
  private readonly subscribers: Set<TokenStateSubscriber> = new Set();
  private readonly heartbeat: HeartbeatManager;
  private refreshPromise: Promise<boolean> | null = null;
  private readonly log;
  
  constructor(type: TokenType) {
    this.type = type;
    this.log = createLogger(`TokenService:${type}`);
    this.heartbeat = new HeartbeatManager(() => this.checkTokenStatus());
    
    this.restoreState();
    this.heartbeat.start();
  }
  
  // ========== PUBLIC API ==========
  
  /** Mark as authenticated after successful login */
  setAuthenticated(expiresIn: number): void {
    this.dispatch({ type: "LOGIN_SUCCESS", expiresIn });
  }
  
  /** Get current state */
  getState(): TokenState {
    return this.state;
  }
  
  /** Get current context (copy) */
  getContext(): TokenContext {
    return { ...this.context };
  }
  
  /** Check if authenticated and valid */
  hasValidToken(): boolean {
    const validStates: TokenState[] = ["authenticated", "expiring", "refreshing"];
    return validStates.includes(this.state) && !isExpired(this.context);
  }
  
  /** Get valid access token (with auto-refresh if needed) */
  async getValidAccessToken(): Promise<string | null> {
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
    
    // If now expiring or expired, trigger refresh
    if (this.state === "expiring" || this.state === "expired") {
      const success = await this.refresh();
      return success ? "cookie-authenticated" : null;
    }
    
    return this.hasValidToken() ? "cookie-authenticated" : null;
  }
  
  /** Synchronous token check (no refresh attempt) */
  getAccessTokenSync(): string | null {
    return this.hasValidToken() ? "cookie-authenticated" : null;
  }
  
  /** Trigger token refresh */
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
    
    this.refreshPromise = this.executeRefreshFlow();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    
    return result;
  }
  
  /** Clear all auth state (logout) */
  clearTokens(): void {
    this.dispatch({ type: "LOGOUT" });
    clearPersistedState(this.type);
  }
  
  /** Subscribe to state changes */
  subscribe(callback: TokenStateSubscriber): () => void {
    this.subscribers.add(callback);
    callback(this.state, this.context); // Immediate notification
    return () => this.subscribers.delete(callback);
  }
  
  /** Wait for refresh to complete if one is in progress */
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
    
    persistTokenState(this.type, this.state, this.context);
    this.notifySubscribers();
  }
  
  private async executeRefreshFlow(): Promise<boolean> {
    const result = await executeRefresh(this.type);
    
    if (result.success && result.expiresIn) {
      this.dispatch({ type: "REFRESH_SUCCESS", expiresIn: result.expiresIn });
      return true;
    }
    
    this.dispatch({ type: "REFRESH_FAILED", error: result.error || "Refresh failed" });
    return false;
  }
  
  private restoreState(): void {
    const persisted = restoreTokenState(this.type);
    
    if (!persisted.state || !persisted.expiresAt) {
      return; // Stay in idle
    }
    
    // Check if expired - trigger immediate refresh attempt
    if (Date.now() >= persisted.expiresAt) {
      this.log.info("Restored session is expired, attempting refresh");
      this.state = "expired";
      this.context = {
        ...this.context,
        expiresAt: persisted.expiresAt,
        lastRefreshAttempt: persisted.lastRefreshAttempt,
        errorMessage: "Session expired",
      };
      
      // RISE V3: Tentar refresh automático ao restaurar sessão expirada
      // O refresh token pode ainda estar válido (30 dias)
      setTimeout(() => {
        this.log.info("Auto-refresh triggered for expired session");
        this.refresh().then(success => {
          if (!success) {
            this.log.warn("Auto-refresh failed, user needs to re-login");
          }
        });
      }, 100);
      return;
    }
    
    // Restore valid session
    this.state = "authenticated";
    this.context = {
      ...this.context,
      expiresAt: persisted.expiresAt,
      lastRefreshAttempt: persisted.lastRefreshAttempt,
    };
    
    const expiresIn = Math.round((persisted.expiresAt - Date.now()) / 1000);
    this.log.info("Session restored", { expiresIn });
  }
  
  private checkTokenStatus(): void {
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
// SINGLETON INSTANCE
// ============================================

/**
 * UNIFIED TOKEN SERVICE - The ONLY token service
 * 
 * This is the single token service that manages authentication
 * via the unified-auth system with __Host-rise_* cookies.
 */
export const unifiedTokenService = new TokenService("unified");
