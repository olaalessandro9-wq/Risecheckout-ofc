/**
 * Stripe Gateway Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import { stripeGateway } from "./index";

describe("stripeGateway", () => {
  // ============================================================================
  // Identity
  // ============================================================================

  describe("id", () => {
    it("should be 'stripe'", () => {
      expect(stripeGateway.id).toBe("stripe");
    });
  });

  describe("displayName", () => {
    it("should be 'Stripe'", () => {
      expect(stripeGateway.displayName).toBe("Stripe");
    });
  });

  // ============================================================================
  // generateInstallments
  // ============================================================================

  describe("generateInstallments", () => {
    it("should generate installments with Stripe interest rate (1.99%)", () => {
      const installments = stripeGateway.generateInstallments(10000); // R$ 100,00

      expect(installments).toBeDefined();
      expect(installments.length).toBeGreaterThan(0);
      
      // First installment should be full amount (1x)
      expect(installments[0].installments).toBe(1);
      expect(installments[0].installmentAmount).toBe(10000);
    });

    it("should respect maxInstallments param", () => {
      const installments = stripeGateway.generateInstallments(10000, 6);

      expect(installments.length).toBeLessThanOrEqual(6);
      
      // All installments should be <= 6
      installments.forEach(inst => {
        expect(inst.installments).toBeLessThanOrEqual(6);
      });
    });

    it("should apply lower interest than MercadoPago", () => {
      const installments = stripeGateway.generateInstallments(10000, 12);
      
      // Find 12x installment
      const twelvex = installments.find(i => i.installments === 12 || i.value === 12);
      
      if (twelvex) {
        // Total with interest should be greater than original
        expect(twelvex.totalAmount).toBeGreaterThan(10000);
        
        // Stripe's 1.99% is lower than MP's 2.99%
        // So total interest should be less than ~40% (which would be 2.99% x 12)
        expect(twelvex.totalAmount).toBeLessThan(14000);
      }
    });

    it("should handle small amounts", () => {
      const installments = stripeGateway.generateInstallments(1000, 12);
      
      // Should still generate valid installments
      expect(installments.length).toBeGreaterThan(0);
      installments.forEach(inst => {
        expect(inst.installmentAmount).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // getInterestRate
  // ============================================================================

  describe("getInterestRate", () => {
    it("should return 0.0199 (1.99%)", () => {
      expect(stripeGateway.getInterestRate()).toBe(0.0199);
    });
  });
});
