/**
 * Token Heartbeat - Proactive Timer Management
 * 
 * RISE Protocol V3: Single Responsibility - Timer Only
 * 
 * This module manages the heartbeat timer that periodically
 * checks token status and triggers proactive refresh.
 */

import { TOKEN_TIMING } from "./types";
import { createLogger } from "@/lib/logger";

const log = createLogger("TokenHeartbeat");

// ============================================
// TYPES
// ============================================

export type HeartbeatCallback = () => void;

// ============================================
// HEARTBEAT MANAGER CLASS
// ============================================

/**
 * Creates and manages a heartbeat timer
 * 
 * Usage:
 * ```typescript
 * const heartbeat = new HeartbeatManager(() => checkTokenStatus());
 * heartbeat.start();
 * // Later...
 * heartbeat.stop();
 * ```
 */
export class HeartbeatManager {
  private timer: number | null = null;
  private readonly callback: HeartbeatCallback;
  private readonly intervalMs: number;
  
  constructor(
    callback: HeartbeatCallback, 
    intervalMs: number = TOKEN_TIMING.HEARTBEAT_INTERVAL_MS
  ) {
    this.callback = callback;
    this.intervalMs = intervalMs;
  }
  
  /**
   * Start the heartbeat timer
   */
  start(): void {
    this.stop(); // Clear any existing timer
    
    this.timer = window.setInterval(() => {
      this.callback();
    }, this.intervalMs);
    
    // Trigger initial check immediately
    this.callback();
    
    log.debug("Heartbeat started", { intervalMs: this.intervalMs });
  }
  
  /**
   * Stop the heartbeat timer
   */
  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
      log.debug("Heartbeat stopped");
    }
  }
  
  /**
   * Check if heartbeat is running
   */
  isRunning(): boolean {
    return this.timer !== null;
  }
  
  /**
   * Trigger an immediate check without waiting for timer
   */
  triggerNow(): void {
    this.callback();
  }
}
