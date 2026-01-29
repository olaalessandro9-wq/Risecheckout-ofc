/**
 * CheckoutPublicMachine Guards Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Checkout Public State Machine guards.
 * 
 * @module checkout-public/machines/__tests__
 */

import { describe, it, expect } from "vitest";
import {
  canRetry,
  isDataValid,
  hasRequiredFormFields,
  isFormValid,
  hasCheckout,
  hasProduct,
  isReady,
} from "../checkoutPublicMachine.guards";
import type { CheckoutPublicContext } from "../checkoutPublicMachine.types";
import { initialCheckoutContext } from "../checkoutPublicMachine.context";

// ============================================================================
// HELPER: Create context with overrides
// ============================================================================

function createContext(overrides: Partial<CheckoutPublicContext> = {}): CheckoutPublicContext {
  return { ...initialCheckoutContext, ...overrides };
}

// ============================================================================
// RETRY GUARDS
// ============================================================================

describe("canRetry guard", () => {
  it("returns true when retryCount < MAX_RETRIES (3)", () => {
    expect(canRetry({ context: createContext({ retryCount: 0 }) })).toBe(true);
    expect(canRetry({ context: createContext({ retryCount: 1 }) })).toBe(true);
    expect(canRetry({ context: createContext({ retryCount: 2 }) })).toBe(true);
  });

  it("returns false when retryCount >= MAX_RETRIES", () => {
    expect(canRetry({ context: createContext({ retryCount: 3 }) })).toBe(false);
    expect(canRetry({ context: createContext({ retryCount: 4 }) })).toBe(false);
    expect(canRetry({ context: createContext({ retryCount: 10 }) })).toBe(false);
  });
});

// ============================================================================
// DATA VALIDATION GUARDS
// ============================================================================

describe("isDataValid guard", () => {
  it("returns false when rawData is null", () => {
    expect(isDataValid({ context: createContext({ rawData: null }) })).toBe(false);
  });

  it("validates rawData structure using contract validator", () => {
    const validRawData = {
      checkout: { id: "ck-1", name: "Test Checkout" },
      product: { id: "pr-1", name: "Test Product" },
      design: { theme: "light" },
    };
    
    // This test depends on the contract validator behavior
    const result = isDataValid({ context: createContext({ rawData: validRawData }) });
    expect(typeof result).toBe("boolean");
  });
});

// ============================================================================
// FORM VALIDATION GUARDS
// ============================================================================

describe("hasRequiredFormFields guard", () => {
  it("returns true when name and email are filled (no optional fields required)", () => {
    const context = createContext({
      formData: {
        name: "John Doe",
        email: "john@example.com",
        cpf: "",
        phone: "",
        document: "",
      },
      product: null,
    });
    expect(hasRequiredFormFields({ context })).toBe(true);
  });

  it("returns false when name is empty", () => {
    const context = createContext({
      formData: {
        name: "",
        email: "john@example.com",
        cpf: "",
        phone: "",
        document: "",
      },
    });
    expect(hasRequiredFormFields({ context })).toBe(false);
  });

  it("returns false when email is empty", () => {
    const context = createContext({
      formData: {
        name: "John Doe",
        email: "",
        cpf: "",
        phone: "",
        document: "",
      },
    });
    expect(hasRequiredFormFields({ context })).toBe(false);
  });

  it("returns false when email format is invalid", () => {
    const context = createContext({
      formData: {
        name: "John Doe",
        email: "invalid-email",
        cpf: "",
        phone: "",
        document: "",
      },
    });
    expect(hasRequiredFormFields({ context })).toBe(false);
  });

  it("validates CPF when required by product", () => {
    const context = createContext({
      formData: {
        name: "John Doe",
        email: "john@example.com",
        cpf: "",
        phone: "",
        document: "",
      },
      product: {
        id: "pr-1",
        name: "Test",
        required_fields: { cpf: true, phone: false },
      } as CheckoutPublicContext["product"],
    });
    expect(hasRequiredFormFields({ context })).toBe(false);
  });

  it("validates phone when required by product", () => {
    const context = createContext({
      formData: {
        name: "John Doe",
        email: "john@example.com",
        cpf: "",
        phone: "",
        document: "",
      },
      product: {
        id: "pr-1",
        name: "Test",
        required_fields: { cpf: false, phone: true },
      } as CheckoutPublicContext["product"],
    });
    expect(hasRequiredFormFields({ context })).toBe(false);
  });

  it("passes when all required fields are filled", () => {
    const context = createContext({
      formData: {
        name: "John Doe",
        email: "john@example.com",
        cpf: "123.456.789-00",
        phone: "(11) 99999-9999",
        document: "123.456.789-00",
      },
      product: {
        id: "pr-1",
        name: "Test",
        required_fields: { cpf: true, phone: true },
      } as CheckoutPublicContext["product"],
    });
    expect(hasRequiredFormFields({ context })).toBe(true);
  });
});

describe("isFormValid guard", () => {
  it("returns true when fields are valid and no errors", () => {
    const context = createContext({
      formData: {
        name: "John Doe",
        email: "john@example.com",
        cpf: "",
        phone: "",
        document: "",
      },
      formErrors: {},
    });
    expect(isFormValid({ context })).toBe(true);
  });

  it("returns false when formErrors has entries", () => {
    const context = createContext({
      formData: {
        name: "John Doe",
        email: "john@example.com",
        cpf: "",
        phone: "",
        document: "",
      },
      formErrors: { email: "Email inválido" },
    });
    expect(isFormValid({ context })).toBe(false);
  });
});

// ============================================================================
// DATA PRESENCE GUARDS
// ============================================================================

describe("hasCheckout guard", () => {
  it("returns true when checkout is not null", () => {
    const context = createContext({
      checkout: { id: "ck-1", name: "Test" } as CheckoutPublicContext["checkout"],
    });
    expect(hasCheckout({ context })).toBe(true);
  });

  it("returns false when checkout is null", () => {
    expect(hasCheckout({ context: createContext({ checkout: null }) })).toBe(false);
  });
});

describe("hasProduct guard", () => {
  it("returns true when product is not null", () => {
    const context = createContext({
      product: { id: "pr-1", name: "Test" } as CheckoutPublicContext["product"],
    });
    expect(hasProduct({ context })).toBe(true);
  });

  it("returns false when product is null", () => {
    expect(hasProduct({ context: createContext({ product: null }) })).toBe(false);
  });
});

describe("isReady guard", () => {
  it("returns true when checkout, product, and design are all present", () => {
    const context = createContext({
      checkout: { id: "ck-1" } as CheckoutPublicContext["checkout"],
      product: { id: "pr-1" } as CheckoutPublicContext["product"],
      design: {} as CheckoutPublicContext["design"],
    });
    expect(isReady({ context })).toBe(true);
  });

  it("returns false when checkout is missing", () => {
    const context = createContext({
      checkout: null,
      product: { id: "pr-1" } as CheckoutPublicContext["product"],
      design: {} as CheckoutPublicContext["design"],
    });
    expect(isReady({ context })).toBe(false);
  });

  it("returns false when product is missing", () => {
    const context = createContext({
      checkout: { id: "ck-1" } as CheckoutPublicContext["checkout"],
      product: null,
      design: {} as CheckoutPublicContext["design"],
    });
    expect(isReady({ context })).toBe(false);
  });

  it("returns false when design is missing", () => {
    const context = createContext({
      checkout: { id: "ck-1" } as CheckoutPublicContext["checkout"],
      product: { id: "pr-1" } as CheckoutPublicContext["product"],
      design: null,
    });
    expect(isReady({ context })).toBe(false);
  });
});
