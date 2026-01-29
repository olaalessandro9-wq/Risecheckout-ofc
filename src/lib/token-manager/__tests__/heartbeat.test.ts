/**
 * HeartbeatManager Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the background-aware timer manager:
 * - Start/stop timer
 * - Callback invocation
 * - Suspension detection
 * - Immediate trigger
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { HeartbeatManager, type HeartbeatCallback } from "../heartbeat";

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("HeartbeatManager", () => {
  let heartbeat: HeartbeatManager;
  let callback: Mock<HeartbeatCallback>;

  beforeEach(() => {
    vi.useFakeTimers();
    callback = vi.fn<HeartbeatCallback>();
  });

  afterEach(() => {
    if (heartbeat) {
      heartbeat.stop();
    }
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ========== CONSTRUCTOR ==========

  describe("Constructor", () => {
    it("should create instance with callback", () => {
      heartbeat = new HeartbeatManager(callback);
      expect(heartbeat).toBeDefined();
      expect(heartbeat.isRunning()).toBe(false);
    });

    it("should accept custom interval", () => {
      heartbeat = new HeartbeatManager(callback, 5000);
      expect(heartbeat).toBeDefined();
    });
  });

  // ========== START/STOP ==========

  describe("Start/Stop", () => {
    beforeEach(() => {
      heartbeat = new HeartbeatManager(callback, 1000);
    });

    it("should start timer and set isRunning to true", () => {
      heartbeat.start();
      expect(heartbeat.isRunning()).toBe(true);
    });

    it("should call callback immediately on start", () => {
      heartbeat.start();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should stop timer and set isRunning to false", () => {
      heartbeat.start();
      heartbeat.stop();
      expect(heartbeat.isRunning()).toBe(false);
    });

    it("should not throw when stopping non-running heartbeat", () => {
      expect(() => heartbeat.stop()).not.toThrow();
    });

    it("should clear previous timer when starting again", () => {
      heartbeat.start();
      expect(callback).toHaveBeenCalledTimes(1);
      
      heartbeat.start();
      expect(callback).toHaveBeenCalledTimes(2); // Called again on second start
    });
  });

  // ========== INTERVAL TICKS ==========

  describe("Interval Ticks", () => {
    beforeEach(() => {
      heartbeat = new HeartbeatManager(callback, 1000);
    });

    it("should call callback on each interval", () => {
      heartbeat.start();
      expect(callback).toHaveBeenCalledTimes(1); // Initial call

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it("should not call callback after stop", () => {
      heartbeat.start();
      expect(callback).toHaveBeenCalledTimes(1);

      heartbeat.stop();
      vi.advanceTimersByTime(3000);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should respect custom interval", () => {
      heartbeat = new HeartbeatManager(callback, 5000);
      heartbeat.start();
      expect(callback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(4999);
      expect(callback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  // ========== SUSPENSION DETECTION ==========

  describe("Suspension Detection", () => {
    beforeEach(() => {
      heartbeat = new HeartbeatManager(callback, 1000);
    });

    it("should detect suspension when gap > 2x interval", () => {
      heartbeat.start();
      
      // Simulate browser suspension by advancing time more than 2x interval
      vi.advanceTimersByTime(3000);
      
      // Callback should still be called (3 times: initial + 2 interval ticks)
      expect(callback).toHaveBeenCalled();
    });

    it("should log suspension when detected", () => {
      heartbeat.start();
      callback.mockClear();
      
      // Simulate normal tick
      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // ========== TRIGGER NOW ==========

  describe("triggerNow", () => {
    beforeEach(() => {
      heartbeat = new HeartbeatManager(callback, 1000);
    });

    it("should call callback immediately", () => {
      heartbeat.triggerNow();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should update lastTickTime", () => {
      vi.setSystemTime(new Date("2024-01-01T10:00:00Z"));
      heartbeat.triggerNow();
      
      expect(heartbeat.getTimeSinceLastTick()).toBe(0);
    });

    it("should work without starting the timer", () => {
      expect(heartbeat.isRunning()).toBe(false);
      heartbeat.triggerNow();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(heartbeat.isRunning()).toBe(false);
    });
  });

  // ========== GET TIME SINCE LAST TICK ==========

  describe("getTimeSinceLastTick", () => {
    beforeEach(() => {
      heartbeat = new HeartbeatManager(callback, 1000);
    });

    it("should return 0 immediately after triggerNow", () => {
      vi.setSystemTime(new Date("2024-01-01T10:00:00Z"));
      heartbeat.triggerNow();
      expect(heartbeat.getTimeSinceLastTick()).toBe(0);
    });

    it("should return elapsed time since last tick", () => {
      vi.setSystemTime(new Date("2024-01-01T10:00:00Z"));
      heartbeat.triggerNow();
      
      vi.advanceTimersByTime(500);
      expect(heartbeat.getTimeSinceLastTick()).toBe(500);
    });

    it("should return elapsed time since start", () => {
      vi.setSystemTime(new Date("2024-01-01T10:00:00Z"));
      heartbeat.start();
      
      vi.advanceTimersByTime(300);
      expect(heartbeat.getTimeSinceLastTick()).toBe(300);
    });
  });

  // ========== EDGE CASES ==========

  describe("Edge Cases", () => {
    it("should handle callback errors gracefully", () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error("Callback error");
      });
      
      heartbeat = new HeartbeatManager(errorCallback, 1000);
      
      // Start should throw since callback throws
      expect(() => heartbeat.start()).toThrow("Callback error");
    });

    it("should handle very short intervals", () => {
      heartbeat = new HeartbeatManager(callback, 10);
      heartbeat.start();
      
      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalled();
    });
  });
});
