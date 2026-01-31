/**
 * @file useCheckoutPublicMachine.test.ts
 * @description Tests for useCheckoutPublicMachine hook
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCheckoutPublicMachine } from "../useCheckoutPublicMachine";
import { mockLoadedContext } from "../../__tests__/_fixtures";

// Mock dependencies
vi.mock("react-router-dom", () => ({
  useParams: () => ({ slug: "test-checkout" }),
  useSearchParams: () => [new URLSearchParams()],
}));

// Create a complete XState mock with all required methods
const mockState = {
  value: "idle",
  matches: vi.fn((state: string) => state === "idle"),
  context: mockLoadedContext,
  can: vi.fn(() => true), // ✅ Add the missing can() method
  hasTag: vi.fn(() => false),
  toStrings: vi.fn(() => ["idle"]),
  children: {},
  history: undefined,
  meta: {},
  done: false,
  event: { type: "INIT" },
  _event: { type: "INIT" },
};

const mockSend = vi.fn();

vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [mockState, mockSend]),
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
    
    // Reset mock state
    mockState.value = "idle";
    mockState.matches = vi.fn((state: string) => state === "idle");
    mockState.context = mockLoadedContext;
    mockState.can = vi.fn(() => true);
  });

  describe("Hook Initialization", () => {
    it("should return hook interface without crashing", () => {
      expect(() => renderHook(() => useCheckoutPublicMachine())).not.toThrow();
    });

    it("should have all required properties", () => {
      const { result } = renderHook(() => useCheckoutPublicMachine());

      expect(result.current).toHaveProperty("isIdle");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("formData");
      expect(result.current).toHaveProperty("submit");
    });

    it("should have function types for actions", () => {
      const { result } = renderHook(() => useCheckoutPublicMachine());

      expect(typeof result.current.load).toBe("function");
      expect(typeof result.current.submit).toBe("function");
      expect(typeof result.current.updateField).toBe("function");
    });
  });

  describe("Hook Cleanup", () => {
    it("should not throw errors on unmount", () => {
      const { unmount } = renderHook(() => useCheckoutPublicMachine());

      expect(() => unmount()).not.toThrow();
    });

    it("should handle multiple renders", () => {
      const { rerender } = renderHook(() => useCheckoutPublicMachine());

      expect(() => {
        rerender();
        rerender();
      }).not.toThrow();
    });
  });
});
