/**
 * Token Heartbeat - Background-Aware Timer Management
 * 
 * RISE Protocol V3: Single Responsibility - Timer Only
 * 
 * This module manages the heartbeat timer that periodically
 * checks token status and triggers proactive refresh.
 * 
 * ENHANCED: Detects when timer was paused (background tab) and
 * compensates by triggering immediate check on resume.
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
 * Background-Aware Heartbeat Manager
 * 
 * Detects when the browser has paused execution (background tab)
 * and triggers immediate callback when execution resumes.
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
  private lastTickTime: number = 0;
  
  // If the gap between ticks is > 2x the interval, we were likely suspended
  private readonly suspensionThresholdMultiplier = 2;
  
  constructor(
    callback: HeartbeatCallback, 
    intervalMs: number = TOKEN_TIMING.HEARTBEAT_INTERVAL_MS
  ) {
    this.callback = callback;
    this.intervalMs = intervalMs;
  }
  
  /**
   * Start the heartbeat timer with suspension detection
   */
  start(): void {
    this.stop(); // Clear any existing timer
    this.lastTickTime = Date.now();
    
    this.timer = window.setInterval(() => {
      this.handleTick();
    }, this.intervalMs);
    
    // Trigger initial check immediately
    this.callback();
    
    log.debug("Heartbeat started", { intervalMs: this.intervalMs });
  }
  
  /**
   * Handle each timer tick with suspension detection
   */
  private handleTick(): void {
    const now = Date.now();
    const elapsed = now - this.lastTickTime;
    const expectedMax = this.intervalMs * this.suspensionThresholdMultiplier;
    
    // Detect if we were suspended (gap > 2x expected interval)
    if (elapsed > expectedMax) {
      log.info("Detected timer suspension", {
        elapsed,
        expected: this.intervalMs,
        suspendedFor: elapsed - this.intervalMs,
      });
    }
    
    this.lastTickTime = now;
    this.callback();
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
    this.lastTickTime = Date.now();
    this.callback();
  }
  
  /**
   * Get time since last tick (useful for debugging)
   */
  getTimeSinceLastTick(): number {
    return Date.now() - this.lastTickTime;
  }
}
