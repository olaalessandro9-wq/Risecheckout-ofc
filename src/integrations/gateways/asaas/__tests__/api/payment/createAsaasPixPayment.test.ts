/**
 * @file createAsaasPixPayment.test.ts
 * @description Tests for createAsaasPixPayment API function
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
import { createAsaasPixPayment } from "../../../api/payment-api";
import type { AsaasPaymentRequest } from "../../../types";

describe("createAsaasPixPayment", () => {
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

  describe("Success Cases", () => {
    it("should create PIX payment successfully", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: {
          success: true,
          transactionId: "txn-123",
          status: "pending",
          qrCode: "data:image/png;base64,xxx",
          qrCodeText: "00020126...",
          pixId: "pix-123",
        },
        error: null,
      });

      const result = await createAsaasPixPayment(mockPaymentRequest);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("txn-123");
      expect(result.qrCode).toBe("data:image/png;base64,xxx");
      expect(result.qrCodeText).toBe("00020126...");
      expect(result.pixId).toBe("pix-123");
    });

    it("should call API with correct parameters", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      await createAsaasPixPayment(mockPaymentRequest);

      expect(api.publicCall).toHaveBeenCalledWith("asaas-create-payment", {
        ...mockPaymentRequest,
        paymentMethod: "pix",
      });
    });

    it("should return pending status for new PIX", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: {
          success: true,
          status: "pending",
        },
        error: null,
      });

      const result = await createAsaasPixPayment(mockPaymentRequest);

      expect(result.status).toBe("pending");
    });
  });

  describe("Error Cases", () => {
    it("should return error on API failure", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: null,
        error: { code: "INTERNAL_ERROR", message: "Service unavailable" },
      });

      const result = await createAsaasPixPayment(mockPaymentRequest);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe("Service unavailable");
    });

    it("should return error on exception", async () => {
      vi.mocked(api.publicCall).mockRejectedValueOnce(
        new Error("Network error")
      );

      const result = await createAsaasPixPayment(mockPaymentRequest);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe(
        "Erro de conexão ao criar pagamento PIX"
      );
    });

    it("should handle refused payment", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: {
          success: false,
          status: "refused",
          errorMessage: "Pagamento recusado",
        },
        error: null,
      });

      const result = await createAsaasPixPayment(mockPaymentRequest);

      expect(result.success).toBe(false);
      expect(result.status).toBe("refused");
      expect(result.errorMessage).toBe("Pagamento recusado");
    });

    it("should handle null data response", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await createAsaasPixPayment(mockPaymentRequest);

      expect(result.success).toBe(false);
    });
  });
});
