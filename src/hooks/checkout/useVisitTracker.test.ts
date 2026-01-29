/**
 * useVisitTracker Hook Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useVisitTracker } from "./useVisitTracker";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    publicCall: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("useVisitTracker", () => {
  const originalSessionStorage = window.sessionStorage;
  let mockSessionStorage: Record<string, string>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage = {};

    Object.defineProperty(window, "sessionStorage", {
      value: {
        getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockSessionStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockSessionStorage[key];
        }),
        clear: vi.fn(() => {
          mockSessionStorage = {};
        }),
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "sessionStorage", {
      value: originalSessionStorage,
      writable: true,
    });
  });

  // ============================================================================
  // Session Tracking
  // ============================================================================

  describe("Session Tracking", () => {
    it("should track visit only once per session", async () => {
      vi.mocked(api.publicCall).mockResolvedValue({ data: null, error: null });

      // First render
      const { rerender } = renderHook(
        ({ checkoutId }) => useVisitTracker(checkoutId),
        { initialProps: { checkoutId: "checkout-123" } }
      );

      // Wait for async operation
      await vi.waitFor(() => {
        expect(api.publicCall).toHaveBeenCalledTimes(1);
      });

      // Re-render with same checkoutId
      rerender({ checkoutId: "checkout-123" });

      // Should still only have been called once
      expect(api.publicCall).toHaveBeenCalledTimes(1);
    });

    it("should store tracking key in sessionStorage", async () => {
      vi.mocked(api.publicCall).mockResolvedValue({ data: null, error: null });

      renderHook(() => useVisitTracker("checkout-abc"));

      await vi.waitFor(() => {
        expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
          "visit_tracked_v2_checkout-abc",
          "true"
        );
      });
    });

    it("should skip tracking if already tracked", async () => {
      // Simulate already tracked
      mockSessionStorage["visit_tracked_v2_checkout-xyz"] = "true";

      renderHook(() => useVisitTracker("checkout-xyz"));

      // Should not call API
      expect(api.publicCall).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // API Call
  // ============================================================================

  describe("API Call", () => {
    it("should call track-visit edge function", async () => {
      vi.mocked(api.publicCall).mockResolvedValue({ data: null, error: null });

      renderHook(() => useVisitTracker("checkout-123"));

      await vi.waitFor(() => {
        expect(api.publicCall).toHaveBeenCalledWith(
          "track-visit",
          expect.objectContaining({
            checkoutId: "checkout-123",
          })
        );
      });
    });

    it("should include user agent", async () => {
      vi.mocked(api.publicCall).mockResolvedValue({ data: null, error: null });

      renderHook(() => useVisitTracker("checkout-123"));

      await vi.waitFor(() => {
        expect(api.publicCall).toHaveBeenCalledWith(
          "track-visit",
          expect.objectContaining({
            userAgent: navigator.userAgent,
          })
        );
      });
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(api.publicCall).mockResolvedValue({
        data: null,
        error: { code: "INTERNAL_ERROR" as const, message: "Server error" },
      });

      // Should not throw
      expect(() => {
        renderHook(() => useVisitTracker("checkout-123"));
      }).not.toThrow();

      // Should still mark as tracked to prevent retries
      await vi.waitFor(() => {
        expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
          "visit_tracked_v2_checkout-123",
          "failed"
        );
      });
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("Edge Cases", () => {
    it("should not track if checkoutId is undefined", () => {
      renderHook(() => useVisitTracker(undefined));

      expect(api.publicCall).not.toHaveBeenCalled();
    });

    it("should not track if checkoutId is empty string", () => {
      renderHook(() => useVisitTracker(""));

      // Empty string is falsy, should not track
      expect(api.publicCall).not.toHaveBeenCalled();
    });
  });
});
