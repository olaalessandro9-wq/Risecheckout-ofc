/**
 * RPC Proxy Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the centralized RPC invocation utility:
 * - invokeRpc with different auth levels
 * - Typed RPC helpers
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  invokeRpc,
  validateCouponRpc,
  getCheckoutBySlugRpc,
  getAffiliateCheckoutInfoRpc,
  attachOfferToCheckoutSmartRpc,
  cloneCheckoutLayoutRpc,
  duplicateCheckoutShallowRpc,
  getDashboardMetricsRpc,
  getSystemHealthSummaryRpc,
} from "../rpcProxy";

// Mock api
const mockApiCall = vi.fn();
const mockPublicCall = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    call: (path: string, body: unknown) => mockApiCall(path, body),
    publicCall: (path: string, body: unknown) => mockPublicCall(path, body),
  },
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

describe("RpcProxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========== INVOKE RPC ==========

  describe("invokeRpc", () => {
    it("should use publicCall for public auth level", async () => {
      mockPublicCall.mockResolvedValue({ data: { data: "test" }, error: null });

      await invokeRpc("test_rpc", { param1: "value" }, "public");

      expect(mockPublicCall).toHaveBeenCalledWith("rpc-proxy", {
        rpc: "test_rpc",
        params: { param1: "value" },
      });
      expect(mockApiCall).not.toHaveBeenCalled();
    });

    it("should use call for producer auth level", async () => {
      mockApiCall.mockResolvedValue({ data: { data: "test" }, error: null });

      await invokeRpc("test_rpc", { param1: "value" }, "producer");

      expect(mockApiCall).toHaveBeenCalledWith("rpc-proxy", {
        rpc: "test_rpc",
        params: { param1: "value" },
      });
      expect(mockPublicCall).not.toHaveBeenCalled();
    });

    it("should use call for admin auth level", async () => {
      mockApiCall.mockResolvedValue({ data: { data: "test" }, error: null });

      await invokeRpc("test_rpc", {}, "admin");

      expect(mockApiCall).toHaveBeenCalledWith("rpc-proxy", {
        rpc: "test_rpc",
        params: {},
      });
    });

    it("should return data on success", async () => {
      mockPublicCall.mockResolvedValue({
        data: { data: { id: "123", name: "Test" } },
        error: null,
      });

      const result = await invokeRpc<{ id: string; name: string }>("test_rpc", {}, "public");

      expect(result.data).toEqual({ id: "123", name: "Test" });
      expect(result.error).toBeNull();
    });

    it("should return error from api", async () => {
      mockPublicCall.mockResolvedValue({
        data: null,
        error: { message: "API Error" },
      });

      const result = await invokeRpc("test_rpc", {}, "public");

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe("API Error");
    });

    it("should return error from rpc-proxy response", async () => {
      mockPublicCall.mockResolvedValue({
        data: { error: "RPC execution failed" },
        error: null,
      });

      const result = await invokeRpc("test_rpc", {}, "public");

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe("RPC execution failed");
    });

    it("should handle exceptions", async () => {
      mockPublicCall.mockRejectedValue(new Error("Network error"));

      const result = await invokeRpc("test_rpc", {}, "public");

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe("Network error");
    });

    it("should default to public auth level", async () => {
      mockPublicCall.mockResolvedValue({ data: { data: null }, error: null });

      await invokeRpc("test_rpc", {});

      expect(mockPublicCall).toHaveBeenCalled();
    });
  });

  // ========== TYPED RPC HELPERS ==========

  describe("validateCouponRpc", () => {
    it("should call RPC with correct parameters", async () => {
      mockPublicCall.mockResolvedValue({
        data: { data: { valid: true, discount_value: 10 } },
        error: null,
      });

      const result = await validateCouponRpc("CODE123", "product-id");

      expect(mockPublicCall).toHaveBeenCalledWith("rpc-proxy", {
        rpc: "validate_coupon",
        params: { p_code: "CODE123", p_product_id: "product-id" },
      });
      expect(result.data?.valid).toBe(true);
    });
  });

  describe("getCheckoutBySlugRpc", () => {
    it("should call RPC with slug parameter", async () => {
      mockPublicCall.mockResolvedValue({
        data: { data: [{ checkout_id: "123", product_id: "456" }] },
        error: null,
      });

      const result = await getCheckoutBySlugRpc("my-checkout");

      expect(mockPublicCall).toHaveBeenCalledWith("rpc-proxy", {
        rpc: "get_checkout_by_payment_slug",
        params: { p_slug: "my-checkout" },
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getAffiliateCheckoutInfoRpc", () => {
    it("should call RPC with affiliate code and product ID", async () => {
      mockPublicCall.mockResolvedValue({
        data: { data: [{ pix_gateway: "mercadopago" }] },
        error: null,
      });

      await getAffiliateCheckoutInfoRpc("AFF123", "product-id");

      expect(mockPublicCall).toHaveBeenCalledWith("rpc-proxy", {
        rpc: "get_affiliate_checkout_info",
        params: { p_affiliate_code: "AFF123", p_product_id: "product-id" },
      });
    });
  });

  describe("attachOfferToCheckoutSmartRpc", () => {
    it("should use producer auth level", async () => {
      mockApiCall.mockResolvedValue({
        data: { data: { link_id: "link-123", created: true } },
        error: null,
      });

      await attachOfferToCheckoutSmartRpc("checkout-id", "offer-id");

      expect(mockApiCall).toHaveBeenCalledWith("rpc-proxy", {
        rpc: "attach_offer_to_checkout_smart",
        params: { p_checkout_id: "checkout-id", p_offer_id: "offer-id" },
      });
    });
  });

  describe("cloneCheckoutLayoutRpc", () => {
    it("should call RPC with source and target checkout IDs", async () => {
      mockApiCall.mockResolvedValue({ data: { data: null }, error: null });

      await cloneCheckoutLayoutRpc("source-id", "target-id");

      expect(mockApiCall).toHaveBeenCalledWith("rpc-proxy", {
        rpc: "clone_checkout_layout",
        params: { p_source_checkout_id: "source-id", p_target_checkout_id: "target-id" },
      });
    });
  });

  describe("duplicateCheckoutShallowRpc", () => {
    it("should return new checkout ID on success", async () => {
      mockApiCall.mockResolvedValue({
        data: { data: "new-checkout-id" },
        error: null,
      });

      const result = await duplicateCheckoutShallowRpc("source-id");

      expect(result.data).toBe("new-checkout-id");
    });
  });

  describe("getDashboardMetricsRpc", () => {
    it("should call RPC with vendor and date range", async () => {
      mockApiCall.mockResolvedValue({ data: { data: {} }, error: null });

      await getDashboardMetricsRpc("vendor-id", "2024-01-01", "2024-01-31");

      expect(mockApiCall).toHaveBeenCalledWith("rpc-proxy", {
        rpc: "get_dashboard_metrics",
        params: {
          p_vendor_id: "vendor-id",
          p_start_date: "2024-01-01",
          p_end_date: "2024-01-31",
        },
      });
    });
  });

  describe("getSystemHealthSummaryRpc", () => {
    it("should use admin auth level", async () => {
      mockApiCall.mockResolvedValue({ data: { data: [] }, error: null });

      await getSystemHealthSummaryRpc();

      expect(mockApiCall).toHaveBeenCalledWith("rpc-proxy", {
        rpc: "get_system_health_summary",
        params: {},
      });
    });
  });
});
