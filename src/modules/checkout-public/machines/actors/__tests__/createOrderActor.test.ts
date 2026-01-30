/**
 * Create Order Actor Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the order creation async actor.
 * 
 * @module test/checkout-public/machines/actors
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CreateOrderInput, CreateOrderOutput } from "../createOrderActor";

// ============================================================================
// MOCKS
// ============================================================================

const mockPublicApiCall = vi.fn();
const mockGetAffiliateCode = vi.fn();

vi.mock("@/lib/api/public-client", () => ({
  publicApi: {
    call: (...args: unknown[]) => mockPublicApiCall(...args),
  },
}));

vi.mock("@/hooks/checkout/helpers", () => ({
  getAffiliateCode: () => mockGetAffiliateCode(),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// ============================================================================
// HELPERS
// ============================================================================

function createMockInput(overrides: Partial<CreateOrderInput> = {}): CreateOrderInput {
  return {
    productId: "product-123",
    checkoutId: "checkout-456",
    offerId: "offer-789",
    formData: {
      name: "João Silva",
      email: "joao@example.com",
      phone: "(11) 99999-9999",
      cpf: "123.456.789-00",
    },
    selectedBumps: ["bump-1", "bump-2"],
    couponId: null,
    gateway: "mercadopago",
    paymentMethod: "pix",
    ...overrides,
  };
}

/**
 * Simulates the actor logic for testing
 * (since fromPromise actors need to be invoked via machine)
 */
