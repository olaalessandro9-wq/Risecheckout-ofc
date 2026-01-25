/**
 * Cross-Tab Refresh Lock
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Coordinates token refresh across multiple browser tabs to prevent
 * concurrent refresh requests that would trigger false-positive
 * "token reuse" detections.
 * 
 * Uses BroadcastChannel for instant cross-tab communication
 * with localStorage as a fallback for older browsers.
 */

import { createLogger } from "@/lib/logger";

const log = createLogger("CrossTabLock");

// ============================================
// CONSTANTS
// ============================================

const LOCK_KEY = "rise_auth_refresh_lock";
const CHANNEL_NAME = "rise-auth-refresh";
const LOCK_TTL_MS = 10_000; // 10 seconds max lock duration
const WAIT_TIMEOUT_MS = 8_000; // Max time to wait for lock release

// ============================================
// TYPES
// ============================================

interface LockData {
  tabId: string;
  timestamp: number;
}

type RefreshMessage = 
  | { type: "refresh_start"; tabId: string }
  | { type: "refresh_success"; tabId: string; expiresIn: number }
  | { type: "refresh_fail"; tabId: string; error: string };

// ============================================
// CROSS-TAB LOCK CLASS
// ============================================

/**
 * Cross-Tab Refresh Lock Manager
 * 
 * Ensures only one tab performs refresh at a time.
 * Other tabs wait for the result via BroadcastChannel.
 */
export class CrossTabLock {
  private readonly tabId: string;
  private channel: BroadcastChannel | null = null;
  private waitingPromise: Promise<RefreshWaitResult> | null = null;
  private waitingResolve: ((result: RefreshWaitResult) => void) | null = null;
  
  constructor() {
    this.tabId = this.generateTabId();
    this.initChannel();
  }
  
  /**
   * Generate unique tab identifier
   */
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
  
  /**
   * Initialize BroadcastChannel for cross-tab communication
   */
  private initChannel(): void {
    if (typeof BroadcastChannel === "undefined") {
      log.debug("BroadcastChannel not available, using localStorage only");
      return;
    }
    
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => this.handleMessage(event.data);
      log.debug("BroadcastChannel initialized", { tabId: this.tabId });
    } catch (error) {
      log.warn("Failed to create BroadcastChannel", error);
    }
  }
  
  /**
   * Handle incoming cross-tab messages
   */
  private handleMessage(message: RefreshMessage): void {
    // Ignore our own messages
    if (message.tabId === this.tabId) return;
    
    log.debug("Received cross-tab message", { type: message.type, from: message.tabId });
    
    if (message.type === "refresh_success" && this.waitingResolve) {
      this.waitingResolve({ success: true, expiresIn: message.expiresIn });
      this.waitingResolve = null;
      this.waitingPromise = null;
    } else if (message.type === "refresh_fail" && this.waitingResolve) {
      this.waitingResolve({ success: false, error: message.error });
      this.waitingResolve = null;
      this.waitingPromise = null;
    }
  }
  
  /**
   * Broadcast a message to other tabs
   */
  private broadcast(message: RefreshMessage): void {
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (error) {
        log.warn("Failed to broadcast message", error);
      }
    }
  }
  
  /**
   * Try to acquire the lock
   * @returns true if lock acquired, false if another tab holds it
   */
  tryAcquire(): boolean {
    const existing = this.getCurrentLock();
    
    // Check if existing lock is still valid
    if (existing && Date.now() - existing.timestamp < LOCK_TTL_MS) {
      if (existing.tabId === this.tabId) {
        // We already hold the lock
        return true;
      }
      // Another tab holds the lock
      log.debug("Lock held by another tab", { holder: existing.tabId });
      return false;
    }
    
    // Acquire lock
    const lockData: LockData = {
      tabId: this.tabId,
      timestamp: Date.now(),
    };
    
    try {
      localStorage.setItem(LOCK_KEY, JSON.stringify(lockData));
      
      // Broadcast that we're starting refresh
      this.broadcast({ type: "refresh_start", tabId: this.tabId });
      
      log.debug("Lock acquired", { tabId: this.tabId });
      return true;
    } catch (error) {
      log.warn("Failed to acquire lock", error);
      return true; // Proceed anyway if localStorage fails
    }
  }
  
  /**
   * Release the lock
   */
  release(): void {
    const existing = this.getCurrentLock();
    if (existing?.tabId === this.tabId) {
      try {
        localStorage.removeItem(LOCK_KEY);
        log.debug("Lock released");
      } catch {
        // Ignore
      }
    }
  }
  
  /**
   * Broadcast success to other tabs and release lock
   */
  notifySuccess(expiresIn: number): void {
    this.broadcast({ 
      type: "refresh_success", 
      tabId: this.tabId, 
      expiresIn,
    });
    this.release();
  }
  
  /**
   * Broadcast failure to other tabs and release lock
   */
  notifyFailure(error: string): void {
    this.broadcast({ 
      type: "refresh_fail", 
      tabId: this.tabId, 
      error,
    });
    this.release();
  }
  
  /**
   * Wait for refresh result from another tab
   * @returns Promise that resolves when refresh completes or times out
   */
  waitForResult(): Promise<RefreshWaitResult> {
    if (this.waitingPromise) {
      return this.waitingPromise;
    }
    
    this.waitingPromise = new Promise((resolve) => {
      this.waitingResolve = resolve;
      
      // Timeout fallback
      setTimeout(() => {
        if (this.waitingResolve) {
          log.debug("Wait timeout - lock may have expired");
          resolve({ success: false, error: "timeout" });
          this.waitingResolve = null;
          this.waitingPromise = null;
        }
      }, WAIT_TIMEOUT_MS);
    });
    
    return this.waitingPromise;
  }
  
  /**
   * Check if another tab is currently refreshing
   */
  isOtherTabRefreshing(): boolean {
    const existing = this.getCurrentLock();
    if (!existing) return false;
    if (existing.tabId === this.tabId) return false;
    return Date.now() - existing.timestamp < LOCK_TTL_MS;
  }
  
  /**
   * Get current lock data from localStorage
   */
  private getCurrentLock(): LockData | null {
    try {
      const data = localStorage.getItem(LOCK_KEY);
      if (!data) return null;
      return JSON.parse(data) as LockData;
    } catch {
      return null;
    }
  }
  
  /**
   * Cleanup resources
   */
  destroy(): void {
    this.release();
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

// ============================================
// TYPES
// ============================================

export interface RefreshWaitResult {
  success: boolean;
  expiresIn?: number;
  error?: string;
}

// ============================================
// SINGLETON
// ============================================

/**
 * Singleton cross-tab lock instance
 */
export const crossTabLock = new CrossTabLock();
