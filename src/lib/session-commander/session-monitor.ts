/**
 * Session Monitor - Event-Driven Session Health Monitoring
 * 
 * RISE ARCHITECT PROTOCOL V3 - Session Commander Architecture
 * 
 * Monitors session health using event-driven approach instead of
 * relying solely on setInterval (which gets throttled in background tabs).
 * 
 * Key improvements over HeartbeatManager:
 * 1. Visibility-aware: Checks immediately when tab becomes visible
 * 2. Network-aware: Checks when coming back online
 * 3. Adaptive intervals: Slower checks in background
 */

import { createLogger } from "@/lib/logger";
import type { SessionHealth, SessionStateCallback } from "./types";

const log = createLogger("SessionMonitor");

// ============================================
// CONSTANTS
// ============================================

const FOREGROUND_INTERVAL_MS = 60_000;  // 1 minute when visible
const BACKGROUND_INTERVAL_MS = 300_000; // 5 minutes when hidden
const DEBOUNCE_MS = 1000; // Debounce rapid visibility changes

// ============================================
// SESSION MONITOR CLASS
// ============================================

export class SessionMonitor {
  private intervalId: number | null = null;
  private lastCheck: number = 0;
  private isRunning: boolean = false;
  private readonly onCheck: () => void;
  private readonly onHealthChange?: SessionStateCallback;
  
  constructor(
    onCheck: () => void,
    onHealthChange?: SessionStateCallback
  ) {
    this.onCheck = onCheck;
    this.onHealthChange = onHealthChange;
  }
  
  /**
   * Start monitoring session health
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    
    log.debug("Session monitor starting");
    
    // Setup event listeners
    this.setupVisibilityListener();
    this.setupNetworkListener();
    this.setupFocusListener();
    
    // Start interval for foreground checks
    this.startInterval(FOREGROUND_INTERVAL_MS);
    
    // Initial check
    this.performCheck();
  }
  
  /**
   * Stop monitoring
   */
  stop(): void {
    this.isRunning = false;
    this.stopInterval();
    log.debug("Session monitor stopped");
  }
  
  /**
   * Force an immediate check
   */
  forceCheck(): void {
    this.performCheck();
  }
  
  // ============================================
  // EVENT LISTENERS
  // ============================================
  
  private setupVisibilityListener(): void {
    if (typeof document === "undefined") return;
    
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        // Tab became hidden - slow down interval
        this.stopInterval();
        this.startInterval(BACKGROUND_INTERVAL_MS);
        log.debug("Tab hidden - slowing interval");
      } else {
        // Tab became visible - speed up interval and check immediately
        this.stopInterval();
        this.startInterval(FOREGROUND_INTERVAL_MS);
        this.performCheckDebounced();
        log.debug("Tab visible - speeding up interval and checking");
      }
    });
  }
  
  private setupNetworkListener(): void {
    if (typeof window === "undefined") return;
    
    window.addEventListener("online", () => {
      log.debug("Network online - checking session");
      this.performCheckDebounced();
    });
    
    window.addEventListener("offline", () => {
      log.debug("Network offline");
      // Could notify about offline status here
    });
  }
  
  private setupFocusListener(): void {
    if (typeof window === "undefined") return;
    
    window.addEventListener("focus", () => {
      // Additional check on window focus (covers more cases than visibility)
      this.performCheckDebounced();
    });
  }
  
  // ============================================
  // INTERVAL MANAGEMENT
  // ============================================
  
  private startInterval(intervalMs: number): void {
    this.stopInterval();
    this.intervalId = window.setInterval(() => {
      this.performCheck();
    }, intervalMs);
    log.debug("Interval started", { intervalMs });
  }
  
  private stopInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  // ============================================
  // CHECK LOGIC
  // ============================================
  
  private performCheck(): void {
    if (!this.isRunning) return;
    
    this.lastCheck = Date.now();
    log.debug("Performing session check");
    
    try {
      this.onCheck();
    } catch (error) {
      log.error("Check callback error", { error });
    }
  }
  
  private performCheckDebounced(): void {
    const now = Date.now();
    if (now - this.lastCheck < DEBOUNCE_MS) {
      log.debug("Check debounced");
      return;
    }
    this.performCheck();
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Create a new session monitor instance
 */
export function createSessionMonitor(
  onCheck: () => void,
  onHealthChange?: SessionStateCallback
): SessionMonitor {
  return new SessionMonitor(onCheck, onHealthChange);
}
