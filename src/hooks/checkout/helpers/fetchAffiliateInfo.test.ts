/**
 * fetchAffiliateInfo Helper Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAffiliateCode, fetchAffiliateInfo } from "./fetchAffiliateInfo";
import { getAffiliateCheckoutInfoRpc } from "@/lib/rpc/rpcProxy";

vi.mock("@/lib/rpc/rpcProxy", () => ({
  getAffiliateCheckoutInfoRpc: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("fetchAffiliateInfo", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  // ============================================================================
  // getAffiliateCode
  // ============================================================================

  describe("getAffiliateCode", () => {
    it("should extract ref param from URL", () => {
      Object.defineProperty(window, "location", {
        value: { search: "?ref=affiliate123" },
        writable: true,
      });

      const code = getAffiliateCode();
      expect(code).toBe("affiliate123");
    });

    it("should return null if no ref param", () => {
      Object.defineProperty(window, "location", {
        value: { search: "" },
        writable: true,
      });

      const code = getAffiliateCode();
      expect(code).toBeNull();
    });

    it("should handle other query params", () => {
      Object.defineProperty(window, "location", {
        value: { search: "?utm_source=google&ref=mycode&utm_medium=cpc" },
        writable: true,
      });

      const code = getAffiliateCode();
      expect(code).toBe("mycode");
    });
  });

  // ============================================================================
  // fetchAffiliateInfo
  // ============================================================================

  describe("fetchAffiliateInfo", () => {
    it("should return default if no affiliate code", async () => {
      const result = await fetchAffiliateInfo("", "product-123");

      expect(result).toEqual({
        pixGateway: null,
        creditCardGateway: null,
        mercadoPagoPublicKey: null,
        stripePublicKey: null,
      });
      expect(getAffiliateCheckoutInfoRpc).not.toHaveBeenCalled();
    });

    it("should call RPC with correct params", async () => {
      vi.mocked(getAffiliateCheckoutInfoRpc).mockResolvedValue({
        data: [],
        error: null,
      });

      await fetchAffiliateInfo("aff-code", "product-123");

      expect(getAffiliateCheckoutInfoRpc).toHaveBeenCalledWith(
        "aff-code",
        "product-123"
      );
    });

    it("should return gateway info when found", async () => {
      vi.mocked(getAffiliateCheckoutInfoRpc).mockResolvedValue({
        data: [
          {
            pix_gateway: "pushinpay",
            credit_card_gateway: "stripe",
            mercadopago_public_key: "mp-key-123",
            stripe_public_key: "stripe-key-456",
          },
        ],
        error: null,
      });

      const result = await fetchAffiliateInfo("aff-code", "product-123");

      expect(result).toEqual({
        pixGateway: "pushinpay",
        creditCardGateway: "stripe",
        mercadoPagoPublicKey: "mp-key-123",
        stripePublicKey: "stripe-key-456",
      });
    });

    it("should handle RPC error", async () => {
      vi.mocked(getAffiliateCheckoutInfoRpc).mockResolvedValue({
        data: null,
        error: { name: "Error", message: "RPC failed" },
      });

      const result = await fetchAffiliateInfo("aff-code", "product-123");

      expect(result).toEqual({
        pixGateway: null,
        creditCardGateway: null,
        mercadoPagoPublicKey: null,
        stripePublicKey: null,
      });
    });

    it("should handle empty data array", async () => {
      vi.mocked(getAffiliateCheckoutInfoRpc).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await fetchAffiliateInfo("aff-code", "product-123");

      expect(result).toEqual({
        pixGateway: null,
        creditCardGateway: null,
        mercadoPagoPublicKey: null,
        stripePublicKey: null,
      });
    });

    it("should return default on null data", async () => {
      vi.mocked(getAffiliateCheckoutInfoRpc).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await fetchAffiliateInfo("aff-code", "product-123");

      expect(result).toEqual({
        pixGateway: null,
        creditCardGateway: null,
        mercadoPagoPublicKey: null,
        stripePublicKey: null,
      });
    });

    it("should handle partial gateway data", async () => {
      vi.mocked(getAffiliateCheckoutInfoRpc).mockResolvedValue({
        data: [
          {
            pix_gateway: "mercadopago",
            credit_card_gateway: null,
            mercadopago_public_key: "mp-key",
            stripe_public_key: null,
          },
        ],
        error: null,
      });

      const result = await fetchAffiliateInfo("aff-code", "product-123");

      expect(result.pixGateway).toBe("mercadopago");
      expect(result.creditCardGateway).toBeNull();
      expect(result.mercadoPagoPublicKey).toBe("mp-key");
      expect(result.stripePublicKey).toBeNull();
    });
  });
});
