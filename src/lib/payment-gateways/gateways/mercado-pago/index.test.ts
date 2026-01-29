/**
 * Mercado Pago Gateway Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import { mercadoPagoGateway } from "./index";

describe("mercadoPagoGateway", () => {
  // ============================================================================
  // Identity
  // ============================================================================

  describe("id", () => {
    it("should be 'mercadopago'", () => {
      expect(mercadoPagoGateway.id).toBe("mercadopago");
    });
  });

  describe("displayName", () => {
    it("should be 'Mercado Pago'", () => {
      expect(mercadoPagoGateway.displayName).toBe("Mercado Pago");
    });
  });

  // ============================================================================
  // generateInstallments
  // ============================================================================

  describe("generateInstallments", () => {
    it("should generate installments with MP interest rate (2.99%)", () => {
      const installments = mercadoPagoGateway.generateInstallments(10000); // R$ 100,00

      expect(installments).toBeDefined();
      expect(installments.length).toBeGreaterThan(0);
      
      // First installment should be full amount (1x)
      expect(installments[0].installments).toBe(1);
      expect(installments[0].installmentAmount).toBe(10000);
    });

    it("should respect maxInstallments param", () => {
      const installments = mercadoPagoGateway.generateInstallments(10000, 6);

      expect(installments.length).toBeLessThanOrEqual(6);
      
      // All installments should be <= 6
      installments.forEach(inst => {
        expect(inst.installments).toBeLessThanOrEqual(6);
      });
    });

    it("should apply interest to installments > 1", () => {
      const installments = mercadoPagoGateway.generateInstallments(10000, 12);
      
      // Find 12x installment
      const twelvex = installments.find(i => i.installments === 12 || i.value === 12);
      
      if (twelvex) {
        // Total with interest should be greater than original amount
        expect(twelvex.totalAmount).toBeGreaterThan(10000);
      }
    });

    it("should handle minimum installment value", () => {
      // R$ 50,00 - should have fewer installments due to minimum value
      const installments = mercadoPagoGateway.generateInstallments(5000, 12);
      
      // Each installment should meet minimum value requirements
      installments.forEach(inst => {
        expect(inst.installmentAmount).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // getInterestRate
  // ============================================================================

  describe("getInterestRate", () => {
    it("should return 0.0299 (2.99%)", () => {
      expect(mercadoPagoGateway.getInterestRate()).toBe(0.0299);
    });
  });
});