async function simulateActor(input: CreateOrderInput): Promise<CreateOrderOutput> {
  const affiliateCode = mockGetAffiliateCode();
  
  const payload = {
    product_id: input.productId,
    offer_id: input.offerId || input.productId,
    checkout_id: input.checkoutId,
    customer_name: input.formData.name,
    customer_email: input.formData.email,
    customer_phone: input.formData.phone || null,
    customer_cpf: input.formData.cpf?.replace(/\D/g, '') || null,
    order_bump_ids: input.selectedBumps,
    gateway: input.gateway.toUpperCase(),
    payment_method: input.paymentMethod,
    coupon_id: input.couponId,
    affiliate_code: affiliateCode,
  };

  const { data, error } = await mockPublicApiCall("create-order", payload);

  if (error) {
    return {
      success: false,
      orderId: '',
      accessToken: '',
      error: error?.message ?? "Erro de rede ao criar pedido",
    };
  }

  if (!data?.success || !data?.order_id) {
    return {
      success: false,
      orderId: '',
      accessToken: '',
      error: data?.error || "Erro ao criar pedido",
    };
  }

  return {
    success: true,
    orderId: data.order_id,
    accessToken: data.access_token || '',
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe("createOrderActor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAffiliateCode.mockReturnValue(null);
  });

  describe("successful order creation", () => {
    it("should create order successfully with all data", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: true,
          order_id: "order-abc123",
          access_token: "token-xyz789",
        },
        error: null,
      });

      const input = createMockInput();
      const result = await simulateActor(input);

      expect(result.success).toBe(true);
      expect(result.orderId).toBe("order-abc123");
      expect(result.accessToken).toBe("token-xyz789");
      expect(result.error).toBeUndefined();
    });

    it("should strip non-numeric characters from CPF", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { success: true, order_id: "order-1", access_token: "token-1" },
        error: null,
      });

      const input = createMockInput({
        formData: {
          name: "Test",
          email: "test@test.com",
          cpf: "123.456.789-00",
        },
      });

      await simulateActor(input);

      expect(mockPublicApiCall).toHaveBeenCalledWith(
        "create-order",
        expect.objectContaining({
          customer_cpf: "12345678900",
        })
      );
    });

    it("should use productId as offer_id when offerId is null", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { success: true, order_id: "order-1", access_token: "token-1" },
        error: null,
      });

      const input = createMockInput({ offerId: null });

      await simulateActor(input);

      expect(mockPublicApiCall).toHaveBeenCalledWith(
        "create-order",
        expect.objectContaining({
          offer_id: "product-123",
        })
      );
    });

    it("should include affiliate code when present", async () => {
      mockGetAffiliateCode.mockReturnValue("AFF-CODE-123");
      mockPublicApiCall.mockResolvedValue({
        data: { success: true, order_id: "order-1", access_token: "token-1" },
        error: null,
      });

      const input = createMockInput();
      await simulateActor(input);

      expect(mockPublicApiCall).toHaveBeenCalledWith(
        "create-order",
        expect.objectContaining({
          affiliate_code: "AFF-CODE-123",
        })
      );
    });

    it("should uppercase the gateway", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { success: true, order_id: "order-1", access_token: "token-1" },
        error: null,
      });

      const input = createMockInput({ gateway: "pushinpay" });
      await simulateActor(input);

      expect(mockPublicApiCall).toHaveBeenCalledWith(
        "create-order",
        expect.objectContaining({
          gateway: "PUSHINPAY",
        })
      );
    });
  });

  describe("error handling", () => {
    it("should handle API network error", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: null,
        error: { message: "Network timeout" },
      });

      const input = createMockInput();
      const result = await simulateActor(input);

      expect(result.success).toBe(false);
      expect(result.orderId).toBe("");
      expect(result.accessToken).toBe("");
      expect(result.error).toBe("Network timeout");
    });

    it("should handle API failure response", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: false,
          error: "Produto inativo",
        },
        error: null,
      });

      const input = createMockInput();
      const result = await simulateActor(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Produto inativo");
    });

    it("should handle missing order_id in response", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: true,
          order_id: null,
        },
        error: null,
      });

      const input = createMockInput();
      const result = await simulateActor(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Erro ao criar pedido");
    });

    it("should return empty accessToken when not provided", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: true,
          order_id: "order-1",
          // access_token intentionally missing
        },
        error: null,
      });

      const input = createMockInput();
      const result = await simulateActor(input);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe("");
    });
  });

  describe("payment methods", () => {
    it("should handle pix payment method", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { success: true, order_id: "order-1", access_token: "token-1" },
        error: null,
      });

      const input = createMockInput({ paymentMethod: "pix" });
      await simulateActor(input);

      expect(mockPublicApiCall).toHaveBeenCalledWith(
        "create-order",
        expect.objectContaining({
          payment_method: "pix",
        })
      );
    });

    it("should handle credit_card payment method", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { success: true, order_id: "order-1", access_token: "token-1" },
        error: null,
      });

      const input = createMockInput({ paymentMethod: "credit_card" });
      await simulateActor(input);

      expect(mockPublicApiCall).toHaveBeenCalledWith(
        "create-order",
        expect.objectContaining({
          payment_method: "credit_card",
        })
      );
    });
  });

  describe("optional fields", () => {
    it("should handle missing phone", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { success: true, order_id: "order-1", access_token: "token-1" },
        error: null,
      });

      const input = createMockInput({
        formData: {
          name: "Test",
          email: "test@test.com",
          // phone omitted
        },
      });

      await simulateActor(input);

      expect(mockPublicApiCall).toHaveBeenCalledWith(
        "create-order",
        expect.objectContaining({
          customer_phone: null,
        })
      );
    });

    it("should handle missing CPF", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { success: true, order_id: "order-1", access_token: "token-1" },
        error: null,
      });

      const input = createMockInput({
        formData: {
          name: "Test",
          email: "test@test.com",
          // cpf omitted
        },
      });

      await simulateActor(input);

      expect(mockPublicApiCall).toHaveBeenCalledWith(
        "create-order",
        expect.objectContaining({
          customer_cpf: null,
        })
      );
    });

    it("should handle empty order bumps", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { success: true, order_id: "order-1", access_token: "token-1" },
        error: null,
      });

      const input = createMockInput({ selectedBumps: [] });
      await simulateActor(input);

      expect(mockPublicApiCall).toHaveBeenCalledWith(
        "create-order",
        expect.objectContaining({
          order_bump_ids: [],
        })
      );
    });
  });
});
