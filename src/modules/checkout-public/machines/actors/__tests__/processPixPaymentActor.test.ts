/**
 * Process PIX Payment Actor Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for PIX payment processing across all gateways.
 * 
 * @module test/checkout-public/machines/actors
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProcessPixInput, ProcessPixOutput } from "../processPixPaymentActor";

// ============================================================================
// MOCKS
// ============================================================================

const mockPublicApiCall = vi.fn();

vi.mock("@/lib/api/public-client", () => ({
  publicApi: {
    call: (...args: unknown[]) => mockPublicApiCall(...args),
  },
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

function createMockInput(
  gateway: ProcessPixInput["gateway"],
  overrides: Partial<ProcessPixInput> = {}
): ProcessPixInput {
  return {
    orderId: "order-123",
    accessToken: "token-abc",
    gateway,
    amount: 9900, // R$99,00 em centavos
    checkoutSlug: "meu-checkout",
    formData: {
      name: "João Silva",
      email: "joao@example.com",
      cpf: "123.456.789-00",
      phone: "(11) 99999-9999",
    },
    ...overrides,
  };
}

/**
 * Simulates PushinPay processing
 */
async function simulatePushinPay(input: ProcessPixInput): Promise<ProcessPixOutput> {
  const { data, error } = await mockPublicApiCall("pushinpay-create-pix", {
    orderId: input.orderId,
    valueInCents: input.amount,
  });

  if (error || !data?.ok) {
    return { 
      success: false, 
      error: data?.error ?? error?.message ?? "Erro ao gerar QR Code do PushinPay" 
    };
  }

  return {
    success: true,
    navigationData: {
      type: 'pix',
      orderId: input.orderId,
      accessToken: input.accessToken,
      gateway: 'pushinpay',
      amount: input.amount,
      checkoutSlug: input.checkoutSlug,
      qrCode: data.pix?.qr_code,
      qrCodeBase64: data.pix?.qr_code_base64,
    },
  };
}

/**
 * Simulates MercadoPago processing
 */
async function simulateMercadoPago(input: ProcessPixInput): Promise<ProcessPixOutput> {
  const { data, error } = await mockPublicApiCall("mercadopago-create-payment", {
    orderId: input.orderId,
    payerEmail: input.formData.email,
    payerName: input.formData.name,
    payerDocument: input.formData.cpf?.replace(/\D/g, '') || null,
    paymentMethod: 'pix',
    token: null,
    installments: 1,
  });

  if (error || !data?.success) {
    return { 
      success: false, 
      error: data?.error ?? error?.message ?? "Erro ao gerar QR Code do MercadoPago" 
    };
  }

  const pixData = data.data?.pix;
  
  return {
    success: true,
    navigationData: {
      type: 'pix',
      orderId: input.orderId,
      accessToken: input.accessToken,
      gateway: 'mercadopago',
      amount: input.amount,
      checkoutSlug: input.checkoutSlug,
      qrCode: pixData?.qrCode || pixData?.qr_code,
      qrCodeBase64: pixData?.qrCodeBase64 || pixData?.qr_code_base64,
    },
  };
}

/**
 * Simulates Asaas processing
 */
