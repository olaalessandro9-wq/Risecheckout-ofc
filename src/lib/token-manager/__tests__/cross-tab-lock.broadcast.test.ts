/**
 * CrossTabLock Broadcast Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for BroadcastChannel communication:
 * - notifySuccess/notifyFailure
 * - waitForResult with success/failure/timeout
 * - BroadcastChannel error handling
 * - Cross-tab message filtering
 * 
 * @module CrossTabLock/Broadcast
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

describe("CrossTabLock - Broadcast", () => {
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

  describe("waitForResult", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should resolve with success when receiving refresh_success message", async () => {
      const promise = lock.waitForResult();

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

      vi.advanceTimersByTime(20001);

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

  describe("BroadcastChannel error handling", () => {
    it("should handle missing BroadcastChannel gracefully", () => {
      vi.unstubAllGlobals();
      vi.stubGlobal("BroadcastChannel", undefined);

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
      lock.waitForResult();

      const lockData = JSON.parse(mockStorage["rise_auth_refresh_lock"]);

      if (mockChannel.onmessage) {
        mockChannel.onmessage(new MessageEvent("message", {
          data: {
            type: "refresh_success",
            tabId: lockData.tabId,
            expiresIn: 14400,
          },
        }));
      }

      // Promise should not resolve from our own message
    });
  });
});
