/**
 * attachOfferToCheckoutSmart Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the attachOfferToCheckoutSmart function.
 * 
 * @module test/lib/links/attachOfferToCheckoutSmart
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { attachOfferToCheckoutSmart } from "@/lib/links/attachOfferToCheckoutSmart";
import { invokeRpc } from "@/lib/rpc/rpcProxy";

// Mock the RPC proxy
vi.mock("@/lib/rpc/rpcProxy", () => ({
  invokeRpc: vi.fn(),
}));

describe("attachOfferToCheckoutSmart", () => {
  const mockInvokeRpc = vi.mocked(invokeRpc);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("success cases", () => {
    it("should attach offer and return result", async () => {
      const mockResult = {
        mode: "reused" as const,
        offer_id: "offer-001",
        link_id: "link-123",
        slug: "offer-slug",
      };

      mockInvokeRpc.mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await attachOfferToCheckoutSmart("checkout-001", "offer-001");

      expect(result).toEqual(mockResult);
      expect(mockInvokeRpc).toHaveBeenCalledWith(
        "attach_offer_to_checkout_smart",
        { p_checkout_id: "checkout-001", p_offer_id: "offer-001" },
        "producer"
      );
    });

    it("should handle reusing existing link", async () => {
      const mockResult = {
        mode: "reused" as const,
        offer_id: "offer-002",
        link_id: "existing-link",
        slug: "existing-slug",
      };

      mockInvokeRpc.mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await attachOfferToCheckoutSmart("checkout-002", "offer-002");

      expect(result.mode).toBe("reused");
      expect(result.link_id).toBe("existing-link");
    });

    it("should handle cloning link", async () => {
      const mockResult = {
        mode: "cloned" as const,
        offer_id: "offer-003",
        link_id: "new-link",
        slug: "new-unique-slug",
      };

      mockInvokeRpc.mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await attachOfferToCheckoutSmart("checkout-003", "offer-003");

      expect(result.mode).toBe("cloned");
      expect(result.link_id).toBe("new-link");
    });
  });

  describe("error cases", () => {
    it("should throw on RPC error", async () => {
      mockInvokeRpc.mockResolvedValue({
        data: null,
        error: new Error("RPC failed"),
      });

      await expect(
        attachOfferToCheckoutSmart("checkout-error", "offer-error")
      ).rejects.toThrow("RPC failed");
    });

    it("should throw when RPC returns no data", async () => {
      mockInvokeRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        attachOfferToCheckoutSmart("checkout-no-data", "offer-no-data")
      ).rejects.toThrow("RPC não retornou dados");
    });

    it("should throw when RPC returns undefined", async () => {
      mockInvokeRpc.mockResolvedValue({
        data: undefined,
        error: null,
      });

      await expect(
        attachOfferToCheckoutSmart("checkout-undefined", "offer-undefined")
      ).rejects.toThrow("RPC não retornou dados");
    });
  });

  describe("parameter handling", () => {
    it("should pass correct parameters to RPC", async () => {
      mockInvokeRpc.mockResolvedValue({
        data: { mode: "reused" as const, offer_id: "my-offer-id", link_id: "test", slug: "test" },
        error: null,
      });

      await attachOfferToCheckoutSmart("my-checkout-id", "my-offer-id");

      expect(mockInvokeRpc).toHaveBeenCalledWith(
        "attach_offer_to_checkout_smart",
        {
          p_checkout_id: "my-checkout-id",
          p_offer_id: "my-offer-id",
        },
        "producer"
      );
    });

    it("should use producer role for RPC call", async () => {
      mockInvokeRpc.mockResolvedValue({
        data: { mode: "reused" as const, offer_id: "offer", link_id: "test", slug: "test" },
        error: null,
      });

      await attachOfferToCheckoutSmart("checkout", "offer");

      expect(mockInvokeRpc).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        "producer"
      );
    });
  });
});
