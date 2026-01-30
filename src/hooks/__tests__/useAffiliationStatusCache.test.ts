/**
 * useAffiliationStatusCache.test.ts
 * 
 * Tests for useAffiliationStatusCache hook
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock dependencies
vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

// We need to reset the module between tests to reset the global cache
let useAffiliationStatusCache: typeof import("../useAffiliationStatusCache").useAffiliationStatusCache;
let api: typeof import("@/lib/api").api;

describe("useAffiliationStatusCache", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    
    // Re-import to reset global cache
    const cacheModule = await import("../useAffiliationStatusCache");
    useAffiliationStatusCache = cacheModule.useAffiliationStatusCache;
    const apiModule = await import("@/lib/api");
    api = apiModule.api;
  });

  it("should initialize with loading false and not loaded", () => {
    const { result } = renderHook(() => useAffiliationStatusCache());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoaded).toBe(false);
  });

  it("should return null for unknown product status", () => {
    const { result } = renderHook(() => useAffiliationStatusCache());

    const status = result.current.getStatus("unknown-product");
    expect(status).toBeNull();
  });

  it("should load statuses from API", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: {
        statuses: {
          "prod-1": { status: "active", affiliationId: "aff-1" },
          "prod-2": { status: "pending", affiliationId: "aff-2" },
        },
      },
      error: null,
    });

    const { result } = renderHook(() => useAffiliationStatusCache());

    await act(async () => {
      await result.current.loadStatuses();
    });

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.getStatus("prod-1")).toEqual({
      status: "active",
      affiliationId: "aff-1",
    });
  });

  it("should update status locally", async () => {
    const { result } = renderHook(() => useAffiliationStatusCache());

    act(() => {
      result.current.updateStatus("prod-new", "pending", "aff-new");
    });

    const status = result.current.getStatus("prod-new");
    expect(status?.status).toBe("pending");
    expect(status?.affiliationId).toBe("aff-new");
  });

  it("should increment updateTrigger on status update", async () => {
    const { result } = renderHook(() => useAffiliationStatusCache());

    const initialTrigger = result.current.updateTrigger;

    act(() => {
      result.current.updateStatus("prod-x", "active", "aff-x");
    });

    expect(result.current.updateTrigger).toBeGreaterThan(initialTrigger);
  });

  it("should invalidate cache", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: {
        statuses: {
          "prod-1": { status: "active", affiliationId: "aff-1" },
        },
      },
      error: null,
    });

    const { result } = renderHook(() => useAffiliationStatusCache());

    await act(async () => {
      await result.current.loadStatuses();
    });

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.getStatus("prod-1")).not.toBeNull();

    act(() => {
      result.current.invalidate();
    });

    expect(result.current.isLoaded).toBe(false);
  });

  it("should handle API error gracefully", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: null,
      error: { code: "NETWORK_ERROR" as const, message: "Network error" },
    });

    const { result } = renderHook(() => useAffiliationStatusCache());

    await act(async () => {
      await result.current.loadStatuses();
    });

    // Should still be marked as loaded to not block UI
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("should not make duplicate API calls", async () => {
    vi.mocked(api.call).mockResolvedValue({
      data: { statuses: {} },
      error: null,
    });

    const { result } = renderHook(() => useAffiliationStatusCache());

    // Call loadStatuses multiple times simultaneously
    await act(async () => {
      await Promise.all([
        result.current.loadStatuses(),
        result.current.loadStatuses(),
        result.current.loadStatuses(),
      ]);
    });

    // Should only call API once due to deduplication
    expect(api.call).toHaveBeenCalledTimes(1);
  });
});
