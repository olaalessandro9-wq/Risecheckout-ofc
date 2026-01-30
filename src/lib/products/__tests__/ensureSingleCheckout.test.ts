/**
 * ensureSingleCheckout Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the ensureSingleCheckout function.
 * 
 * @module test/lib/products/ensureSingleCheckout
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ensureSingleCheckout } from "@/lib/products/ensureSingleCheckout";
import { api } from "@/lib/api";

// Mock the api module
vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

describe("ensureSingleCheckout", () => {
  const mockApiCall = vi.mocked(api.call);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("success cases", () => {
    it("should return checkout when found immediately", async () => {
      const mockCheckout = { id: "checkout-123" };
      
      // All calls return checkout (stabilization period)
      mockApiCall.mockResolvedValue({
        data: { checkouts: [mockCheckout] },
        error: null,
      });

      const promise = ensureSingleCheckout("product-001");
      
      // Advance through all timeout periods
      await vi.runAllTimersAsync();
      
      const result = await promise;
      expect(result).toEqual(mockCheckout);
    });

    it("should wait for checkout to appear", async () => {
      const mockCheckout = { id: "checkout-456" };
      
      // First 2 calls return empty, then return checkout
      mockApiCall
        .mockResolvedValueOnce({ data: { checkouts: [] }, error: null })
        .mockResolvedValueOnce({ data: { checkouts: [] }, error: null })
        .mockResolvedValueOnce({ data: { checkouts: [mockCheckout] }, error: null })
        .mockResolvedValue({ data: { checkouts: [mockCheckout] }, error: null });

      const promise = ensureSingleCheckout("product-002", { tries: 10, delayMs: 100 });
      
      await vi.runAllTimersAsync();
      
      const result = await promise;
      expect(result).toEqual(mockCheckout);
    });

    it("should handle string product ID", async () => {
      const mockCheckout = { id: "checkout-789" };
      mockApiCall.mockResolvedValue({
        data: { checkouts: [mockCheckout] },
        error: null,
      });

      const promise = ensureSingleCheckout("product-string");
      await vi.runAllTimersAsync();
      
      const result = await promise;
      expect(result).toEqual(mockCheckout);
      expect(mockApiCall).toHaveBeenCalledWith("products-crud", {
        action: "get-checkouts",
        productId: "product-string",
      });
    });

    it("should handle numeric product ID", async () => {
      const mockCheckout = { id: "checkout-num" };
      mockApiCall.mockResolvedValue({
        data: { checkouts: [mockCheckout] },
        error: null,
      });

      const promise = ensureSingleCheckout(12345);
      await vi.runAllTimersAsync();
      
      const result = await promise;
      expect(result).toEqual(mockCheckout);
      expect(mockApiCall).toHaveBeenCalledWith("products-crud", {
        action: "get-checkouts",
        productId: "12345",
      });
    });
  });

  describe("error cases", () => {
    it("should throw on edge function error", async () => {
      mockApiCall.mockResolvedValue({
        data: null,
        error: { code: "NETWORK_ERROR", message: "Network error" },
      });

      await expect(async () => {
        const promise = ensureSingleCheckout("product-error");
        await vi.runAllTimersAsync();
        await promise;
      }).rejects.toThrow();
    });

    it("should throw on API error in response", async () => {
      mockApiCall.mockResolvedValue({
        data: { error: "Product not found" },
        error: null,
      });

      await expect(async () => {
        const promise = ensureSingleCheckout("product-not-found");
        await vi.runAllTimersAsync();
        await promise;
      }).rejects.toThrow("Product not found");
    });

    it("should throw timeout when no checkout appears", async () => {
      mockApiCall.mockResolvedValue({
        data: { checkouts: [] },
        error: null,
      });

      await expect(async () => {
        const promise = ensureSingleCheckout("product-timeout", { tries: 3, delayMs: 50 });
        await vi.runAllTimersAsync();
        await promise;
      }).rejects.toThrow(/Timeout/);
    });
  });

  describe("options", () => {
    it("should use custom tries value", async () => {
      mockApiCall.mockResolvedValue({
        data: { checkouts: [] },
        error: null,
      });

      await expect(async () => {
        const promise = ensureSingleCheckout("product-custom", { tries: 5 });
        await vi.runAllTimersAsync();
        await promise;
      }).rejects.toThrow(/Timeout/);
      
      // Should have called 5 times
      expect(mockApiCall).toHaveBeenCalledTimes(5);
    });

    it("should use custom delay value", async () => {
      const mockCheckout = { id: "checkout-delay" };
      mockApiCall
        .mockResolvedValueOnce({ data: { checkouts: [] }, error: null })
        .mockResolvedValue({ data: { checkouts: [mockCheckout] }, error: null });

      const promise = ensureSingleCheckout("product-delay", { delayMs: 500 });
      
      await vi.runAllTimersAsync();
      
      const result = await promise;
      expect(result).toEqual(mockCheckout);
    });
  });

  describe("multiple checkouts handling", () => {
    it("should return first checkout when multiple exist", async () => {
      const mockCheckouts = [
        { id: "checkout-first" },
        { id: "checkout-second" },
      ];
      mockApiCall.mockResolvedValue({
        data: { checkouts: mockCheckouts },
        error: null,
      });

      const promise = ensureSingleCheckout("product-multiple");
      await vi.runAllTimersAsync();
      
      const result = await promise;
      expect(result).toEqual({ id: "checkout-first" });
    });
  });
});
