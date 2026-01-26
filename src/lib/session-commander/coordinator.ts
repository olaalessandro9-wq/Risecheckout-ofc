/**
 * Refresh Coordinator - Centralized Refresh Orchestration
 * 
 * RISE ARCHITECT PROTOCOL V3 - Session Commander Architecture
 * 
 * This is the core component that coordinates all refresh operations.
 * It ensures:
 * 1. Deduplication: Multiple callers get the same Promise
 * 2. Server coordination: Respects server-side locks
 * 3. Retry logic: Exponential backoff with jitter
 * 4. Visual feedback: User-friendly reconnection indicators
 */

import { createLogger } from "@/lib/logger";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/config/supabase";
import type {
  RefreshResult,
  RefreshFailureReason,
  RequestRefreshResponse,
  SessionCommanderConfig,
  DEFAULT_CONFIG,
} from "./types";
import { getExponentialDelay, sleep, generateTabId } from "./retry-strategy";
import {
  showReconnecting,
  showReconnected,
  showReconnectionFailed,
  showSessionExpired,
  dismissSessionToasts,
} from "./feedback";

const log = createLogger("RefreshCoordinator");

// ============================================
// REFRESH COORDINATOR CLASS
// ============================================

export class RefreshCoordinator {
  private refreshQueue: Promise<RefreshResult> | null = null;
  private readonly tabId: string;
  private readonly config: SessionCommanderConfig;
  private isShowingFeedback: boolean = false;
  
  constructor(config?: Partial<SessionCommanderConfig>) {
    this.tabId = generateTabId();
    this.config = {
      maxRetries: config?.maxRetries ?? 3,
      baseDelayMs: config?.baseDelayMs ?? 1000,
      maxDelayMs: config?.maxDelayMs ?? 10000,
      requestTimeoutMs: config?.requestTimeoutMs ?? 15000,
      enableFeedback: config?.enableFeedback ?? true,
    };
    
    log.debug("Coordinator initialized", { tabId: this.tabId });
  }
  
  /**
   * Request a token refresh
   * 
   * This is the SINGLE entry point for all refresh operations.
   * Multiple callers will receive the same Promise (deduplication).
   */
  async requestRefresh(): Promise<RefreshResult> {
    // Deduplication: If refresh is already in progress, return existing Promise
    if (this.refreshQueue) {
      log.info("Refresh already in progress - returning existing promise");
      return this.refreshQueue;
    }
    
    log.info("Starting coordinated refresh");
    
    // Create new refresh promise
    this.refreshQueue = this.executeWithRetry();
    
    try {
      const result = await this.refreshQueue;
      return result;
    } finally {
      this.refreshQueue = null;
    }
  }
  
  /**
   * Check if a refresh is currently in progress
   */
  isRefreshing(): boolean {
    return this.refreshQueue !== null;
  }
  
  /**
   * Get the tab identifier
   */
  getTabId(): string {
    return this.tabId;
  }
  
  // ============================================
  // PRIVATE: RETRY LOGIC
  // ============================================
  
  private async executeWithRetry(): Promise<RefreshResult> {
    const maxAttempts = this.config.maxRetries;
    let attempt = 0;
    
    while (attempt < maxAttempts) {
      attempt++;
      
      // Show feedback on retry (not first attempt)
      if (attempt > 1 && this.config.enableFeedback) {
        this.isShowingFeedback = true;
        showReconnecting(attempt, maxAttempts);
      }
      
      const result = await this.callBackendRefresh();
      
      // SUCCESS
      if (result.status === "success") {
        log.info("Refresh succeeded", { attempt });
        
        if (this.isShowingFeedback) {
          showReconnected();
          this.isShowingFeedback = false;
        }
        
        return {
          success: true,
          expiresIn: result.expiresIn,
        };
      }
      
      // WAIT (another tab is refreshing)
      if (result.status === "wait") {
        log.info("Server says wait - another tab is refreshing", { 
          retryAfter: result.retryAfter 
        });
        await sleep(result.retryAfter || 2000);
        continue; // Don't increment attempt for "wait"
      }
      
      // UNAUTHORIZED (refresh token expired - legitimate logout)
      if (result.status === "unauthorized") {
        log.info("Refresh token expired - legitimate logout");
        
        if (this.isShowingFeedback) {
          dismissSessionToasts();
          this.isShowingFeedback = false;
        }
        
        if (this.config.enableFeedback) {
          showSessionExpired();
        }
        
        return {
          success: false,
          reason: "expired",
        };
      }
      
      // ERROR - retry with backoff
      if (attempt < maxAttempts) {
        const delay = getExponentialDelay(
          attempt,
          this.config.baseDelayMs,
          this.config.maxDelayMs
        );
        log.warn(`Refresh failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms`);
        await sleep(delay);
      }
    }
    
    // Max retries exceeded
    log.error("Max refresh retries exceeded");
    
    if (this.isShowingFeedback) {
      showReconnectionFailed();
      this.isShowingFeedback = false;
    }
    
    return {
      success: false,
      reason: "max_retries",
    };
  }
  
  // ============================================
  // PRIVATE: BACKEND CALL
  // ============================================
  
  private async callBackendRefresh(): Promise<RequestRefreshResponse> {
    const url = `${SUPABASE_URL}/functions/v1/unified-auth/request-refresh`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.requestTimeoutMs
    );
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "X-Tab-Id": this.tabId,
        },
        credentials: "include", // Include cookies
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Handle 401 - unauthorized
      if (response.status === 401) {
        return { status: "unauthorized" };
      }
      
      // Handle other errors
      if (!response.ok) {
        log.warn("Refresh request failed", { status: response.status });
        return { status: "error", message: `HTTP ${response.status}` };
      }
      
      // Parse response
      const data = await response.json();
      
      // Handle "wait" status
      if (data.status === "wait") {
        return {
          status: "wait",
          message: data.message,
          retryAfter: data.retryAfter,
        };
      }
      
      // Handle success
      if (data.success) {
        return {
          status: "success",
          expiresIn: data.expiresIn,
          expiresAt: data.expiresAt,
          user: data.user,
        };
      }
      
      // Unknown response format
      return { status: "error", message: "Unknown response format" };
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === "AbortError") {
        log.warn("Refresh request timed out");
        return { status: "error", message: "timeout" };
      }
      
      log.error("Refresh request error", { error });
      return { status: "error", message: "network_error" };
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

/**
 * Global refresh coordinator singleton
 */
export const refreshCoordinator = new RefreshCoordinator();
