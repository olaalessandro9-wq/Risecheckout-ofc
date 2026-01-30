/**
 * Checkout Public Machine Actions Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for pure action functions used by the state machine.
 * 
 * @module test/checkout-public/machines
 */

import { describe, it, expect, vi } from "vitest";
import {
  toggleBumpInArray,
  removeFieldError,
  createFetchError,
  createNetworkError,
  createValidationError,
  createSubmitError,
  createPaymentError,
  createPaymentTimeoutError,
  validateFormFields,
} from "../checkoutPublicMachine.actions";
import type { CheckoutPublicContext, FormErrors } from "../checkoutPublicMachine.types";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("../contracts", () => ({
  validateResolveAndLoadResponse: vi.fn(),
}));

vi.mock("../mappers", () => ({
  mapResolveAndLoad: vi.fn(),
}));

vi.mock("./helpers/requiredFields", () => ({
  isFieldRequired: (fields: Record<string, boolean> | null, field: string) => {
    if (!fields) return false;
    return fields[field] === true;
  },
}));

// ============================================================================
// HELPERS
// ============================================================================

function createMockContext(overrides: Partial<CheckoutPublicContext> = {}): CheckoutPublicContext {
  return {
    slug: "test-checkout",
    affiliateCode: null,
    rawData: null,
    checkout: null,
    product: null,
    offer: null,
    orderBumps: [],
    affiliate: null,
    resolvedGateways: {
      pix: "mercadopago",
      creditCard: "mercadopago",
      mercadoPagoPublicKey: null,
      stripePublicKey: null,
    },
    design: null,
    formData: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      document: "",
    },
    selectedBumps: [],
    selectedPaymentMethod: "pix",
    appliedCoupon: null,
    formErrors: {},
    error: null,
    orderId: null,
    accessToken: null,
    paymentData: null,
    navigationData: null,
    cardFormData: null,
    loadedAt: null,
    retryCount: 0,
    ...overrides,
  } as CheckoutPublicContext;
}

// ============================================================================
// TESTS
// ============================================================================

describe("toggleBumpInArray", () => {
  it("should add bump when not present", () => {
    const result = toggleBumpInArray([], "bump-1");
    expect(result).toEqual(["bump-1"]);
  });

  it("should remove bump when present", () => {
    const result = toggleBumpInArray(["bump-1", "bump-2"], "bump-1");
    expect(result).toEqual(["bump-2"]);
  });

  it("should handle multiple bumps correctly", () => {
    const result = toggleBumpInArray(["bump-1"], "bump-2");
    expect(result).toContain("bump-1");
    expect(result).toContain("bump-2");
  });

  it("should return immutable array", () => {
    const original = ["bump-1"];
    const result = toggleBumpInArray(original, "bump-2");
    expect(result).not.toBe(original);
    expect(original).toEqual(["bump-1"]);
  });

  it("should handle empty array", () => {
    const result = toggleBumpInArray([], "bump-1");
    expect(result).toHaveLength(1);
  });
});

describe("removeFieldError", () => {
  it("should remove existing error", () => {
    const errors: FormErrors = { name: "Required", email: "Invalid" };
    const result = removeFieldError(errors, "name");
    expect(result).toEqual({ email: "Invalid" });
  });

  it("should return same shape when field not present", () => {
    const errors: FormErrors = { name: "Required" };
    const result = removeFieldError(errors, "email");
    expect(result).toEqual({ name: "Required" });
  });

  it("should return immutable object", () => {
    const original: FormErrors = { name: "Required" };
    const result = removeFieldError(original, "name");
    expect(result).not.toBe(original);
    expect(original).toEqual({ name: "Required" });
  });

  it("should handle empty errors", () => {
    const result = removeFieldError({}, "name");
    expect(result).toEqual({});
  });
});

