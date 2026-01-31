/**
 * @file createAsaasCreditCardPayment.test.ts
 * @description Tests for createAsaasCreditCardPayment API function
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the API client
vi.mock("@/lib/api", () => ({
  api: {
    publicCall: vi.fn(),
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { api } from "@/lib/api";
import { createAsaasCreditCardPayment } from "../../../api/payment-api";
import type { AsaasPaymentRequest } from "../../../types";

describe("createAsaasCreditCardPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPaymentRequest: AsaasPaymentRequest = {
    vendorId: "vendor-123",
    amountCents: 10000,
    description: "Test Payment",
    customer: {
      name: "John Doe",
      email: "john@example.com",
      cpfCnpj: "12345678901",
      phone: "11999999999",
    },
    paymentMethod: "pix",
    orderId: "order-123",
  };

  const cardPaymentRequest: AsaasPaymentRequest = {
    ...mockPaymentRequest,
    paymentMethod: "credit_card",
    cardToken: "card-token-123",
    installments: 3,
  };

  describe("Success Cases", () => {
    it("should create credit card payment successfully", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: {
          success: true,
          transactionId: "txn-456",
          status: "approved",
        },
        error: null,
      });

      const result = await createAsaasCreditCardPayment(cardPaymentRequest);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("txn-456");
      expect(result.status).toBe("approved");
    });

    it("should call API with credit_card payment method", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      await createAsaasCreditCardPayment(cardPaymentRequest);

      expect(api.publicCall).toHaveBeenCalledWith(
        "asaas-create-payment",
        expect.objectContaining({
          paymentMethod: "credit_card",
        })
      );
    });

    it("should handle processing status", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: {
          success: true,
          status: "processing",
          transactionId: "txn-789",
        },
        error: null,
      });

      const result = await createAsaasCreditCardPayment(cardPaymentRequest);

      expect(result.status).toBe("processing");
    });

    it("should pass installments in request", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      await createAsaasCreditCardPayment(cardPaymentRequest);

      expect(api.publicCall).toHaveBeenCalledWith(
        "asaas-create-payment",
        expect.objectContaining({
          installments: 3,
        })
      );
    });
  });

  describe("Error Cases", () => {
    it("should return error on API failure", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: null,
        error: { code: "VALIDATION_ERROR", message: "Card declined" },
      });

      const result = await createAsaasCreditCardPayment(cardPaymentRequest);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe("Card declined");
    });

    it("should return error on exception", async () => {
      vi.mocked(api.publicCall).mockRejectedValueOnce(
        new Error("Connection timeout")
      );

      const result = await createAsaasCreditCardPayment(cardPaymentRequest);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe(
        "Erro de conexão ao criar pagamento com cartão"
      );
    });

    it("should handle refused payment", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: {
          success: false,
          status: "refused",
          errorMessage: "Cartão recusado - fundos insuficientes",
        },
        error: null,
      });

      const result = await createAsaasCreditCardPayment(cardPaymentRequest);

      expect(result.success).toBe(false);
      expect(result.status).toBe("refused");
      expect(result.errorMessage).toContain("fundos insuficientes");
    });

    it("should handle missing card token", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: {
          success: false,
          errorMessage: "Card token is required",
        },
        error: null,
      });

      const result = await createAsaasCreditCardPayment({
        ...mockPaymentRequest,
        paymentMethod: "credit_card",
      });

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe("Card token is required");
    });
  });

  describe("Edge Cases", () => {
    it("should not return QR code for credit card payment", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: {
          success: true,
          transactionId: "txn-123",
        },
        error: null,
      });

      const result = await createAsaasCreditCardPayment(cardPaymentRequest);

      expect(result.qrCode).toBeUndefined();
      expect(result.qrCodeText).toBeUndefined();
      expect(result.pixId).toBeUndefined();
    });

    it("should handle single installment", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      await createAsaasCreditCardPayment({
        ...cardPaymentRequest,
        installments: 1,
      });

      expect(api.publicCall).toHaveBeenCalledWith(
        "asaas-create-payment",
        expect.objectContaining({
          installments: 1,
        })
      );
    });
  });
});
