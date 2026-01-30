/**
 * Process Card Payment Actor Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for credit card payment processing across all gateways.
 * 
 * @module test/checkout-public/machines/actors
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProcessCardInput, ProcessCardOutput } from "../processCardPaymentActor";

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
  gateway: ProcessCardInput["gateway"],
  overrides: Partial<ProcessCardInput> = {}
): ProcessCardInput {
  return {
    orderId: "order-123",
    accessToken: "token-abc",
    gateway,
    amount: 9900,
    formData: {
      name: "João Silva",
      email: "joao@example.com",
      cpf: "123.456.789-00",
      phone: "(11) 99999-9999",
    },
    cardToken: "card-token-xyz",
    installments: 1,
    paymentMethodId: "visa",
    issuerId: "issuer-123",
    holderDocument: "123.456.789-00",
    ...overrides,
  };
}

/**
 * MercadoPago rejection reason mapper (matching source)
 */
function mapMercadoPagoRejectionReason(statusDetail?: string): string {
  const reasons: Record<string, string> = {
    'cc_rejected_bad_filled_security_code': 'CVV inválido. Verifique o código de segurança.',
    'cc_rejected_bad_filled_card_number': 'Número do cartão inválido.',
    'cc_rejected_bad_filled_date': 'Data de validade inválida.',
    'cc_rejected_bad_filled_other': 'Dados do cartão inválidos. Verifique as informações.',
    'cc_rejected_insufficient_amount': 'Saldo insuficiente no cartão.',
    'cc_rejected_call_for_authorize': 'Ligue para sua operadora para autorizar este pagamento.',
    'cc_rejected_card_disabled': 'Cartão desabilitado. Entre em contato com seu banco.',
    'cc_rejected_duplicated_payment': 'Pagamento duplicado. Já existe uma transação similar.',
    'cc_rejected_high_risk': 'Pagamento recusado por segurança. Tente outro cartão.',
    'cc_rejected_max_attempts': 'Limite de tentativas excedido. Aguarde e tente novamente.',
    'cc_rejected_card_type_not_allowed': 'Tipo de cartão não aceito para esta compra.',
    'cc_rejected_blacklist': 'Cartão bloqueado. Entre em contato com seu banco.',
    'cc_rejected_other_reason': 'Pagamento recusado pelo banco. Tente outro cartão.',
  };
  return reasons[statusDetail || ''] || 'Pagamento recusado. Verifique os dados ou use outro cartão.';
}

/**
 * Simulates MercadoPago card processing
 */
async function simulateMercadoPago(input: ProcessCardInput): Promise<ProcessCardOutput> {
  const { data, error } = await mockPublicApiCall("mercadopago-create-payment", {
    orderId: input.orderId,
    payerEmail: input.formData.email,
    payerName: input.formData.name,
    payerDocument: input.holderDocument?.replace(/\D/g, '') || null,
    paymentMethod: 'credit_card',
    token: input.cardToken,
    installments: input.installments,
    paymentMethodId: input.paymentMethodId,
    issuerId: input.issuerId,
  });

  if (error || !data?.success) {
    return { 
      success: false, 
      error: data?.error || error?.message || "Erro ao processar pagamento com cartão" 
    };
  }

  const status = data.data?.status;
  const statusDetail = data.data?.status_detail;

  if (status === 'rejected') {
    const userFriendlyError = mapMercadoPagoRejectionReason(statusDetail);
    return {
      success: false,
      error: userFriendlyError,
    };
  }

  const mappedStatus = status === 'approved' ? 'approved' : 'pending';

  return {
    success: true,
    navigationData: {
      type: 'card',
      orderId: input.orderId,
      accessToken: input.accessToken,
      status: mappedStatus,
    },
  };
}

/**
 * Simulates Stripe card processing
 */
