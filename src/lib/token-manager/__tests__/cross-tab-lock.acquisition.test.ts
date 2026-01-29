/**
 * CrossTabLock Acquisition Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for lock acquisition and release:
 * - Lock acquisition when no lock exists
 * - Lock acquisition with existing locks
 * - Lock release behavior
 * - isOtherTabRefreshing checks
 * - Cleanup on destroy
 * 
 * @module CrossTabLock/Acquisition
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CrossTabLock } from "../cross-tab-lock";

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("CrossTabLock - Acquisition", () => {
  let lock: CrossTabLock;
  const mockStorage: Record<string, string> = {};
  let mockChannel: {
    postMessage: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    onmessage: ((event: MessageEvent) => void) | null;
  };

  beforeEach(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);

    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
      mockStorage[key] = value;
    });

    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      return mockStorage[key] ?? null;
    });

    vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => {
      delete mockStorage[key];
    });

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
      mockStorage["rise_auth_refresh_lock"] = JSON.stringify({
        tabId: "other_tab_123",
        timestamp: Date.now(),
      });

      const result = lock.tryAcquire();
      expect(result).toBe(false);
    });

    it("should acquire lock if existing lock is expired (TTL exceeded)", () => {
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

  describe("release", () => {
    it("should remove lock from localStorage", () => {
      lock.tryAcquire();
      expect(mockStorage["rise_auth_refresh_lock"]).toBeDefined();

      lock.release();
      expect(mockStorage["rise_auth_refresh_lock"]).toBeUndefined();
    });

    it("should not remove lock if held by another tab", () => {
      mockStorage["rise_auth_refresh_lock"] = JSON.stringify({
        tabId: "other_tab_123",
        timestamp: Date.now(),
      });

      lock.release();
      
      expect(mockStorage["rise_auth_refresh_lock"]).toBeDefined();
    });

    it("should not throw if no lock exists", () => {
      expect(() => lock.release()).not.toThrow();
    });
  });

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
        timestamp: Date.now() - 31000,
      });

      expect(lock.isOtherTabRefreshing()).toBe(false);
    });
  });

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
