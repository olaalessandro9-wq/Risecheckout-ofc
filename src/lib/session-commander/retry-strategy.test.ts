/**
 * Unit Tests: Retry Strategy
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for exponential backoff, sleep, and retry utilities.
 * 
 * @module lib/session-commander/retry-strategy.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getExponentialDelay,
  sleep,
  generateTabId,
  isRetryableFailure,
  formatTimeRemaining,
} from "./retry-strategy";

// ============================================================================
// getExponentialDelay
// ============================================================================

describe("getExponentialDelay", () => {
  it("should return approximately base delay for attempt 1", () => {
    // Run multiple times to account for jitter
    const delays = Array.from({ length: 100 }, () => 
      getExponentialDelay(1, 1000, 10000)
    );
    
    const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
    
    // Should be around 1000ms ± jitter
    expect(avgDelay).toBeGreaterThan(750);
    expect(avgDelay).toBeLessThan(1250);
  });

  it("should double delay for each attempt", () => {
    const attempt1Delays = Array.from({ length: 100 }, () => 
      getExponentialDelay(1, 1000, 100000)
    );
    const attempt2Delays = Array.from({ length: 100 }, () => 
      getExponentialDelay(2, 1000, 100000)
    );
    const attempt3Delays = Array.from({ length: 100 }, () => 
      getExponentialDelay(3, 1000, 100000)
    );
    
    const avg1 = attempt1Delays.reduce((a, b) => a + b, 0) / attempt1Delays.length;
    const avg2 = attempt2Delays.reduce((a, b) => a + b, 0) / attempt2Delays.length;
    const avg3 = attempt3Delays.reduce((a, b) => a + b, 0) / attempt3Delays.length;
    
    // Attempt 2 should be ~2x attempt 1
    expect(avg2 / avg1).toBeGreaterThan(1.5);
    expect(avg2 / avg1).toBeLessThan(2.5);
    
    // Attempt 3 should be ~2x attempt 2
    expect(avg3 / avg2).toBeGreaterThan(1.5);
    expect(avg3 / avg2).toBeLessThan(2.5);
  });

  it("should cap at maximum delay", () => {
    const delays = Array.from({ length: 100 }, () => 
      getExponentialDelay(10, 1000, 10000)
    );
    
    delays.forEach((delay) => {
      // With 25% jitter, max should be around 12500 (10000 * 1.25)
      expect(delay).toBeLessThanOrEqual(12500);
    });
  });

  it("should apply jitter (values should vary)", () => {
    const delays = Array.from({ length: 100 }, () => 
      getExponentialDelay(1, 1000, 10000)
    );
    
    const uniqueDelays = new Set(delays);
    
    // With jitter, most values should be unique
    expect(uniqueDelays.size).toBeGreaterThan(80);
  });

  it("should use default values when not provided", () => {
    const delay = getExponentialDelay(1);
    
    // Should return a positive number
    expect(delay).toBeGreaterThan(0);
  });

  it("should return integer values", () => {
    const delays = Array.from({ length: 100 }, () => getExponentialDelay(1));
    
    delays.forEach((delay) => {
      expect(Number.isInteger(delay)).toBe(true);
    });
  });
});

// ============================================================================
// sleep
// ============================================================================

describe("sleep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return a Promise", () => {
    const result = sleep(100);
    
    expect(result).toBeInstanceOf(Promise);
  });

  it("should resolve after specified time", async () => {
    const callback = vi.fn();
    
    sleep(1000).then(callback);
    
    expect(callback).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(999);
    await Promise.resolve(); // Flush microtasks
    expect(callback).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(1);
    await Promise.resolve(); // Flush microtasks
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should resolve with undefined", async () => {
    vi.useRealTimers();
    
    const result = await sleep(1);
    
    expect(result).toBeUndefined();
  });

  it("should handle zero milliseconds", async () => {
    vi.useRealTimers();
    
    const start = Date.now();
    await sleep(0);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(50);
  });
});

// ============================================================================
// generateTabId
// ============================================================================

describe("generateTabId", () => {
  it("should return a string", () => {
    const tabId = generateTabId();
    
    expect(typeof tabId).toBe("string");
  });

  it("should start with 'tab_'", () => {
    const tabId = generateTabId();
    
    expect(tabId.startsWith("tab_")).toBe(true);
  });

  it("should have format: tab_timestamp_random", () => {
    const tabId = generateTabId();
    const parts = tabId.split("_");
    
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe("tab");
    expect(parts[1].length).toBeGreaterThan(0); // timestamp
    expect(parts[2].length).toBe(6); // random
  });

  it("should generate unique IDs", () => {
    const ids = Array.from({ length: 1000 }, () => generateTabId());
    const uniqueIds = new Set(ids);
    
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should use base36 encoding for timestamp and random", () => {
    const tabId = generateTabId();
    const parts = tabId.split("_");
    
    // Timestamp and random should only contain base36 chars
    expect(parts[1]).toMatch(/^[a-z0-9]+$/);
    expect(parts[2]).toMatch(/^[a-z0-9]+$/);
  });
});

// ============================================================================
// isRetryableFailure
// ============================================================================

describe("isRetryableFailure", () => {
  it("should return true for network_error", () => {
    expect(isRetryableFailure("network_error")).toBe(true);
  });

  it("should return true for server_error", () => {
    expect(isRetryableFailure("server_error")).toBe(true);
  });

  it("should return true for timeout", () => {
    expect(isRetryableFailure("timeout")).toBe(true);
  });

  it("should return false for invalid_token", () => {
    expect(isRetryableFailure("invalid_token")).toBe(false);
  });

  it("should return false for auth_error", () => {
    expect(isRetryableFailure("auth_error")).toBe(false);
  });

  it("should return false for unknown reasons", () => {
    expect(isRetryableFailure("unknown_reason")).toBe(false);
    expect(isRetryableFailure("")).toBe(false);
    expect(isRetryableFailure("random_string")).toBe(false);
  });

  it("should be case-sensitive", () => {
    expect(isRetryableFailure("NETWORK_ERROR")).toBe(false);
    expect(isRetryableFailure("Network_Error")).toBe(false);
  });
});

// ============================================================================
// formatTimeRemaining
// ============================================================================

describe("formatTimeRemaining", () => {
  it("should format seconds for less than 60 seconds", () => {
    expect(formatTimeRemaining(5000)).toBe("5s");
    expect(formatTimeRemaining(30000)).toBe("30s");
    expect(formatTimeRemaining(59999)).toBe("60s");
  });

  it("should format minutes for 1-59 minutes", () => {
    expect(formatTimeRemaining(60000)).toBe("1min");
    expect(formatTimeRemaining(120000)).toBe("2min");
    expect(formatTimeRemaining(3599999)).toBe("60min");
  });

  it("should format hours for 1+ hours", () => {
    expect(formatTimeRemaining(3600000)).toBe("1h");
    expect(formatTimeRemaining(7200000)).toBe("2h");
    expect(formatTimeRemaining(86400000)).toBe("24h");
  });

  it("should round up seconds", () => {
    expect(formatTimeRemaining(1500)).toBe("2s");
    expect(formatTimeRemaining(1001)).toBe("2s");
  });

  it("should round up minutes", () => {
    expect(formatTimeRemaining(90000)).toBe("2min"); // 1.5 minutes
  });

  it("should round up hours", () => {
    expect(formatTimeRemaining(5400000)).toBe("2h"); // 1.5 hours
  });

  it("should handle zero", () => {
    expect(formatTimeRemaining(0)).toBe("0s");
  });

  it("should handle very small values", () => {
    expect(formatTimeRemaining(1)).toBe("1s");
    expect(formatTimeRemaining(100)).toBe("1s");
  });
});
