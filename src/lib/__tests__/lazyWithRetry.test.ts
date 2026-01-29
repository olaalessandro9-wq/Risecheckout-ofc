/**
 * lazyWithRetry Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for lazy loading with automatic retry:
 * - Successful load
 * - Network error retry
 * - Non-network error (no retry)
 * - isChunkLoadError detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { lazyWithRetry, isChunkLoadError } from "../lazyWithRetry";

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("lazyWithRetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========== SUCCESSFUL LOAD ==========

  describe("Successful Load", () => {
    it("should load component on first try", async () => {
      const MockComponent = () => null;
      const importFn = vi.fn().mockResolvedValue({ default: MockComponent });

      const LazyComponent = lazyWithRetry(importFn);
      
      // Access the internal import function
      // @ts-expect-error - accessing internal for testing
      const result = await LazyComponent._init();
      
      expect(importFn).toHaveBeenCalledTimes(1);
    });

    it("should return the component", async () => {
      const MockComponent = () => null;
      const importFn = vi.fn().mockResolvedValue({ default: MockComponent });

      const LazyComponent = lazyWithRetry(importFn);
      
      // @ts-expect-error - accessing internal for testing
      const result = await LazyComponent._init();
      
      expect(result.default).toBe(MockComponent);
    });
  });

  // ========== RETRY ON NETWORK ERROR ==========

  describe("Retry on Network Error", () => {
    it("should retry on 'failed to fetch' error", async () => {
      const MockComponent = () => null;
      const networkError = new Error("Failed to fetch dynamically imported module");
      
      const importFn = vi.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ default: MockComponent });

      const LazyComponent = lazyWithRetry(importFn, { maxRetries: 3, retryDelay: 10 });
      
      // @ts-expect-error - accessing internal for testing
      const result = await LazyComponent._init();
      
      expect(importFn).toHaveBeenCalledTimes(3);
      expect(result.default).toBe(MockComponent);
    });

    it("should retry on 'load failed' error", async () => {
      const MockComponent = () => null;
      const loadError = new Error("Load failed");
      
      const importFn = vi.fn()
        .mockRejectedValueOnce(loadError)
        .mockResolvedValueOnce({ default: MockComponent });

      const LazyComponent = lazyWithRetry(importFn, { maxRetries: 3, retryDelay: 10 });
      
      // @ts-expect-error - accessing internal for testing
      const result = await LazyComponent._init();
      
      expect(importFn).toHaveBeenCalledTimes(2);
    });

    it("should throw after max retries exceeded", async () => {
      const networkError = new Error("Failed to fetch");
      const importFn = vi.fn().mockRejectedValue(networkError);

      const LazyComponent = lazyWithRetry(importFn, { maxRetries: 3, retryDelay: 10 });
      
      // @ts-expect-error - accessing internal for testing
      await expect(LazyComponent._init()).rejects.toThrow("Failed to fetch");
      
      expect(importFn).toHaveBeenCalledTimes(3);
    });
  });

  // ========== NO RETRY ON NON-NETWORK ERROR ==========

  describe("No Retry on Non-Network Error", () => {
    it("should not retry on syntax error", async () => {
      const syntaxError = new SyntaxError("Unexpected token");
      const importFn = vi.fn().mockRejectedValue(syntaxError);

      const LazyComponent = lazyWithRetry(importFn, { maxRetries: 3, retryDelay: 10 });
      
      // @ts-expect-error - accessing internal for testing
      await expect(LazyComponent._init()).rejects.toThrow("Unexpected token");
      
      expect(importFn).toHaveBeenCalledTimes(1); // No retry
    });

    it("should not retry on reference error", async () => {
      const refError = new ReferenceError("x is not defined");
      const importFn = vi.fn().mockRejectedValue(refError);

      const LazyComponent = lazyWithRetry(importFn, { maxRetries: 3, retryDelay: 10 });
      
      // @ts-expect-error - accessing internal for testing
      await expect(LazyComponent._init()).rejects.toThrow("x is not defined");
      
      expect(importFn).toHaveBeenCalledTimes(1);
    });
  });

  // ========== CUSTOM OPTIONS ==========

  describe("Custom Options", () => {
    it("should respect custom maxRetries", async () => {
      const networkError = new Error("Network error");
      const importFn = vi.fn().mockRejectedValue(networkError);

      const LazyComponent = lazyWithRetry(importFn, { maxRetries: 5, retryDelay: 10 });
      
      // @ts-expect-error - accessing internal for testing
      await expect(LazyComponent._init()).rejects.toThrow();
      
      expect(importFn).toHaveBeenCalledTimes(5);
    });
  });
});

// ========== IS CHUNK LOAD ERROR ==========

describe("isChunkLoadError", () => {
  it("should return true for 'loading chunk' error", () => {
    const error = new Error("Loading chunk 123 failed");
    expect(isChunkLoadError(error)).toBe(true);
  });

  it("should return true for 'failed to fetch' error", () => {
    const error = new Error("Failed to fetch");
    expect(isChunkLoadError(error)).toBe(true);
  });

  it("should return true for 'load failed' error", () => {
    const error = new Error("Load failed");
    expect(isChunkLoadError(error)).toBe(true);
  });

  it("should return true for 'dynamically imported module' error", () => {
    const error = new Error("Failed to fetch dynamically imported module");
    expect(isChunkLoadError(error)).toBe(true);
  });

  it("should return true for ChunkLoadError", () => {
    const error = new Error("Chunk error");
    error.name = "ChunkLoadError";
    expect(isChunkLoadError(error)).toBe(true);
  });

  it("should return false for regular error", () => {
    const error = new Error("Some other error");
    expect(isChunkLoadError(error)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isChunkLoadError(null)).toBe(false);
  });

  it("should handle case-insensitive matching", () => {
    const error = new Error("FAILED TO FETCH");
    expect(isChunkLoadError(error)).toBe(true);
  });
});
