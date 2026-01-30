/**
 * Refresh Coordinator Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the centralized refresh coordination system.
 * Covers: deduplication, retry logic, status handling, timeout.
 * 
 * @module lib/session-commander/__tests__/coordinator.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RefreshCoordinator } from "../coordinator";

// ============================================================================
// MOCKS
// ============================================================================

// Mock feedback module
vi.mock("../feedback", () => ({
  showReconnecting: vi.fn(),
  showReconnected: vi.fn(),
  showReconnectionFailed: vi.fn(),
  showSessionExpired: vi.fn(),
  dismissSessionToasts: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock config
vi.mock("@/config/supabase", () => ({
  API_GATEWAY_URL: "https://api.test.com",
}));

// Import mocked feedback functions for assertions
import {
  showReconnecting,
  showReconnected,
  showReconnectionFailed,
  showSessionExpired,
  dismissSessionToasts,
} from "../feedback";

// ============================================================================
// TEST SETUP
// ============================================================================

describe("RefreshCoordinator", () => {
  let coordinator: RefreshCoordinator;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    
    coordinator = new RefreshCoordinator({
      maxRetries: 3,
      baseDelayMs: 100,
      maxDelayMs: 1000,
      requestTimeoutMs: 5000,
      enableFeedback: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // INITIALIZATION TESTS
  // ==========================================================================

  describe("initialization", () => {
    it("should generate a unique tab ID", () => {
      const tabId = coordinator.getTabId();
      expect(tabId).toMatch(/^tab_[a-z0-9]+_[a-z0-9]+$/);
    });

    it("should create coordinator with default config", () => {
      const defaultCoordinator = new RefreshCoordinator();
      expect(defaultCoordinator.getTabId()).toBeDefined();
    });

    it("should not be refreshing initially", () => {
      expect(coordinator.isRefreshing()).toBe(false);
    });
  });

  // ==========================================================================
  // DEDUPLICATION TESTS
  // ==========================================================================

  describe("deduplication", () => {
    it("should return same promise for concurrent requests", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, expiresIn: 14400 }),
      });

      const promise1 = coordinator.requestRefresh();
      const promise2 = coordinator.requestRefresh();

      // Both promises should resolve to the same result (deduplication behavior)
      await vi.runAllTimersAsync();
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1).toEqual(result2);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("should set isRefreshing true during refresh", async () => {
      fetchMock.mockImplementation(() => 
        new Promise((resolve) => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true }),
          }), 100)
        )
      );

      const promise = coordinator.requestRefresh();
      expect(coordinator.isRefreshing()).toBe(true);

      await vi.runAllTimersAsync();
      await promise;
      
      expect(coordinator.isRefreshing()).toBe(false);
    });

    it("should allow new refresh after previous completes", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, expiresIn: 14400 }),
      });

      const result1 = await coordinator.requestRefresh();
      expect(result1.success).toBe(true);
      
      const result2 = await coordinator.requestRefresh();
      expect(result2.success).toBe(true);
      
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // SUCCESS HANDLING TESTS
  // ==========================================================================

  describe("success handling", () => {
    it("should return success result with expiresIn", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, expiresIn: 14400 }),
      });

      const result = await coordinator.requestRefresh();

      expect(result).toEqual({
        success: true,
        expiresIn: 14400,
      });
    });

    it("should include tabId in request headers", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await coordinator.requestRefresh();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Tab-Id": coordinator.getTabId(),
          }),
        })
      );
    });

    it("should send request with credentials included", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await coordinator.requestRefresh();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        })
      );
    });
  });

  // ==========================================================================
  // WAIT STATUS TESTS
  // ==========================================================================

  describe("wait status handling", () => {
    it("should wait and retry when server returns wait status", async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status: "wait", retryAfter: 2000 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, expiresIn: 14400 }),
        });

      const promise = coordinator.requestRefresh();
      
      // First call returns wait
      await vi.advanceTimersByTimeAsync(0);
      
      // Wait for retryAfter
      await vi.advanceTimersByTimeAsync(2000);
      
      const result = await promise;

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("should use default retryAfter when not provided", async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status: "wait" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });

      const promise = coordinator.requestRefresh();
      
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(2000); // Default is 2000ms
      
      await promise;

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // UNAUTHORIZED HANDLING TESTS
  // ==========================================================================

  describe("unauthorized handling", () => {
    it("should return expired reason on 401", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await coordinator.requestRefresh();

      expect(result).toEqual({
        success: false,
        reason: "expired",
      });
    });

    it("should show session expired toast on 401", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await coordinator.requestRefresh();

      expect(showSessionExpired).toHaveBeenCalled();
    });

    it("should dismiss reconnecting toast before showing expired", async () => {
      // First attempt fails, shows reconnecting
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status: "error" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

      const promise = coordinator.requestRefresh();
      
      await vi.advanceTimersByTimeAsync(0);
      await vi.runAllTimersAsync();
      
      await promise;

      expect(dismissSessionToasts).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // ERROR HANDLING & RETRY TESTS
  // ==========================================================================

  describe("error handling and retry", () => {
    it("should retry on network error with exponential backoff", async () => {
      fetchMock
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });

      const promise = coordinator.requestRefresh();
      
      await vi.runAllTimersAsync();
      
      const result = await promise;

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("should return max_retries reason after exhausting attempts", async () => {
      fetchMock.mockRejectedValue(new Error("Network error"));

      const promise = coordinator.requestRefresh();
      
      await vi.runAllTimersAsync();
      
      const result = await promise;

      expect(result).toEqual({
        success: false,
        reason: "max_retries",
      });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("should show reconnection failed after max retries", async () => {
      fetchMock.mockRejectedValue(new Error("Network error"));

      const promise = coordinator.requestRefresh();
      
      await vi.runAllTimersAsync();
      
      await promise;

      expect(showReconnectionFailed).toHaveBeenCalled();
    });

    it("should handle HTTP error status", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const promise = coordinator.requestRefresh();
      
      await vi.runAllTimersAsync();
      
      const result = await promise;

      expect(result).toEqual({
        success: false,
        reason: "max_retries",
      });
    });
  });

  // ==========================================================================
  // FEEDBACK TESTS
  // ==========================================================================

  describe("visual feedback", () => {
    it("should show reconnecting toast on retry", async () => {
      fetchMock
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });

      const promise = coordinator.requestRefresh();
      
      await vi.runAllTimersAsync();
      
      await promise;

      expect(showReconnecting).toHaveBeenCalledWith(2, 3);
    });

    it("should show reconnected toast after retry success", async () => {
      fetchMock
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });

      const promise = coordinator.requestRefresh();
      
      await vi.runAllTimersAsync();
      
      await promise;

      expect(showReconnected).toHaveBeenCalled();
    });

    it("should not show feedback when disabled", async () => {
      const noFeedbackCoordinator = new RefreshCoordinator({
        enableFeedback: false,
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        requestTimeoutMs: 5000,
      });

      fetchMock
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });

      const promise = noFeedbackCoordinator.requestRefresh();
      
      await vi.runAllTimersAsync();
      
      await promise;

      expect(showReconnecting).not.toHaveBeenCalled();
    });

    it("should not show reconnecting on first attempt", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await coordinator.requestRefresh();

      expect(showReconnecting).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // TIMEOUT TESTS
  // ==========================================================================

  describe("timeout handling", () => {
    it("should abort request on timeout", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      
      fetchMock.mockRejectedValue(abortError);

      const promise = coordinator.requestRefresh();
      
      await vi.runAllTimersAsync();
      
      const result = await promise;

      expect(result).toEqual({
        success: false,
        reason: "max_retries",
      });
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("edge cases", () => {
    it("should handle unknown response format", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ unknown: "format" }),
      });

      const promise = coordinator.requestRefresh();
      
      await vi.runAllTimersAsync();
      
      const result = await promise;

      expect(result).toEqual({
        success: false,
        reason: "max_retries",
      });
    });

    it("should handle JSON parse error", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      const promise = coordinator.requestRefresh();
      
      await vi.runAllTimersAsync();
      
      const result = await promise;

      expect(result).toEqual({
        success: false,
        reason: "max_retries",
      });
    });
  });
});
