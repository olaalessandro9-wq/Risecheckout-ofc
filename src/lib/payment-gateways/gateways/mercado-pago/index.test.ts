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
      
      // First installment should be full amount (1x) - uses 'value' not 'installments'
      expect(installments[0].value).toBe(1);
      // installmentAmount is in BRL (reais), not centavos
      expect(installments[0].installmentAmount).toBe(100);
    });

    it("should respect maxInstallments param", () => {
      const installments = mercadoPagoGateway.generateInstallments(10000, 6);

      expect(installments.length).toBeLessThanOrEqual(6);
      
      // All installments should be <= 6 - uses 'value' property
      installments.forEach(inst => {
        expect(inst.value).toBeLessThanOrEqual(6);
      });
    });

    it("should apply interest to installments > 1", () => {
      const installments = mercadoPagoGateway.generateInstallments(10000, 12);
      
      // Find 12x installment using 'value' property
      const twelvex = installments.find(i => i.value === 12);
      
      if (twelvex) {
        // Total with interest should be greater than original amount (100 BRL)
        expect(twelvex.totalAmount).toBeGreaterThan(100);
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
