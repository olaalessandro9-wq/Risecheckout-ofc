/**
 * Clone Checkout Deep Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for checkout layout cloning via RPC:
 * - Correct RPC invocation
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cloneCheckoutDeep } from "../cloneCheckoutDeep";

// Mock RPC Proxy
const mockCloneCheckoutLayoutRpc = vi.fn();

vi.mock("@/lib/rpc/rpcProxy", () => ({
  cloneCheckoutLayoutRpc: (...args: unknown[]) => mockCloneCheckoutLayoutRpc(...args),
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

describe("cloneCheckoutDeep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========== SUCCESS ==========

  describe("Success", () => {
    it("should call RPC with source and destination checkout IDs", async () => {
      mockCloneCheckoutLayoutRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      await cloneCheckoutDeep("source-checkout-id", "destination-checkout-id");

      expect(mockCloneCheckoutLayoutRpc).toHaveBeenCalledWith(
        "source-checkout-id",
        "destination-checkout-id"
      );
    });

    it("should complete without error on success", async () => {
      mockCloneCheckoutLayoutRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        cloneCheckoutDeep("src", "dst")
      ).resolves.toBeUndefined();
    });
  });

  // ========== ERROR HANDLING ==========

  describe("Error Handling", () => {
    it("should throw RPC error", async () => {
      const rpcError = new Error("RPC failed: checkout not found");
      
      mockCloneCheckoutLayoutRpc.mockResolvedValue({
        data: null,
        error: rpcError,
      });

      await expect(
        cloneCheckoutDeep("src", "dst")
      ).rejects.toThrow("RPC failed: checkout not found");
    });

    it("should propagate error from RPC", async () => {
      const customError = new Error("Permission denied");
      
      mockCloneCheckoutLayoutRpc.mockResolvedValue({
        data: null,
        error: customError,
      });

      await expect(
        cloneCheckoutDeep("src", "dst")
      ).rejects.toBe(customError);
    });
  });
});
