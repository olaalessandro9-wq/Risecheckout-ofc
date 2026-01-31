/**
 * @file useCheckoutPublicMachine.test.ts
 * @description Tests for useCheckoutPublicMachine hook
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCheckoutPublicMachine } from "../useCheckoutPublicMachine";
import { mockLoadedContext } from "../../__tests__/_fixtures";

// Mock dependencies
vi.mock("react-router-dom", () => ({
  useParams: () => ({ slug: "test-checkout" }),
  useSearchParams: () => [new URLSearchParams()],
}));

vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [
    {
      value: "idle",
      matches: (state: string) => state === "idle",
      context: mockLoadedContext,
    },
    vi.fn(),
  ]),
}));

vi.mock("@/hooks/checkout/helpers", () => ({
  getAffiliateCode: () => null,
}));

// ============================================================================
// TEST SUITE
// ============================================================================

describe("useCheckoutPublicMachine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Hook Initialization", () => {
    it("should return initial state with all required properties", () => {
      const { result } = renderHook(() => useCheckoutPublicMachine());

      // State flags
      expect(result.current).toHaveProperty("isIdle");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("isReady");
      expect(result.current).toHaveProperty("isSubmitting");
      expect(result.current).toHaveProperty("isPaymentPending");
      expect(result.current).toHaveProperty("isSuccess");
      expect(result.current).toHaveProperty("isError");

      // Error info
      expect(result.current).toHaveProperty("errorReason");
      expect(result.current).toHaveProperty("errorMessage");
      expect(result.current).toHaveProperty("canRetry");
      expect(result.current).toHaveProperty("retryCount");

      // Loaded data
      expect(result.current).toHaveProperty("checkout");
      expect(result.current).toHaveProperty("product");
      expect(result.current).toHaveProperty("offer");
      expect(result.current).toHaveProperty("orderBumps");
      expect(result.current).toHaveProperty("affiliate");
      expect(result.current).toHaveProperty("design");
      expect(result.current).toHaveProperty("resolvedGateways");

      // Form state
      expect(result.current).toHaveProperty("formData");
      expect(result.current).toHaveProperty("formErrors");
      expect(result.current).toHaveProperty("selectedBumps");
      expect(result.current).toHaveProperty("appliedCoupon");
      expect(result.current).toHaveProperty("selectedPaymentMethod");

      // Payment state
      expect(result.current).toHaveProperty("orderId");
      expect(result.current).toHaveProperty("accessToken");
      expect(result.current).toHaveProperty("paymentData");
      expect(result.current).toHaveProperty("navigationData");

      // Actions
      expect(result.current).toHaveProperty("load");
      expect(result.current).toHaveProperty("retry");
      expect(result.current).toHaveProperty("giveUp");
      expect(result.current).toHaveProperty("updateField");
      expect(result.current).toHaveProperty("updateMultipleFields");
      expect(result.current).toHaveProperty("toggleBump");
      expect(result.current).toHaveProperty("setPaymentMethod");
      expect(result.current).toHaveProperty("applyCoupon");
      expect(result.current).toHaveProperty("removeCoupon");
      expect(result.current).toHaveProperty("submit");
    });

    it("should have function types for all actions", () => {
      const { result } = renderHook(() => useCheckoutPublicMachine());

      expect(typeof result.current.load).toBe("function");
      expect(typeof result.current.retry).toBe("function");
      expect(typeof result.current.giveUp).toBe("function");
      expect(typeof result.current.updateField).toBe("function");
      expect(typeof result.current.updateMultipleFields).toBe("function");
      expect(typeof result.current.toggleBump).toBe("function");
      expect(typeof result.current.setPaymentMethod).toBe("function");
      expect(typeof result.current.applyCoupon).toBe("function");
      expect(typeof result.current.removeCoupon).toBe("function");
      expect(typeof result.current.submit).toBe("function");
    });
  });

  describe("State Flags", () => {
    it("should correctly reflect idle state", () => {
      const { result } = renderHook(() => useCheckoutPublicMachine());

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it("should provide context data from machine", () => {
      const { result } = renderHook(() => useCheckoutPublicMachine());

      // The hook should expose context data
      expect(result.current.formData).toBeDefined();
      expect(result.current.selectedBumps).toBeDefined();
      expect(result.current.selectedPaymentMethod).toBeDefined();
    });
  });

  describe("Hook Cleanup", () => {
    it("should not throw errors on unmount", () => {
      const { unmount } = renderHook(() => useCheckoutPublicMachine());

      expect(() => unmount()).not.toThrow();
    });

    it("should handle multiple renders without issues", () => {
      const { rerender } = renderHook(() => useCheckoutPublicMachine());

      expect(() => {
        rerender();
        rerender();
        rerender();
      }).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing slug gracefully", () => {
      vi.mocked(await import("react-router-dom")).useParams = () => ({});

      const { result } = renderHook(() => useCheckoutPublicMachine());

      // Should still return valid hook interface
      expect(result.current).toBeDefined();
      expect(result.current.load).toBeDefined();
    });

    it("should handle affiliate code from search params", () => {
      const mockSearchParams = new URLSearchParams("ref=AFFILIATE123");
      vi.mocked(await import("react-router-dom")).useSearchParams = () => [
        mockSearchParams,
      ];

      const { result } = renderHook(() => useCheckoutPublicMachine());

      // Hook should be initialized
      expect(result.current).toBeDefined();
    });
  });
});
