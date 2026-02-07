/**
 * Unit Tests: Payment Gateways Registry
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the centralized payment gateways configuration.
 * 
 * @module config/payment-gateways.test
 */

import { describe, it, expect } from "vitest";
import {
  PAYMENT_GATEWAYS,
  getActiveGateways,
  getGatewaysByMethod,
  getActiveGatewaysByMethod,
  getGatewayById,
  formatGatewayFees,
  isGatewayAvailable,
  getGatewayDisplayName,
} from "./payment-gateways";
import type { GatewayFees, PaymentMethod } from "./payment-gateways";

// ============================================================================
// PAYMENT_GATEWAYS Registry
// ============================================================================

describe("PAYMENT_GATEWAYS Registry", () => {
  it("should have asaas gateway", () => {
    expect(PAYMENT_GATEWAYS.asaas).toBeDefined();
    expect(PAYMENT_GATEWAYS.asaas.id).toBe("asaas");
  });

  it("should have mercadopago gateway", () => {
    expect(PAYMENT_GATEWAYS.mercadopago).toBeDefined();
    expect(PAYMENT_GATEWAYS.mercadopago.id).toBe("mercadopago");
  });

  it("should have pushinpay gateway", () => {
    expect(PAYMENT_GATEWAYS.pushinpay).toBeDefined();
    expect(PAYMENT_GATEWAYS.pushinpay.id).toBe("pushinpay");
  });

  it("should have stripe gateway", () => {
    expect(PAYMENT_GATEWAYS.stripe).toBeDefined();
    expect(PAYMENT_GATEWAYS.stripe.id).toBe("stripe");
  });

  it("all gateways should have required fields", () => {
    Object.values(PAYMENT_GATEWAYS).forEach((gateway) => {
      expect(gateway).toHaveProperty("id");
      expect(gateway).toHaveProperty("name");
      expect(gateway).toHaveProperty("displayName");
      expect(gateway).toHaveProperty("status");
      expect(gateway).toHaveProperty("supportedMethods");
      expect(gateway).toHaveProperty("fees");
      expect(gateway).toHaveProperty("requiresCredentials");
    });
  });

  it("all active gateways should have active status", () => {
    const activeIds = ["asaas", "mercadopago", "pushinpay", "stripe"];
    
    activeIds.forEach((id) => {
      expect(PAYMENT_GATEWAYS[id].status).toBe("active");
    });
  });
});

// ============================================================================
// getActiveGateways
// ============================================================================

describe("getActiveGateways", () => {
  it("should return only active gateways", () => {
    const activeGateways = getActiveGateways();
    
    activeGateways.forEach((gateway) => {
      expect(gateway.status).toBe("active");
    });
  });

  it("should return at least 4 active gateways", () => {
    const activeGateways = getActiveGateways();
    
    expect(activeGateways.length).toBeGreaterThanOrEqual(4);
  });

  it("should include asaas in active gateways", () => {
    const activeGateways = getActiveGateways();
    const asaas = activeGateways.find((g) => g.id === "asaas");
    
    expect(asaas).toBeDefined();
  });

  it("should return array of gateway objects", () => {
    const activeGateways = getActiveGateways();
    
    expect(Array.isArray(activeGateways)).toBe(true);
    activeGateways.forEach((gateway) => {
      expect(typeof gateway).toBe("object");
      expect(gateway.id).toBeDefined();
    });
  });
});

// ============================================================================
// getGatewaysByMethod
// ============================================================================

