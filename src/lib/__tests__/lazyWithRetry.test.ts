/**
 * lazyWithRetry Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for lazy loading with automatic retry:
 * - isNetworkError detection (exported utility)
 * - isChunkLoadError detection (exported utility)
 * 
 * Note: lazyWithRetry() returns a React.LazyExoticComponent which
 * does not expose internal methods. We test the exported utilities directly.
 */

import { describe, it, expect, vi } from "vitest";
import { isChunkLoadError, isNetworkError } from "../lazyWithRetry";

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ========== IS NETWORK ERROR ==========

describe("isNetworkError", () => {
  it("should return true for 'failed to fetch' error", () => {
    const error = new Error("Failed to fetch");
    expect(isNetworkError(error)).toBe(true);
  });

  it("should return true for 'load failed' error", () => {
    const error = new Error("Load failed");
    expect(isNetworkError(error)).toBe(true);
  });

  it("should return true for 'loading chunk' error", () => {
    const error = new Error("Loading chunk 123 failed");
    expect(isNetworkError(error)).toBe(true);
  });

  it("should return true for 'network' error", () => {
    const error = new Error("Network error occurred");
    expect(isNetworkError(error)).toBe(true);
  });

  it("should return true for 'dynamically imported module' error", () => {
    const error = new Error("Failed to fetch dynamically imported module");
    expect(isNetworkError(error)).toBe(true);
  });

  it("should return true for ChunkLoadError name", () => {
    const error = new Error("Chunk error");
    error.name = "ChunkLoadError";
    expect(isNetworkError(error)).toBe(true);
  });

  it("should return true for TypeError name", () => {
    const error = new TypeError("Failed to fetch");
    expect(isNetworkError(error)).toBe(true);
  });

  it("should return false for SyntaxError", () => {
    const error = new SyntaxError("Unexpected token");
    expect(isNetworkError(error)).toBe(false);
  });

  it("should return false for ReferenceError", () => {
    const error = new ReferenceError("x is not defined");
    expect(isNetworkError(error)).toBe(false);
  });

  it("should return false for regular error without keywords", () => {
    const error = new Error("Something went wrong");
    expect(isNetworkError(error)).toBe(false);
  });

  it("should return false for non-Error value", () => {
    expect(isNetworkError("string error")).toBe(false);
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
    expect(isNetworkError(42)).toBe(false);
  });

  it("should handle case-insensitive matching", () => {
    const error = new Error("FAILED TO FETCH");
    expect(isNetworkError(error)).toBe(true);
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

  it("should return true for ChunkLoadError name", () => {
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
