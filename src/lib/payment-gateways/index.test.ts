/**
 * Payment Gateways Module Exports Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests that the barrel export exposes all required APIs.
 */

import { describe, it, expect } from "vitest";
import * as PaymentGateways from "./index";

describe("Payment Gateways Module", () => {
  // ============================================================================
  // Factory Exports
  // ============================================================================

  describe("Factory Functions", () => {
    it("should export getGateway function", () => {
      expect(PaymentGateways.getGateway).toBeDefined();
      expect(typeof PaymentGateways.getGateway).toBe("function");
    });

    it("should export getAvailableGateways function", () => {
      expect(PaymentGateways.getAvailableGateways).toBeDefined();
      expect(typeof PaymentGateways.getAvailableGateways).toBe("function");
    });

    it("should export isGatewaySupported function", () => {
      expect(PaymentGateways.isGatewaySupported).toBeDefined();
      expect(typeof PaymentGateways.isGatewaySupported).toBe("function");
    });
  });

  // ============================================================================
  // Utility Exports
  // ============================================================================

  describe("Utility Functions", () => {
    it("should export generateInstallments function", () => {
      expect(PaymentGateways.generateInstallments).toBeDefined();
      expect(typeof PaymentGateways.generateInstallments).toBe("function");
    });

    it("should export formatCurrency function", () => {
      expect(PaymentGateways.formatCurrency).toBeDefined();
      expect(typeof PaymentGateways.formatCurrency).toBe("function");
    });
  });

  // ============================================================================
  // Gateway Component Exports
  // ============================================================================

  describe("Gateway Components", () => {
    it("should export MercadoPagoCardForm component", () => {
      expect(PaymentGateways.MercadoPagoCardForm).toBeDefined();
    });

    it("should export mercadoPagoGateway object", () => {
      expect(PaymentGateways.mercadoPagoGateway).toBeDefined();
      expect(PaymentGateways.mercadoPagoGateway.id).toBe("mercadopago");
    });
  });

  // ============================================================================
  // Type Exports (runtime check that types don't break)
  // ============================================================================

  describe("Type Exports", () => {
    it("should allow using exported types in type contexts", () => {
      // This test verifies that the types are properly exported
      // by using them - if they weren't exported, this would fail at compile time
      const installment: PaymentGateways.Installment = {
        value: 1,
        installments: 1,
        installmentAmount: 10000,
        totalAmount: 10000,
        hasInterest: false,
        label: "1x de R$ 100,00",
      };

      expect(installment.value).toBe(1);
    });
  });
});