describe("error creators", () => {
  describe("createFetchError", () => {
    it("should create FETCH_FAILED error", () => {
      const result = createFetchError("Checkout not found");
      expect(result).toEqual({
        reason: "FETCH_FAILED",
        message: "Checkout not found",
      });
    });

    it("should use default message when empty", () => {
      const result = createFetchError("");
      expect(result.message).toBe("Erro ao carregar checkout");
    });
  });

  describe("createNetworkError", () => {
    it("should create NETWORK_ERROR from string", () => {
      const result = createNetworkError("Timeout");
      expect(result).toEqual({
        reason: "NETWORK_ERROR",
        message: "Timeout",
      });
    });

    it("should stringify error object", () => {
      const error = new Error("Network failed");
      const result = createNetworkError(error);
      expect(result.message).toBe("Error: Network failed");
    });
  });

  describe("createValidationError", () => {
    it("should create VALIDATION_FAILED error", () => {
      const result = createValidationError();
      expect(result).toEqual({
        reason: "VALIDATION_FAILED",
        message: "Dados do checkout inválidos",
      });
    });
  });

  describe("createSubmitError", () => {
    it("should create SUBMIT_FAILED error", () => {
      const result = createSubmitError("Order creation failed");
      expect(result).toEqual({
        reason: "SUBMIT_FAILED",
        message: "Order creation failed",
      });
    });
  });

  describe("createPaymentError", () => {
    it("should create PAYMENT_FAILED error", () => {
      const result = createPaymentError("Card declined");
      expect(result).toEqual({
        reason: "PAYMENT_FAILED",
        message: "Card declined",
      });
    });
  });

  describe("createPaymentTimeoutError", () => {
    it("should create timeout error", () => {
      const result = createPaymentTimeoutError();
      expect(result).toEqual({
        reason: "PAYMENT_FAILED",
        message: "Tempo de pagamento expirado",
      });
    });
  });
});

describe("validateFormFields", () => {
  it("should validate required name field", () => {
    const context = createMockContext({
      formData: { name: "", email: "test@test.com", phone: "", cpf: "", document: "" },
    });

    const result = validateFormFields(context);

    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBe("Nome é obrigatório");
  });

  it("should validate required email field", () => {
    const context = createMockContext({
      formData: { name: "Test", email: "", phone: "", cpf: "", document: "" },
    });

    const result = validateFormFields(context);

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe("Email é obrigatório");
  });

  it("should validate email format", () => {
    const context = createMockContext({
      formData: { name: "Test", email: "invalid-email", phone: "", cpf: "", document: "" },
    });

    const result = validateFormFields(context);

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe("Email inválido");
  });

  it("should accept valid email formats", () => {
    const context = createMockContext({
      formData: { name: "Test", email: "user@example.com", phone: "", cpf: "", document: "" },
    });

    const result = validateFormFields(context);

    expect(result.isValid).toBe(true);
    expect(result.errors.email).toBeUndefined();
  });

  it("should validate CPF when required", () => {
    const context = createMockContext({
      formData: { name: "Test", email: "test@test.com", phone: "", cpf: "", document: "" },
      product: {
        id: "prod-1",
        name: "Test",
        description: "",
        price: 1000,
        image_url: null,
        required_fields: { name: true, email: true, cpf: true, phone: false },
        default_payment_method: "pix",
      },
    });

    const result = validateFormFields(context);

    expect(result.isValid).toBe(false);
    expect(result.errors.cpf).toBe("CPF/CNPJ é obrigatório");
  });

  it("should validate phone when required", () => {
    const context = createMockContext({
      formData: { name: "Test", email: "test@test.com", phone: "", cpf: "", document: "" },
      product: {
        id: "prod-1",
        name: "Test",
        description: "",
        price: 1000,
        image_url: null,
        required_fields: { name: true, email: true, cpf: false, phone: true },
        default_payment_method: "pix",
      },
    });

    const result = validateFormFields(context);

    expect(result.isValid).toBe(false);
    expect(result.errors.phone).toBe("Celular é obrigatório");
  });

  it("should pass when all required fields are filled", () => {
    const context = createMockContext({
      formData: { 
        name: "João Silva", 
        email: "joao@test.com", 
        phone: "(11) 99999-9999", 
        cpf: "123.456.789-00",
        document: "123.456.789-00",
      },
      product: {
        id: "prod-1",
        name: "Test",
        description: "",
        price: 1000,
        image_url: null,
        required_fields: { name: true, email: true, cpf: true, phone: true },
        default_payment_method: "pix",
      },
    });

    const result = validateFormFields(context);

    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it("should not require CPF when not configured", () => {
    const context = createMockContext({
      formData: { name: "Test", email: "test@test.com", phone: "", cpf: "", document: "" },
      product: {
        id: "prod-1",
        name: "Test",
        description: "",
        price: 1000,
        image_url: null,
        required_fields: { name: true, email: true, cpf: false, phone: false },
        default_payment_method: "pix",
      },
    });

    const result = validateFormFields(context);

    expect(result.isValid).toBe(true);
    expect(result.errors.cpf).toBeUndefined();
  });

  it("should handle null product gracefully", () => {
    const context = createMockContext({
      formData: { name: "Test", email: "test@test.com", phone: "", cpf: "", document: "" },
      product: null,
    });

    const result = validateFormFields(context);

    expect(result.isValid).toBe(true);
  });

  it("should trim whitespace from name", () => {
    const context = createMockContext({
      formData: { name: "   ", email: "test@test.com", phone: "", cpf: "", document: "" },
    });

    const result = validateFormFields(context);

    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBe("Nome é obrigatório");
  });
});