describe("getGatewaysByMethod", () => {
  it("should return gateways supporting pix", () => {
    const pixGateways = getGatewaysByMethod("pix");
    
    expect(pixGateways.length).toBeGreaterThan(0);
    pixGateways.forEach((gateway) => {
      expect(gateway.supportedMethods).toContain("pix");
    });
  });

  it("should return gateways supporting credit_card", () => {
    const ccGateways = getGatewaysByMethod("credit_card");
    
    expect(ccGateways.length).toBeGreaterThan(0);
    ccGateways.forEach((gateway) => {
      expect(gateway.supportedMethods).toContain("credit_card");
    });
  });

  it("should include asaas, mercadopago, pushinpay for pix", () => {
    const pixGateways = getGatewaysByMethod("pix");
    const ids = pixGateways.map((g) => g.id);
    
    expect(ids).toContain("asaas");
    expect(ids).toContain("mercadopago");
    expect(ids).toContain("pushinpay");
  });

  it("should include mercadopago, stripe for credit_card (asaas not implemented yet)", () => {
    const ccGateways = getGatewaysByMethod("credit_card");
    const ids = ccGateways.map((g) => g.id);
    
    expect(ids).not.toContain("asaas");
    expect(ids).toContain("mercadopago");
    expect(ids).toContain("stripe");
  });

  it("should return empty array for unsupported method", () => {
    // Using a method that no gateway supports currently
    const gateways = getGatewaysByMethod("boleto" as PaymentMethod);
    
    // Boleto is commented out, so should be empty
    expect(gateways).toEqual([]);
  });
});

// ============================================================================
// getActiveGatewaysByMethod
// ============================================================================

describe("getActiveGatewaysByMethod", () => {
  it("should return only active gateways for pix", () => {
    const activePixGateways = getActiveGatewaysByMethod("pix");
    
    activePixGateways.forEach((gateway) => {
      expect(gateway.status).toBe("active");
      expect(gateway.supportedMethods).toContain("pix");
    });
  });

  it("should return only active gateways for credit_card", () => {
    const activeCcGateways = getActiveGatewaysByMethod("credit_card");
    
    activeCcGateways.forEach((gateway) => {
      expect(gateway.status).toBe("active");
      expect(gateway.supportedMethods).toContain("credit_card");
    });
  });
});

// ============================================================================
// getGatewayById
// ============================================================================

describe("getGatewayById", () => {
  it("should return asaas gateway by id", () => {
    const gateway = getGatewayById("asaas");
    
    expect(gateway).toBeDefined();
    expect(gateway?.id).toBe("asaas");
    expect(gateway?.displayName).toBe("Asaas");
  });

  it("should return mercadopago gateway by id", () => {
    const gateway = getGatewayById("mercadopago");
    
    expect(gateway).toBeDefined();
    expect(gateway?.id).toBe("mercadopago");
  });

  it("should return undefined for non-existent gateway", () => {
    const gateway = getGatewayById("nonexistent");
    
    expect(gateway).toBeUndefined();
  });

  it("should return undefined for empty string", () => {
    const gateway = getGatewayById("");
    
    expect(gateway).toBeUndefined();
  });
});

// ============================================================================
// formatGatewayFees
// ============================================================================

describe("formatGatewayFees", () => {
  it("should format fixed fee", () => {
    const fees: GatewayFees = { fixed: 200 }; // R$ 2,00
    const formatted = formatGatewayFees(fees);
    
    expect(formatted).toContain("R$ 2.00");
    expect(formatted).toContain("Taxa:");
  });

  it("should format percentage fee", () => {
    const fees: GatewayFees = { percentage: 3.99 };
    const formatted = formatGatewayFees(fees);
    
    expect(formatted).toContain("3.99%");
  });

  it("should format transaction fee", () => {
    const fees: GatewayFees = { transaction: 40 }; // R$ 0,40
    const formatted = formatGatewayFees(fees);
    
    expect(formatted).toContain("R$ 0.40");
  });

  it("should format combined fees", () => {
    const fees: GatewayFees = {
      fixed: 200,
      percentage: 3.99,
      transaction: 40,
    };
    const formatted = formatGatewayFees(fees);
    
    expect(formatted).toContain("R$ 2.00");
    expect(formatted).toContain("3.99%");
    expect(formatted).toContain("R$ 0.40");
    expect(formatted).toContain("+");
  });

  it("should return 'Sem taxas' for empty fees", () => {
    const fees: GatewayFees = {};
    const formatted = formatGatewayFees(fees);
    
    expect(formatted).toBe("Sem taxas");
  });

  it("should ignore zero values", () => {
    const fees: GatewayFees = { fixed: 0, percentage: 2.5 };
    const formatted = formatGatewayFees(fees);
    
    expect(formatted).not.toContain("R$ 0.00");
    expect(formatted).toContain("2.50%");
  });
});

