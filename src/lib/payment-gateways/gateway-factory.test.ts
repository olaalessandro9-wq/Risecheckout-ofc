/**
 * Unit Tests: Gateway Factory
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for gateway factory pattern including:
 * - Gateway retrieval
 * - Available gateways listing
 * - Gateway support validation
 * 
 * @module lib/payment-gateways/gateway-factory.test
 */

import { describe, it, expect } from "vitest";
import {
  getGateway,
  getAvailableGateways,
  isGatewaySupported,
} from "./gateway-factory";

// ============================================================================
// getGateway
// ============================================================================

describe("getGateway", () => {
  it("should return mercadopago gateway", () => {
    const gateway = getGateway("mercadopago");
    
    expect(gateway).toBeDefined();
    expect(gateway.id).toBe("mercadopago");
    expect(gateway.displayName).toBe("Mercado Pago");
  });

  it("should return stripe gateway", () => {
    const gateway = getGateway("stripe");
    
    expect(gateway).toBeDefined();
    expect(gateway.id).toBe("stripe");
    expect(gateway.displayName).toBe("Stripe");
  });

  it("should throw error for unsupported gateway", () => {
    expect(() => getGateway("invalid-gateway")).toThrow();
    expect(() => getGateway("invalid-gateway")).toThrow(/não suportado/);
  });

  it("should throw error for empty string", () => {
    expect(() => getGateway("")).toThrow();
  });

  it("should return gateway with generateInstallments method", () => {
    const gateway = getGateway("mercadopago");
    
    expect(gateway.generateInstallments).toBeDefined();
    expect(typeof gateway.generateInstallments).toBe("function");
  });

  it("should return gateway with getInterestRate method", () => {
    const gateway = getGateway("mercadopago");
    
    expect(gateway.getInterestRate).toBeDefined();
    expect(typeof gateway.getInterestRate).toBe("function");
  });
});

// ============================================================================
// getAvailableGateways
// ============================================================================

describe("getAvailableGateways", () => {
  it("should return an array of gateway IDs", () => {
    const gateways = getAvailableGateways();
    
    expect(Array.isArray(gateways)).toBe(true);
    expect(gateways.length).toBeGreaterThan(0);
  });

  it("should include mercadopago", () => {
    const gateways = getAvailableGateways();
    
    expect(gateways).toContain("mercadopago");
  });

  it("should include stripe", () => {
    const gateways = getAvailableGateways();
    
    expect(gateways).toContain("stripe");
  });

  it("should return strings only", () => {
    const gateways = getAvailableGateways();
    
    gateways.forEach((gateway) => {
      expect(typeof gateway).toBe("string");
    });
  });

  it("should return unique values", () => {
    const gateways = getAvailableGateways();
    const uniqueGateways = [...new Set(gateways)];
    
    expect(gateways.length).toBe(uniqueGateways.length);
  });
});

// ============================================================================
// isGatewaySupported
// ============================================================================

describe("isGatewaySupported", () => {
  it("should return true for mercadopago", () => {
    expect(isGatewaySupported("mercadopago")).toBe(true);
  });

  it("should return true for stripe", () => {
    expect(isGatewaySupported("stripe")).toBe(true);
  });

  it("should return false for invalid gateway", () => {
    expect(isGatewaySupported("invalid-gateway")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isGatewaySupported("")).toBe(false);
  });

  it("should return false for null-like values", () => {
    // TypeScript prevents these, but test runtime behavior
    expect(isGatewaySupported(null as unknown as string)).toBe(false);
    expect(isGatewaySupported(undefined as unknown as string)).toBe(false);
  });

  it("should be case-sensitive", () => {
    expect(isGatewaySupported("MercadoPago")).toBe(false);
    expect(isGatewaySupported("MERCADOPAGO")).toBe(false);
    expect(isGatewaySupported("mercadopago")).toBe(true);
  });
});

// ============================================================================
// Gateway Interface Consistency
// ============================================================================

describe("Gateway Interface Consistency", () => {
  it("all gateways should have consistent interface", () => {
    const gatewayIds = getAvailableGateways();
    
    gatewayIds.forEach((id) => {
      const gateway = getGateway(id);
      
      expect(gateway).toHaveProperty("id");
      expect(gateway).toHaveProperty("displayName");
      expect(gateway).toHaveProperty("generateInstallments");
      expect(gateway).toHaveProperty("getInterestRate");
    });
  });

  it("all gateways should return valid installments", () => {
    const gatewayIds = getAvailableGateways();
    
    gatewayIds.forEach((id) => {
      const gateway = getGateway(id);
      const installments = gateway.generateInstallments(10000);
      
      expect(Array.isArray(installments)).toBe(true);
      expect(installments.length).toBeGreaterThan(0);
    });
  });

  it("all gateways should return valid interest rate", () => {
    const gatewayIds = getAvailableGateways();
    
    gatewayIds.forEach((id) => {
      const gateway = getGateway(id);
      const rate = gateway.getInterestRate();
      
      expect(typeof rate).toBe("number");
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThan(1); // Rate should be < 100%
    });
  });
});

// ============================================================================
// Gateway-Specific Rates
// ============================================================================

describe("Gateway-Specific Interest Rates", () => {
  it("mercadopago should have 2.99% rate", () => {
    const gateway = getGateway("mercadopago");
    const rate = gateway.getInterestRate();
    
    expect(rate).toBeCloseTo(0.0299, 4);
  });

  it("stripe should have 1.99% rate", () => {
    const gateway = getGateway("stripe");
    const rate = gateway.getInterestRate();
    
    expect(rate).toBeCloseTo(0.0199, 4);
  });

  it("different gateways should have different rates", () => {
    const mpGateway = getGateway("mercadopago");
    const stripeGateway = getGateway("stripe");
    
    expect(mpGateway.getInterestRate()).not.toBe(stripeGateway.getInterestRate());
  });
});

// ============================================================================
// Gateway Installments Generation
// ============================================================================

describe("Gateway Installments Generation", () => {
  it("mercadopago should generate installments with its rate", () => {
    const gateway = getGateway("mercadopago");
    const installments = gateway.generateInstallments(10000);
    
    // First installment (1x) should have no interest
    expect(installments[0].hasInterest).toBe(false);
    expect(installments[0].totalAmount).toBe(100); // R$ 100,00
    
    // Second installment should have interest
    if (installments.length > 1) {
      expect(installments[1].hasInterest).toBe(true);
    }
  });

  it("stripe should generate installments with its rate", () => {
    const gateway = getGateway("stripe");
    const installments = gateway.generateInstallments(10000);
    
    expect(installments[0].hasInterest).toBe(false);
    expect(installments[0].totalAmount).toBe(100);
  });

  it("should respect maxInstallments parameter", () => {
    const gateway = getGateway("mercadopago");
    const installments = gateway.generateInstallments(100000, 6);
    
    expect(installments.length).toBeLessThanOrEqual(6);
  });
});
