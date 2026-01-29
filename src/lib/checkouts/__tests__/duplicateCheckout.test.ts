/**
 * Duplicate Checkout Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for checkout duplication via RPC:
 * - Slug sanitization
 * - Correct RPC invocation
 * - Return values
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { duplicateCheckout } from "../duplicateCheckout";

// Mock RPC Proxy
const mockDuplicateCheckoutShallowRpc = vi.fn();

vi.mock("@/lib/rpc/rpcProxy", () => ({
  duplicateCheckoutShallowRpc: (...args: unknown[]) => mockDuplicateCheckoutShallowRpc(...args),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("duplicateCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========== SLUG SANITIZATION ==========

  describe("Slug Sanitization", () => {
    it("should remove 'checkout-' prefix from ID", async () => {
      mockDuplicateCheckoutShallowRpc.mockResolvedValue({
        data: "new-checkout-id",
        error: null,
      });

      await duplicateCheckout("checkout-abc123");

      expect(mockDuplicateCheckoutShallowRpc).toHaveBeenCalledWith("abc123");
    });

    it("should not modify ID without 'checkout-' prefix", async () => {
      mockDuplicateCheckoutShallowRpc.mockResolvedValue({
        data: "new-checkout-id",
        error: null,
      });

      await duplicateCheckout("regular-id");

      expect(mockDuplicateCheckoutShallowRpc).toHaveBeenCalledWith("regular-id");
    });
  });

  // ========== SUCCESS ==========

  describe("Success", () => {
    it("should return new checkout ID", async () => {
      mockDuplicateCheckoutShallowRpc.mockResolvedValue({
        data: "new-checkout-456",
        error: null,
      });

      const result = await duplicateCheckout("source-checkout");

      expect(result.id).toBe("new-checkout-456");
    });

    it("should return edit URL with new checkout ID", async () => {
      mockDuplicateCheckoutShallowRpc.mockResolvedValue({
        data: "new-checkout-789",
        error: null,
      });

      const result = await duplicateCheckout("source-checkout");

      expect(result.editUrl).toBe("/dashboard/produtos/checkout/personalizar?id=new-checkout-789");
    });
  });

  // ========== ERROR HANDLING ==========

  describe("Error Handling", () => {
    it("should throw RPC error", async () => {
      const rpcError = new Error("Checkout not found");
      
      mockDuplicateCheckoutShallowRpc.mockResolvedValue({
        data: null,
        error: rpcError,
      });

      await expect(
        duplicateCheckout("source-checkout")
      ).rejects.toThrow("Checkout not found");
    });

    it("should throw when no ID returned", async () => {
      mockDuplicateCheckoutShallowRpc.mockResolvedValue({
        data: null, // No newId returned
        error: null,
      });

      await expect(
        duplicateCheckout("source-checkout")
      ).rejects.toThrow("RPC não retornou o ID do novo checkout");
    });

    it("should throw when empty string returned", async () => {
      mockDuplicateCheckoutShallowRpc.mockResolvedValue({
        data: "", // Empty string
        error: null,
      });

      await expect(
        duplicateCheckout("source-checkout")
      ).rejects.toThrow("RPC não retornou o ID do novo checkout");
    });
  });
});
