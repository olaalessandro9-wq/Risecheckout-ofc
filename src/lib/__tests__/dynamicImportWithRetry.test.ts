/**
 * dynamicImportWithRetry Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for dynamic import with automatic retry:
 * - Successful import on first try
 * - Successful import after retries
 * - Non-network errors thrown immediately
 * - All attempts fail
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { dynamicImportWithRetry } from "../dynamicImportWithRetry";

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock isNetworkError from lazyWithRetry
vi.mock("../lazyWithRetry", () => ({
  isNetworkError: (error: unknown) => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes("failed to fetch") ||
        message.includes("load failed") ||
        message.includes("network")
      );
    }
    return false;
  },
}));

describe("dynamicImportWithRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return module on successful first attempt", async () => {
    const mockModule = { myFunction: () => "success" };
    const importFn = vi.fn().mockResolvedValue(mockModule);

    const result = await dynamicImportWithRetry(importFn);

    expect(result).toBe(mockModule);
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it("should retry on network error and succeed", async () => {
    const mockModule = { myFunction: () => "success" };
    const networkError = new Error("Failed to fetch");
    
    const importFn = vi.fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(mockModule);

    const promise = dynamicImportWithRetry(importFn, { retryDelay: 100 });
    
    // Advance timers for retry delay
    await vi.advanceTimersByTimeAsync(100);
    
    const result = await promise;

    expect(result).toBe(mockModule);
    expect(importFn).toHaveBeenCalledTimes(2);
  });

  it("should throw immediately on non-network error", async () => {
    const syntaxError = new SyntaxError("Unexpected token");
    const importFn = vi.fn().mockRejectedValue(syntaxError);

    await expect(dynamicImportWithRetry(importFn)).rejects.toThrow("Unexpected token");
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it("should exhaust retries on persistent network error", async () => {
    const networkError = new Error("Load failed");
    let callCount = 0;
    
    const importFn = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.reject(networkError);
    });

    const promise = dynamicImportWithRetry(importFn, { maxRetries: 3, retryDelay: 100 });
    
    // Run all timers to allow retries
    await vi.runAllTimersAsync();
    
    // Catch the expected rejection
    try {
      await promise;
    } catch (e) {
      expect((e as Error).message).toBe("Load failed");
    }
    
    expect(callCount).toBe(3);
  });

  it("should use custom options", async () => {
    const networkError = new Error("Network error");
    const mockModule = { test: true };
    
    const importFn = vi.fn()
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(mockModule);

    const promise = dynamicImportWithRetry(importFn, { maxRetries: 5, retryDelay: 50 });
    
    await vi.advanceTimersByTimeAsync(50);  // 1st retry
    await vi.advanceTimersByTimeAsync(100); // 2nd retry (backoff)
    
    const result = await promise;

    expect(result).toBe(mockModule);
    expect(importFn).toHaveBeenCalledTimes(3);
  });
});