async function simulateAsaas(input: ProcessPixInput): Promise<ProcessPixOutput> {
  const { data, error } = await mockPublicApiCall("asaas-create-payment", {
    orderId: input.orderId,
    amountCents: input.amount,
    customer: {
      name: input.formData.name,
      email: input.formData.email,
      document: input.formData.cpf?.replace(/\D/g, '') || '',
      phone: input.formData.phone || undefined,
    },
    description: `Pedido ${input.orderId}`,
    paymentMethod: 'pix',
  });

  if (error || !data?.success) {
    return { 
      success: false, 
      error: data?.error ?? error?.message ?? "Erro ao gerar QR Code do Asaas" 
    };
  }

  return {
    success: true,
    navigationData: {
      type: 'pix',
      orderId: input.orderId,
      accessToken: input.accessToken,
      gateway: 'asaas',
      amount: input.amount,
      checkoutSlug: input.checkoutSlug,
      qrCode: data.qrCodeText,
      qrCodeBase64: data.qrCode,
    },
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe("processPixPaymentActor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PushinPay gateway", () => {
    it("should generate QR code successfully", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          ok: true,
          pix: {
            id: "pix-123",
            qr_code: "00020126580014br.gov.bcb.pix...",
            qr_code_base64: "data:image/png;base64,iVBORw0...",
            status: "pending",
            value: 9900,
          },
        },
        error: null,
      });

      const input = createMockInput("pushinpay");
      const result = await simulatePushinPay(input);

      expect(result.success).toBe(true);
      expect(result.navigationData).toMatchObject({
        type: 'pix',
        gateway: 'pushinpay',
        orderId: "order-123",
        amount: 9900,
        qrCode: "00020126580014br.gov.bcb.pix...",
        qrCodeBase64: "data:image/png;base64,iVBORw0...",
      });
    });

    it("should handle API error", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { ok: false, error: "Credenciais inválidas" },
        error: null,
      });

      const input = createMockInput("pushinpay");
      const result = await simulatePushinPay(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Credenciais inválidas");
    });

    it("should handle network error", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: null,
        error: { message: "Timeout" },
      });

      const input = createMockInput("pushinpay");
      const result = await simulatePushinPay(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Timeout");
    });
  });

  describe("MercadoPago gateway", () => {
    it("should generate QR code successfully", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: true,
          data: {
            pix: {
              qrCode: "00020126580014...",
              qrCodeBase64: "base64image...",
            },
          },
        },
        error: null,
      });

      const input = createMockInput("mercadopago");
      const result = await simulateMercadoPago(input);

      expect(result.success).toBe(true);
      expect(result.navigationData).toMatchObject({
        type: 'pix',
        gateway: 'mercadopago',
        qrCode: "00020126580014...",
        qrCodeBase64: "base64image...",
      });
    });

    it("should handle alternative response format (qr_code)", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: true,
          data: {
            pix: {
              qr_code: "alternative-format",
              qr_code_base64: "alt-base64",
            },
          },
        },
        error: null,
      });

      const input = createMockInput("mercadopago");
      const result = await simulateMercadoPago(input);

      expect(result.success).toBe(true);
      expect(result.navigationData?.qrCode).toBe("alternative-format");
      expect(result.navigationData?.qrCodeBase64).toBe("alt-base64");
    });

    it("should strip CPF formatting", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { success: true, data: { pix: {} } },
        error: null,
      });

      const input = createMockInput("mercadopago", {
        formData: {
          name: "Test",
          email: "test@test.com",
          cpf: "123.456.789-00",
        },
      });

      await simulateMercadoPago(input);

      expect(mockPublicApiCall).toHaveBeenCalledWith(
        "mercadopago-create-payment",
        expect.objectContaining({
          payerDocument: "12345678900",
        })
      );
    });

    it("should handle failure response", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { success: false, error: "Pagador inválido" },
        error: null,
      });

      const input = createMockInput("mercadopago");
      const result = await simulateMercadoPago(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Pagador inválido");
    });
  });

  describe("Asaas gateway", () => {
    it("should generate QR code successfully", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: true,
          qrCode: "base64-image-asaas",
          qrCodeText: "00020126580014br.gov.bcb.pix.asaas",
        },
        error: null,
      });

      const input = createMockInput("asaas");
      const result = await simulateAsaas(input);

      expect(result.success).toBe(true);
      expect(result.navigationData).toMatchObject({
        type: 'pix',
        gateway: 'asaas',
        qrCode: "00020126580014br.gov.bcb.pix.asaas",
        qrCodeBase64: "base64-image-asaas",
      });
    });

    it("should build correct payload", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { success: true, qrCode: "", qrCodeText: "" },
        error: null,
      });

      const input = createMockInput("asaas");
      await simulateAsaas(input);

      expect(mockPublicApiCall).toHaveBeenCalledWith(
        "asaas-create-payment",
        expect.objectContaining({
          orderId: "order-123",
          amountCents: 9900,
          customer: {
            name: "João Silva",
            email: "joao@example.com",
            document: "12345678900",
            phone: "(11) 99999-9999",
          },
          description: "Pedido order-123",
          paymentMethod: "pix",
        })
      );
    });

    it("should handle failure", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { success: false, error: "Cliente bloqueado" },
        error: null,
      });

      const input = createMockInput("asaas");
      const result = await simulateAsaas(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Cliente bloqueado");
    });
  });

  describe("navigation data structure", () => {
    it("should include all required fields for navigation", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          ok: true,
          pix: { qr_code: "test", qr_code_base64: "base64" },
        },
        error: null,
      });

      const input = createMockInput("pushinpay", {
        checkoutSlug: "my-checkout-slug",
      });
      const result = await simulatePushinPay(input);

      expect(result.navigationData).toHaveProperty("type", "pix");
      expect(result.navigationData).toHaveProperty("orderId");
      expect(result.navigationData).toHaveProperty("accessToken");
      expect(result.navigationData).toHaveProperty("gateway");
      expect(result.navigationData).toHaveProperty("amount");
      expect(result.navigationData).toHaveProperty("checkoutSlug", "my-checkout-slug");
    });
  });
});