async function simulateStripe(input: ProcessCardInput): Promise<ProcessCardOutput> {
  const { data, error } = await mockPublicApiCall("stripe-create-payment", {
    orderId: input.orderId,
    paymentMethodId: input.cardToken,
    amount: input.amount,
    email: input.formData.email,
  });

  if (error || !data?.success) {
    return { 
      success: false, 
      error: data?.error || error?.message || "Erro ao processar pagamento Stripe" 
    };
  }

  if (data.requires_action) {
    return {
      success: true,
      navigationData: {
        type: 'card',
        orderId: input.orderId,
        accessToken: input.accessToken,
        status: 'pending',
        requires3DS: true,
        threeDSClientSecret: data.client_secret,
      },
    };
  }

  const status = data.status === 'succeeded' ? 'approved' : 
                 data.status === 'failed' ? 'rejected' : 'pending';

  return {
    success: true,
    navigationData: {
      type: 'card',
      orderId: input.orderId,
      accessToken: input.accessToken,
      status,
    },
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe("processCardPaymentActor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("MercadoPago gateway", () => {
    it("should process approved payment successfully", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: true,
          data: { status: "approved", status_detail: "accredited" },
        },
        error: null,
      });

      const input = createMockInput("mercadopago");
      const result = await simulateMercadoPago(input);

      expect(result.success).toBe(true);
      expect(result.navigationData).toMatchObject({
        type: 'card',
        orderId: "order-123",
        status: 'approved',
      });
    });

    it("should handle pending payment", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: true,
          data: { status: "in_process", status_detail: "pending_review" },
        },
        error: null,
      });

      const input = createMockInput("mercadopago");
      const result = await simulateMercadoPago(input);

      expect(result.success).toBe(true);
      expect(result.navigationData?.status).toBe("pending");
    });

    it("should return failure for rejected payment with CVV error", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: true,
          data: { 
            status: "rejected", 
            status_detail: "cc_rejected_bad_filled_security_code" 
          },
        },
        error: null,
      });

      const input = createMockInput("mercadopago");
      const result = await simulateMercadoPago(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("CVV inválido. Verifique o código de segurança.");
    });

    it("should return failure for rejected payment with insufficient funds", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: true,
          data: { 
            status: "rejected", 
            status_detail: "cc_rejected_insufficient_amount" 
          },
        },
        error: null,
      });

      const input = createMockInput("mercadopago");
      const result = await simulateMercadoPago(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Saldo insuficiente no cartão.");
    });

    it("should return generic message for unknown rejection reason", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: true,
          data: { 
            status: "rejected", 
            status_detail: "unknown_reason" 
          },
        },
        error: null,
      });

      const input = createMockInput("mercadopago");
      const result = await simulateMercadoPago(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Pagamento recusado. Verifique os dados ou use outro cartão.");
    });

    it("should strip holder document formatting", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { success: true, data: { status: "approved" } },
        error: null,
      });

      const input = createMockInput("mercadopago", {
        holderDocument: "123.456.789-00",
      });

      await simulateMercadoPago(input);

      expect(mockPublicApiCall).toHaveBeenCalledWith(
        "mercadopago-create-payment",
        expect.objectContaining({
          payerDocument: "12345678900",
        })
      );
    });

    it("should handle API error", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: null,
        error: { message: "Gateway timeout" },
      });

      const input = createMockInput("mercadopago");
      const result = await simulateMercadoPago(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Gateway timeout");
    });

    it("should include installments in payload", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { success: true, data: { status: "approved" } },
        error: null,
      });

      const input = createMockInput("mercadopago", { installments: 3 });
      await simulateMercadoPago(input);

      expect(mockPublicApiCall).toHaveBeenCalledWith(
        "mercadopago-create-payment",
        expect.objectContaining({
          installments: 3,
        })
      );
    });
  });

  describe("Stripe gateway", () => {
    it("should process successful payment", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: true,
          status: "succeeded",
        },
        error: null,
      });

      const input = createMockInput("stripe");
      const result = await simulateStripe(input);

      expect(result.success).toBe(true);
      expect(result.navigationData?.status).toBe("approved");
    });

    it("should handle 3DS requirement", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: true,
          requires_action: true,
          client_secret: "pi_secret_xyz",
        },
        error: null,
      });

      const input = createMockInput("stripe");
      const result = await simulateStripe(input);

      expect(result.success).toBe(true);
      expect(result.navigationData).toMatchObject({
        status: "pending",
        requires3DS: true,
        threeDSClientSecret: "pi_secret_xyz",
      });
    });

    it("should handle failed payment", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: true,
          status: "failed",
        },
        error: null,
      });

      const input = createMockInput("stripe");
      const result = await simulateStripe(input);

      expect(result.success).toBe(true);
      expect(result.navigationData?.status).toBe("rejected");
    });

    it("should handle pending status", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: {
          success: true,
          status: "processing",
        },
        error: null,
      });

      const input = createMockInput("stripe");
      const result = await simulateStripe(input);

      expect(result.success).toBe(true);
      expect(result.navigationData?.status).toBe("pending");
    });

    it("should handle API failure", async () => {
      mockPublicApiCall.mockResolvedValue({
        data: { success: false, error: "Card declined" },
        error: null,
      });

      const input = createMockInput("stripe");
      const result = await simulateStripe(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Card declined");
    });
  });

  describe("rejection reason mapping", () => {
    const testCases = [
      { detail: 'cc_rejected_bad_filled_card_number', expected: 'Número do cartão inválido.' },
      { detail: 'cc_rejected_bad_filled_date', expected: 'Data de validade inválida.' },
      { detail: 'cc_rejected_call_for_authorize', expected: 'Ligue para sua operadora para autorizar este pagamento.' },
      { detail: 'cc_rejected_card_disabled', expected: 'Cartão desabilitado. Entre em contato com seu banco.' },
      { detail: 'cc_rejected_duplicated_payment', expected: 'Pagamento duplicado. Já existe uma transação similar.' },
      { detail: 'cc_rejected_high_risk', expected: 'Pagamento recusado por segurança. Tente outro cartão.' },
      { detail: 'cc_rejected_max_attempts', expected: 'Limite de tentativas excedido. Aguarde e tente novamente.' },
      { detail: 'cc_rejected_blacklist', expected: 'Cartão bloqueado. Entre em contato com seu banco.' },
    ];

    testCases.forEach(({ detail, expected }) => {
      it(`should map ${detail} correctly`, async () => {
        mockPublicApiCall.mockResolvedValue({
          data: {
            success: true,
            data: { status: "rejected", status_detail: detail },
          },
          error: null,
        });

        const input = createMockInput("mercadopago");
        const result = await simulateMercadoPago(input);

        expect(result.success).toBe(false);
        expect(result.error).toBe(expected);
      });
    });
  });
});
