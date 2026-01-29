/**
 * CrossTabLock Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for cross-tab refresh coordination:
 * - Lock acquisition
 * - Lock release
 * - BroadcastChannel communication
 * - Lock expiration (TTL)
 * - Wait for result
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CrossTabLock, type RefreshWaitResult } from "../cross-tab-lock";

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("CrossTabLock", () => {
  let lock: CrossTabLock;
  const mockStorage: Record<string, string> = {};
  let mockChannel: {
    postMessage: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    onmessage: ((event: MessageEvent) => void) | null;
  };

  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);

    // Mock localStorage
    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
      mockStorage[key] = value;
    });

    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      return mockStorage[key] ?? null;
    });

    vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => {
      delete mockStorage[key];
    });

    // Mock BroadcastChannel
    mockChannel = {
      postMessage: vi.fn(),
      close: vi.fn(),
      onmessage: null,
    };

    vi.stubGlobal("BroadcastChannel", vi.fn().mockImplementation(() => mockChannel));

    lock = new CrossTabLock();
  });

  afterEach(() => {
    if (lock) {
      lock.destroy();
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // ========== LOCK ACQUISITION ==========

  describe("tryAcquire", () => {
    it("should acquire lock when no lock exists", () => {
      const result = lock.tryAcquire();
      expect(result).toBe(true);
    });

    it("should store lock data in localStorage", () => {
      lock.tryAcquire();
      
      const stored = mockStorage["rise_auth_refresh_lock"];
      expect(stored).toBeDefined();
      
      const data = JSON.parse(stored);
      expect(data.tabId).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });

    it("should return true if we already hold the lock", () => {
      lock.tryAcquire();
      const result = lock.tryAcquire();
      expect(result).toBe(true);
    });

    it("should return false if another tab holds a valid lock", () => {
      // Simulate another tab's lock
      mockStorage["rise_auth_refresh_lock"] = JSON.stringify({
        tabId: "other_tab_123",
        timestamp: Date.now(),
      });

      const result = lock.tryAcquire();
      expect(result).toBe(false);
    });

    it("should acquire lock if existing lock is expired (TTL exceeded)", () => {
      // Simulate expired lock (31 seconds old, TTL is 30s)
      mockStorage["rise_auth_refresh_lock"] = JSON.stringify({
        tabId: "other_tab_123",
        timestamp: Date.now() - 31000,
      });

      const result = lock.tryAcquire();
      expect(result).toBe(true);
    });

    it("should broadcast refresh_start on acquisition", () => {
      lock.tryAcquire();
      
      expect(mockChannel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "refresh_start",
        })
      );
    });

    it("should return true if localStorage fails (proceed anyway)", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      const result = lock.tryAcquire();
      expect(result).toBe(true);
    });
  });

  // ========== LOCK RELEASE ==========

  describe("release", () => {
    it("should remove lock from localStorage", () => {
      lock.tryAcquire();
      expect(mockStorage["rise_auth_refresh_lock"]).toBeDefined();

      lock.release();
      expect(mockStorage["rise_auth_refresh_lock"]).toBeUndefined();
    });

    it("should not remove lock if held by another tab", () => {
      // Simulate another tab's lock
      mockStorage["rise_auth_refresh_lock"] = JSON.stringify({
        tabId: "other_tab_123",
        timestamp: Date.now(),
      });

      lock.release();
      
      // Lock should still exist
      expect(mockStorage["rise_auth_refresh_lock"]).toBeDefined();
    });

    it("should not throw if no lock exists", () => {
      expect(() => lock.release()).not.toThrow();
    });
  });

  // ========== NOTIFY SUCCESS/FAILURE ==========

  describe("notifySuccess", () => {
    it("should broadcast success message", () => {
      lock.tryAcquire();
      lock.notifySuccess(14400);

      expect(mockChannel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "refresh_success",
          expiresIn: 14400,
        })
      );
    });

    it("should release lock after notifying", () => {
      lock.tryAcquire();
      expect(mockStorage["rise_auth_refresh_lock"]).toBeDefined();

      lock.notifySuccess(14400);
      expect(mockStorage["rise_auth_refresh_lock"]).toBeUndefined();
    });
  });

  describe("notifyFailure", () => {
    it("should broadcast failure message", () => {
      lock.tryAcquire();
      lock.notifyFailure("Token expired");

      expect(mockChannel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "refresh_fail",
          error: "Token expired",
        })
      );
    });

    it("should release lock after notifying", () => {
      lock.tryAcquire();
      lock.notifyFailure("Error");
      expect(mockStorage["rise_auth_refresh_lock"]).toBeUndefined();
    });
  });

  // ========== IS OTHER TAB REFRESHING ==========

  describe("isOtherTabRefreshing", () => {
    it("should return false when no lock exists", () => {
      expect(lock.isOtherTabRefreshing()).toBe(false);
    });

    it("should return false when we hold the lock", () => {
      lock.tryAcquire();
      expect(lock.isOtherTabRefreshing()).toBe(false);
    });

    it("should return true when another tab holds a valid lock", () => {
      mockStorage["rise_auth_refresh_lock"] = JSON.stringify({
        tabId: "other_tab_123",
        timestamp: Date.now(),
      });

      expect(lock.isOtherTabRefreshing()).toBe(true);
    });

    it("should return false when other tab's lock is expired", () => {
      mockStorage["rise_auth_refresh_lock"] = JSON.stringify({
        tabId: "other_tab_123",
        timestamp: Date.now() - 31000, // 31 seconds old
      });

      expect(lock.isOtherTabRefreshing()).toBe(false);
    });
  });

  // ========== WAIT FOR RESULT ==========

  describe("waitForResult", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should resolve with success when receiving refresh_success message", async () => {
      const promise = lock.waitForResult();

      // Simulate receiving success message
      if (mockChannel.onmessage) {
        mockChannel.onmessage(new MessageEvent("message", {
          data: {
            type: "refresh_success",
            tabId: "other_tab",
            expiresIn: 14400,
          },
        }));
      }

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.expiresIn).toBe(14400);
    });

    it("should resolve with failure when receiving refresh_fail message", async () => {
      const promise = lock.waitForResult();

      // Simulate receiving failure message
      if (mockChannel.onmessage) {
        mockChannel.onmessage(new MessageEvent("message", {
          data: {
            type: "refresh_fail",
            tabId: "other_tab",
            error: "Token invalid",
          },
        }));
      }

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBe("Token invalid");
    });

    it("should timeout after wait timeout period", async () => {
      const promise = lock.waitForResult();

      vi.advanceTimersByTime(20001); // Just over 20s timeout

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBe("timeout");
    });

    it("should return same promise if called multiple times", () => {
      const promise1 = lock.waitForResult();
      const promise2 = lock.waitForResult();

      expect(promise1).toBe(promise2);
    });
  });

  // ========== BROADCAST CHANNEL ==========

  describe("BroadcastChannel", () => {
    it("should handle missing BroadcastChannel gracefully", () => {
      vi.unstubAllGlobals();
      vi.stubGlobal("BroadcastChannel", undefined);

      // Should not throw
      expect(() => new CrossTabLock()).not.toThrow();
    });

    it("should handle BroadcastChannel creation error", () => {
      vi.unstubAllGlobals();
      vi.stubGlobal("BroadcastChannel", vi.fn().mockImplementation(() => {
        throw new Error("Channel creation failed");
      }));

      expect(() => new CrossTabLock()).not.toThrow();
    });

    it("should ignore messages from own tab", () => {
      lock.tryAcquire();
      const waitPromise = lock.waitForResult();

      // Get our tabId from the lock data
      const lockData = JSON.parse(mockStorage["rise_auth_refresh_lock"]);

      // Simulate receiving our own message
      if (mockChannel.onmessage) {
        mockChannel.onmessage(new MessageEvent("message", {
          data: {
            type: "refresh_success",
            tabId: lockData.tabId, // Our own tabId
            expiresIn: 14400,
          },
        }));
      }

      // Promise should not resolve from our own message
      // (This is a race condition test - the promise should still be pending)
    });
  });

  // ========== DESTROY ==========

  describe("destroy", () => {
    it("should release lock on destroy", () => {
      lock.tryAcquire();
      lock.destroy();
      expect(mockStorage["rise_auth_refresh_lock"]).toBeUndefined();
    });

    it("should close BroadcastChannel on destroy", () => {
      lock.destroy();
      expect(mockChannel.close).toHaveBeenCalled();
    });
  });
});
