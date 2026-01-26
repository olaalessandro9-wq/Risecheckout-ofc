/**
 * Token Service - Public API for Token Lifecycle Management
 * 
 * RISE Protocol V3: Session Commander Architecture (2026-01-26)
 * 
 * This service manages token state and delegates refresh operations
 * to Session Commander for unified coordination.
 * 
 * ARCHITECTURE:
 * TokenService.refresh() → SessionCommander.requestRefresh() → /request-refresh
 * Server-side locking prevents cross-tab race conditions.
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
import { crossTabLock } from "./cross-tab-lock";
import { sessionCommander } from "@/lib/session-commander";
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
  private lastVisibilityCheck: number = 0;
  private initialized: boolean = false;
  
  /**
   * RISE V3: Lazy Initialization Constructor
   * 
   * The constructor no longer restores state or starts heartbeat.
   * Call initialize() explicitly in authenticated contexts.
   * This prevents auth-related side effects in public routes.
   */
  constructor(type: TokenType) {
    this.type = type;
    this.log = createLogger(`TokenService:${type}`);
    this.heartbeat = new HeartbeatManager(() => this.checkTokenStatus());
    // NO auto-initialization - call initialize() explicitly
  }
  
  /**
   * Initialize the TokenService.
   * 
   * RISE V3: Must be called explicitly in authenticated contexts.
   * This is idempotent - safe to call multiple times.
   * 
   * Call this from useUnifiedAuth when the user is authenticated.
   */
  initialize(): void {
    if (this.initialized) {
      return; // Already initialized
    }
    
    this.log.info("TokenService initializing (lazy)");
    this.initialized = true;
    
    this.restoreState();
    this.heartbeat.start();
    this.setupVisibilityListener();
  }
  
  /**
   * Check if the service has been initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  // ========== VISIBILITY CHANGE HANDLER ==========
  
  /**
   * RISE V3: Visibility-aware session restoration
   * 
   * Browsers throttle/pause setInterval in background tabs.
   * When user returns, we IMMEDIATELY check and refresh if needed.
   */
  private setupVisibilityListener(): void {
    if (typeof document === "undefined") return;
    
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.handleVisibilityRestore();
      }
    });
    
    // Also handle focus events for additional coverage
    window.addEventListener("focus", () => {
      this.handleVisibilityRestore();
    });
    
    this.log.debug("Visibility listener initialized");
  }
  
  /**
   * Called when tab becomes visible or window gains focus.
   * Immediately checks token status and refreshes if expired.
   */
  private async handleVisibilityRestore(): Promise<void> {
    // Debounce: prevent multiple rapid checks
    const now = Date.now();
    if (now - this.lastVisibilityCheck < 1000) {
      return;
    }
    this.lastVisibilityCheck = now;
    
    // Only act if we think we're authenticated
    if (this.state === "idle" || this.state === "error") {
      return;
    }
    
    this.log.debug("Visibility restored, checking token status", {
      state: this.state,
      expiresAt: this.context.expiresAt,
      now: Date.now(),
    });
    
    // If token is expired, attempt immediate refresh
    if (isExpired(this.context)) {
      this.log.info("Token expired during background - attempting immediate refresh");
      this.dispatch({ type: "TIMER_EXPIRED" });
      const success = await this.refresh();
      
      if (success) {
        this.log.info("Session restored after visibility change");
      } else {
        this.log.warn("Failed to restore session after visibility change");
      }
      return;
    }
    
    // If token is near expiry, proactively refresh
    if (needsRefresh(this.context)) {
      this.log.info("Token near expiry after visibility restore - proactive refresh");
      this.dispatch({ type: "TIMER_NEAR_EXPIRY" });
      this.refresh();
    }
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
  
  /** 
   * Trigger token refresh with cross-tab coordination
   * 
   * RISE V3: Uses CrossTabLock to prevent concurrent refresh from multiple tabs.
   * If another tab is already refreshing, this tab waits for the result.
   */
  async refresh(): Promise<boolean> {
    // Prevent concurrent refreshes within this tab
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    // Can only refresh from certain states
    if (this.state === "idle" || this.state === "error") {
      return false;
    }
    
    // RISE V3: Cross-tab coordination
    // Check if another tab is already refreshing
    if (crossTabLock.isOtherTabRefreshing()) {
      this.log.info("Another tab is refreshing - waiting for result");
      const result = await crossTabLock.waitForResult();
      
      if (result.success && result.expiresIn) {
        // Other tab succeeded - update our state
        this.dispatch({ type: "REFRESH_SUCCESS", expiresIn: result.expiresIn });
        return true;
      } else {
        // Other tab failed - we can try
        this.log.warn("Other tab refresh failed, attempting our own refresh");
      }
    }
    
    // Try to acquire lock
    if (!crossTabLock.tryAcquire()) {
      // Lock held by another tab - wait for result
      this.log.info("Lock held by another tab - waiting");
      const result = await crossTabLock.waitForResult();
      
      if (result.success && result.expiresIn) {
        this.dispatch({ type: "REFRESH_SUCCESS", expiresIn: result.expiresIn });
        return true;
      }
      
      // Retry acquisition after wait
      if (!crossTabLock.tryAcquire()) {
        this.log.warn("Could not acquire lock after wait");
        return false;
      }
    }
    
    // We have the lock - proceed with refresh
    this.dispatch({ type: "REFRESH_START" });
    
    this.refreshPromise = this.executeRefreshFlowWithLock();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    
    return result;
  }
  
  /**
   * Execute refresh via Session Commander (RISE V3 10.0/10)
   * 
   * Delegates to Session Commander which handles:
   * - Server-side locking via refresh_locks table
   * - Exponential backoff with jitter
   * - Visual feedback (reconnecting toasts)
   * - Cross-tab coordination
   */
  private async executeRefreshFlowWithLock(): Promise<boolean> {
    try {
      const result = await sessionCommander.requestRefresh();
      
      if (result.success && result.expiresIn) {
        this.dispatch({ type: "REFRESH_SUCCESS", expiresIn: result.expiresIn });
        crossTabLock.notifySuccess(result.expiresIn);
        return true;
      }
      
      const error = result.reason || "Refresh failed";
      this.dispatch({ type: "REFRESH_FAILED", error });
      crossTabLock.notifyFailure(error);
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.dispatch({ type: "REFRESH_FAILED", error: message });
      crossTabLock.notifyFailure(message);
      return false;
    }
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
