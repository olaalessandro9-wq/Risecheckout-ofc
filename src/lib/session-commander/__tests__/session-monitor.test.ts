/**
 * Session Monitor Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the event-driven session health monitoring system.
 * Covers: visibility, network, focus listeners, interval management.
 * 
 * @module lib/session-commander/__tests__/session-monitor.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SessionMonitor, createSessionMonitor } from "../session-monitor";

// ============================================================================
// TEST SETUP
// ============================================================================

describe("SessionMonitor", () => {
  let callCount: number;
  let onCheckWrapper: () => void;
  let monitor: SessionMonitor;
  
  // Event listener tracking
  let documentListeners: Map<string, EventListener>;
  let windowListeners: Map<string, EventListener>;

  const resetCallCount = (): void => { callCount = 0; };

  beforeEach(() => {
    vi.useFakeTimers();
    
    callCount = 0;
    onCheckWrapper = () => { callCount++; };
    
    documentListeners = new Map();
    windowListeners = new Map();
    
    // Mock document.addEventListener
    vi.spyOn(document, "addEventListener").mockImplementation((event, handler) => {
      documentListeners.set(event, handler as EventListener);
    });
    
    // Mock window.addEventListener
    vi.spyOn(window, "addEventListener").mockImplementation((event, handler) => {
      windowListeners.set(event, handler as EventListener);
    });
    
    // Mock document.hidden
    Object.defineProperty(document, "hidden", {
      configurable: true,
      writable: true,
      value: false,
    });
  });

  afterEach(() => {
    if (monitor) {
      monitor.stop();
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // FACTORY FUNCTION TESTS
  // ==========================================================================

  describe("createSessionMonitor", () => {
    it("should create a new SessionMonitor instance", () => {
      const createdMonitor = createSessionMonitor(onCheckWrapper);
      expect(createdMonitor).toBeInstanceOf(SessionMonitor);
    });

    it("should create monitor without health change callback", () => {
      const createdMonitor = createSessionMonitor(onCheckWrapper);
      expect(createdMonitor).toBeInstanceOf(SessionMonitor);
    });
  });

  // ==========================================================================
  // INITIALIZATION TESTS
  // ==========================================================================

  describe("initialization", () => {
    it("should call onCheck immediately on start", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      expect(callCount).toBe(1);
    });

    it("should not call onCheck if not started", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      
      expect(callCount).toBe(0);
    });

    it("should not start twice", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      monitor.start();
      
      // Only initial check, not two
      expect(callCount).toBe(1);
    });
  });

  // ==========================================================================
  // INTERVAL TESTS
  // ==========================================================================

  describe("interval management", () => {
    it("should check periodically when foreground", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      // Initial check
      expect(callCount).toBe(1);
      
      // Advance 1 minute (foreground interval)
      vi.advanceTimersByTime(60_000);
      expect(callCount).toBe(2);
      
      // Another minute
      vi.advanceTimersByTime(60_000);
      expect(callCount).toBe(3);
    });

    it("should stop interval when stopped", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      expect(callCount).toBe(1);
      
      monitor.stop();
      
      // Advance time - should not trigger more checks
      vi.advanceTimersByTime(120_000);
      expect(callCount).toBe(1);
    });
  });

  // ==========================================================================
  // VISIBILITY LISTENER TESTS
  // ==========================================================================

  describe("visibility change handling", () => {
    it("should setup visibility change listener", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      expect(document.addEventListener).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function)
      );
    });

    it("should check immediately when tab becomes visible", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      // Clear initial check
      resetCallCount();
      
      // Advance time to clear debounce
      vi.advanceTimersByTime(1500);
      
      // Simulate tab becoming visible after being hidden
      Object.defineProperty(document, "hidden", { value: false });
      const handler = documentListeners.get("visibilitychange");
      if (handler) handler(new Event("visibilitychange"));
      
      expect(callCount).toBe(1);
    });

    it("should slow down interval when tab becomes hidden", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      resetCallCount();
      
      // Simulate tab becoming hidden
      Object.defineProperty(document, "hidden", { value: true });
      const handler = documentListeners.get("visibilitychange");
      if (handler) handler(new Event("visibilitychange"));
      
      // After 1 minute (foreground interval) - should NOT check yet
      vi.advanceTimersByTime(60_000);
      expect(callCount).toBe(0);
      
      // After 5 minutes (background interval) - should check
      vi.advanceTimersByTime(240_000);
      expect(callCount).toBe(1);
    });

    it("should speed up interval when tab becomes visible again", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      // Hide tab
      Object.defineProperty(document, "hidden", { value: true });
      const handler = documentListeners.get("visibilitychange");
      if (handler) handler(new Event("visibilitychange"));
      
      resetCallCount();
      
      // Advance time to clear debounce
      vi.advanceTimersByTime(1500);
      
      // Show tab again
      Object.defineProperty(document, "hidden", { value: false });
      if (handler) handler(new Event("visibilitychange"));
      
      // Immediate check on visibility
      expect(callCount).toBe(1);
      
      resetCallCount();
      
      // Advance to clear debounce again
      vi.advanceTimersByTime(1500);
      
      // After 1 minute (foreground interval)
      vi.advanceTimersByTime(60_000);
      expect(callCount).toBe(1);
    });
  });

  // ==========================================================================
  // NETWORK LISTENER TESTS
  // ==========================================================================

  describe("network change handling", () => {
    it("should setup online listener", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      expect(window.addEventListener).toHaveBeenCalledWith(
        "online",
        expect.any(Function)
      );
    });

    it("should setup offline listener", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      expect(window.addEventListener).toHaveBeenCalledWith(
        "offline",
        expect.any(Function)
      );
    });

    it("should check when coming back online", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      resetCallCount();
      
      // Advance time to clear debounce
      vi.advanceTimersByTime(1500);
      
      const handler = windowListeners.get("online");
      if (handler) handler(new Event("online"));
      
      expect(callCount).toBe(1);
    });
  });

  // ==========================================================================
  // FOCUS LISTENER TESTS
  // ==========================================================================

  describe("focus handling", () => {
    it("should setup focus listener", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      expect(window.addEventListener).toHaveBeenCalledWith(
        "focus",
        expect.any(Function)
      );
    });

    it("should check on window focus", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      resetCallCount();
      
      // Advance time to clear debounce
      vi.advanceTimersByTime(1500);
      
      const handler = windowListeners.get("focus");
      if (handler) handler(new Event("focus"));
      
      expect(callCount).toBe(1);
    });
  });

  // ==========================================================================
  // DEBOUNCE TESTS
  // ==========================================================================

  describe("debouncing", () => {
    it("should debounce rapid visibility changes", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      resetCallCount();
      
      // Advance time to clear debounce from start
      vi.advanceTimersByTime(1500);
      
      const visibilityHandler = documentListeners.get("visibilitychange");
      
      // First visibility change
      Object.defineProperty(document, "hidden", { value: false });
      if (visibilityHandler) visibilityHandler(new Event("visibilitychange"));
      
      // First call works
      expect(callCount).toBe(1);
      
      // Rapid visibility changes (within debounce window)
      if (visibilityHandler) visibilityHandler(new Event("visibilitychange"));
      if (visibilityHandler) visibilityHandler(new Event("visibilitychange"));
      
      // Should still be 1 due to debounce
      expect(callCount).toBe(1);
    });

    it("should allow check after debounce period", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      resetCallCount();
      
      // Advance time to clear debounce from start
      vi.advanceTimersByTime(1500);
      
      const focusHandler = windowListeners.get("focus");
      
      // First focus
      if (focusHandler) focusHandler(new Event("focus"));
      expect(callCount).toBe(1);
      
      // Wait for debounce period (1 second)
      vi.advanceTimersByTime(1001);
      
      // Second focus should work
      if (focusHandler) focusHandler(new Event("focus"));
      expect(callCount).toBe(2);
    });
  });

  // ==========================================================================
  // FORCE CHECK TESTS
  // ==========================================================================

  describe("forceCheck", () => {
    it("should immediately trigger check", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      resetCallCount();
      
      monitor.forceCheck();
      
      expect(callCount).toBe(1);
    });

    it("should not call when not started", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      
      // Not started, but forceCheck should still work based on isRunning
      monitor.forceCheck();
      
      // Won't call because isRunning is false
      expect(callCount).toBe(0);
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe("error handling", () => {
    it("should catch and log callback errors", () => {
      const errorCallback = (): void => {
        throw new Error("Callback error");
      };
      
      monitor = new SessionMonitor(errorCallback);
      
      // Should not throw
      expect(() => monitor.start()).not.toThrow();
    });

    it("should continue interval after callback error", () => {
      let errorCallCount = 0;
      const flakyCallback = (): void => {
        errorCallCount++;
        if (errorCallCount === 1) {
          throw new Error("First call error");
        }
      };
      
      monitor = new SessionMonitor(flakyCallback);
      monitor.start();
      
      // First call throws
      expect(errorCallCount).toBe(1);
      
      // Advance interval
      vi.advanceTimersByTime(60_000);
      
      // Second call should still happen
      expect(errorCallCount).toBe(2);
    });
  });

  // ==========================================================================
  // STOP BEHAVIOR TESTS
  // ==========================================================================

  describe("stop behavior", () => {
    it("should not perform checks after stop", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      resetCallCount();
      
      monitor.stop();
      
      // Try to force check - should not work
      monitor.forceCheck();
      expect(callCount).toBe(0);
    });

    it("should be safe to call stop multiple times", () => {
      monitor = new SessionMonitor(onCheckWrapper);
      monitor.start();
      
      expect(() => {
        monitor.stop();
        monitor.stop();
        monitor.stop();
      }).not.toThrow();
    });
  });
});