// ============================================================================
// isGatewayAvailable
// ============================================================================

describe("isGatewayAvailable", () => {
  it("should return true for active gateways", () => {
    expect(isGatewayAvailable("asaas")).toBe(true);
    expect(isGatewayAvailable("mercadopago")).toBe(true);
    expect(isGatewayAvailable("stripe")).toBe(true);
    expect(isGatewayAvailable("pushinpay")).toBe(true);
  });

  it("should return false for non-existent gateways", () => {
    expect(isGatewayAvailable("nonexistent")).toBe(false);
    expect(isGatewayAvailable("")).toBe(false);
  });

  // Note: Beta gateways would return true if any existed
});

// ============================================================================
// getGatewayDisplayName
// ============================================================================

describe("getGatewayDisplayName", () => {
  it("should return display name for valid gateway", () => {
    expect(getGatewayDisplayName("asaas")).toBe("Asaas");
    expect(getGatewayDisplayName("mercadopago")).toBe("Mercado Pago");
    expect(getGatewayDisplayName("stripe")).toBe("Stripe");
    expect(getGatewayDisplayName("pushinpay")).toBe("PushinPay");
  });

  it("should return id for non-existent gateway", () => {
    expect(getGatewayDisplayName("nonexistent")).toBe("nonexistent");
    expect(getGatewayDisplayName("custom-gateway")).toBe("custom-gateway");
  });
});

// ============================================================================
// Gateway Fees Structure
// ============================================================================

describe("Gateway Fees Structure", () => {
  it("asaas should have only pix fees (credit_card not implemented)", () => {
    const asaas = PAYMENT_GATEWAYS.asaas;
    
    expect(asaas.fees.pix).toBeDefined();
    expect(asaas.fees.credit_card).toBeUndefined();
  });

  it("mercadopago should have pix and credit_card fees", () => {
    const mp = PAYMENT_GATEWAYS.mercadopago;
    
    expect(mp.fees.pix).toBeDefined();
    expect(mp.fees.credit_card).toBeDefined();
    expect(mp.fees.pix?.percentage).toBe(0.99);
  });

  it("stripe should have credit_card and debit_card fees", () => {
    const stripe = PAYMENT_GATEWAYS.stripe;
    
    expect(stripe.fees.credit_card).toBeDefined();
    expect(stripe.fees.debit_card).toBeDefined();
  });

  it("pushinpay should only have pix fees", () => {
    const pushinpay = PAYMENT_GATEWAYS.pushinpay;
    
    expect(pushinpay.fees.pix).toBeDefined();
    expect(pushinpay.supportedMethods).toEqual(["pix"]);
  });
});

// ============================================================================
// Credentials Fields
// ============================================================================

describe("Credentials Fields", () => {
  it("all gateways requiring credentials should have fields defined", () => {
    Object.values(PAYMENT_GATEWAYS).forEach((gateway) => {
      if (gateway.requiresCredentials) {
        expect(gateway.credentialsFields).toBeDefined();
        expect(gateway.credentialsFields?.length).toBeGreaterThan(0);
      }
    });
  });

  it("asaas should require api_key and environment", () => {
    const asaas = PAYMENT_GATEWAYS.asaas;
    
    expect(asaas.credentialsFields).toContain("api_key");
    expect(asaas.credentialsFields).toContain("environment");
  });

  it("mercadopago should require public_key and access_token", () => {
    const mp = PAYMENT_GATEWAYS.mercadopago;
    
    expect(mp.credentialsFields).toContain("public_key");
    expect(mp.credentialsFields).toContain("access_token");
  });

  it("stripe should require publishable_key and secret_key", () => {
    const stripe = PAYMENT_GATEWAYS.stripe;
    
    expect(stripe.credentialsFields).toContain("publishable_key");
    expect(stripe.credentialsFields).toContain("secret_key");
  });
});
