/**
 * Session Commander - Unified Session Coordination
 * 
 * RISE ARCHITECT PROTOCOL V3 - Session Commander Architecture
 * 
 * This module is the SINGLE POINT OF CONTROL for all session-related
 * operations. It replaces the fragmented refresh logic that existed
 * across TokenService, api.call retry, and backend validate.
 * 
 * Key features:
 * - Deduplication: Multiple refresh requests → single backend call
 * - Server-side locking: Prevents cross-tab race conditions
 * - Retry with backoff: Handles transient failures gracefully
 * - Visual feedback: User-friendly reconnection indicators
 * - Event-driven monitoring: Visibility and network aware
 * 
 * Usage:
 * ```typescript
 * import { sessionCommander } from "@/lib/session-commander";
 * 
 * // Request refresh (deduplicated)
 * const result = await sessionCommander.requestRefresh();
 * 
 * // Start monitoring
 * sessionCommander.startMonitoring();
 * ```
 */

import { createLogger } from "@/lib/logger";
import { RefreshCoordinator, refreshCoordinator } from "./coordinator";
import { SessionMonitor, createSessionMonitor } from "./session-monitor";
import type { RefreshResult, SessionHealth, SessionCommanderConfig } from "./types";

const log = createLogger("SessionCommander");

// ============================================
// SESSION COMMANDER CLASS
// ============================================

class SessionCommander {
  private readonly coordinator: RefreshCoordinator;
  private monitor: SessionMonitor | null = null;
  private onSessionCheck: (() => void) | null = null;
  
  constructor(coordinator?: RefreshCoordinator) {
    this.coordinator = coordinator || refreshCoordinator;
    log.debug("Session Commander initialized");
  }
  
  /**
   * Request a token refresh
   * 
   * This is the UNIFIED entry point for all refresh operations.
   * Deduplicates concurrent requests and handles server-side coordination.
   * 
   * @returns RefreshResult indicating success/failure and expiration info
   */
  async requestRefresh(): Promise<RefreshResult> {
    return this.coordinator.requestRefresh();
  }
  
  /**
   * Check if a refresh is currently in progress
   */
  isRefreshing(): boolean {
    return this.coordinator.isRefreshing();
  }
  
  /**
   * Get the current tab identifier
   */
  getTabId(): string {
    return this.coordinator.getTabId();
  }
  
  /**
   * Start session monitoring
   * 
   * Sets up event-driven monitoring that checks session health on:
   * - Visibility changes (tab becomes visible)
   * - Network changes (coming back online)
   * - Window focus
   * - Regular intervals (adaptive based on visibility)
   * 
   * @param onCheck - Callback invoked when session should be checked
   */
  startMonitoring(onCheck: () => void): void {
    if (this.monitor) {
      log.debug("Monitor already running");
      return;
    }
    
    this.onSessionCheck = onCheck;
    this.monitor = createSessionMonitor(onCheck);
    this.monitor.start();
    
    log.info("Session monitoring started");
  }
  
  /**
   * Stop session monitoring
   */
  stopMonitoring(): void {
    if (this.monitor) {
      this.monitor.stop();
      this.monitor = null;
      this.onSessionCheck = null;
      log.info("Session monitoring stopped");
    }
  }
  
  /**
   * Force an immediate session check
   */
  forceCheck(): void {
    if (this.monitor) {
      this.monitor.forceCheck();
    } else if (this.onSessionCheck) {
      this.onSessionCheck();
    }
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

/**
 * Global Session Commander instance
 * 
 * Use this for all session-related operations:
 * - Refresh requests
 * - Session monitoring
 * - Health checks
 */
export const sessionCommander = new SessionCommander();

// ============================================
// RE-EXPORTS
// ============================================

export { RefreshCoordinator } from "./coordinator";
export { SessionMonitor, createSessionMonitor } from "./session-monitor";
export * from "./types";
export * from "./retry-strategy";
export * from "./feedback";
