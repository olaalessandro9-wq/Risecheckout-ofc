/**
 * Unit Tests: Installments Calculator
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for installment generation logic including:
 * - Interest calculation
 * - Minimum installment value
 * - Maximum installments limit
 * - Custom configuration
 * 
 * @module lib/payment-gateways/installments.test
 */

import { describe, it, expect } from "vitest";
import { generateInstallments } from "./installments";

// ============================================================================
// generateInstallments - Basic Functionality
// ============================================================================

describe("generateInstallments - Basic Functionality", () => {
  it("should generate installments for a given amount", () => {
    const installments = generateInstallments(10000); // R$ 100,00
    
    expect(installments.length).toBeGreaterThan(0);
    expect(Array.isArray(installments)).toBe(true);
  });

  it("should always include 1x (à vista) option", () => {
    const installments = generateInstallments(10000);
    
    expect(installments[0].value).toBe(1);
    expect(installments[0].hasInterest).toBe(false);
  });

  it("should return correct structure for each installment", () => {
    const installments = generateInstallments(10000);
    
    installments.forEach((installment) => {
      expect(installment).toHaveProperty("value");
      expect(installment).toHaveProperty("label");
      expect(installment).toHaveProperty("installmentAmount");
      expect(installment).toHaveProperty("totalAmount");
      expect(installment).toHaveProperty("hasInterest");
      
      expect(typeof installment.value).toBe("number");
      expect(typeof installment.label).toBe("string");
      expect(typeof installment.installmentAmount).toBe("number");
      expect(typeof installment.totalAmount).toBe("number");
      expect(typeof installment.hasInterest).toBe("boolean");
    });
  });
});

// ============================================================================
// generateInstallments - À Vista (1x)
// ============================================================================

describe("generateInstallments - À Vista (1x)", () => {
  it("should have no interest for 1x", () => {
    const installments = generateInstallments(10000);
    const oneTime = installments[0];
    
    expect(oneTime.value).toBe(1);
    expect(oneTime.hasInterest).toBe(false);
  });

  it("should have total equal to original amount for 1x", () => {
    const amountCents = 15000; // R$ 150,00
    const installments = generateInstallments(amountCents);
    const oneTime = installments[0];
    
    expect(oneTime.totalAmount).toBe(150); // R$ 150,00 em reais
    expect(oneTime.installmentAmount).toBe(150);
  });

  it("should format label correctly for 1x", () => {
    const installments = generateInstallments(10000);
    const oneTime = installments[0];
    
    expect(oneTime.label).toContain("1x");
    expect(oneTime.label).toContain("100,00");
  });
});

// ============================================================================
// generateInstallments - Interest Calculation
// ============================================================================

describe("generateInstallments - Interest Calculation", () => {
  it("should apply interest to 2x and above", () => {
    const installments = generateInstallments(10000);
    
    // 2x should have interest
    const twoInstallments = installments.find((i) => i.value === 2);
    expect(twoInstallments?.hasInterest).toBe(true);
  });

  it("should have higher total for installments with interest", () => {
    const installments = generateInstallments(10000);
    const oneTime = installments[0];
    const twoInstallments = installments.find((i) => i.value === 2);
    
    expect(twoInstallments!.totalAmount).toBeGreaterThan(oneTime.totalAmount);
  });

  it("should have progressively higher totals with more installments", () => {
    const installments = generateInstallments(100000); // R$ 1000 to ensure all installments
    
    for (let i = 1; i < installments.length; i++) {
      expect(installments[i].totalAmount).toBeGreaterThanOrEqual(
        installments[i - 1].totalAmount
      );
    }
  });

  it("should calculate installment amount correctly", () => {
    const installments = generateInstallments(10000);
    
    installments.forEach((installment) => {
      const calculated = installment.totalAmount / installment.value;
      expect(installment.installmentAmount).toBeCloseTo(calculated, 2);
    });
  });
});

// ============================================================================
// generateInstallments - Maximum Installments
// ============================================================================

describe("generateInstallments - Maximum Installments", () => {
  it("should respect default max of 12 installments", () => {
    const installments = generateInstallments(1000000); // R$ 10.000
    
    expect(installments.length).toBeLessThanOrEqual(12);
    const maxValue = Math.max(...installments.map((i) => i.value));
    expect(maxValue).toBeLessThanOrEqual(12);
  });

  it("should respect custom max installments config", () => {
    const installments = generateInstallments(1000000, { maxInstallments: 6 });
    
    expect(installments.length).toBeLessThanOrEqual(6);
    const maxValue = Math.max(...installments.map((i) => i.value));
    expect(maxValue).toBeLessThanOrEqual(6);
  });

  it("should allow up to 24 installments if configured", () => {
    const installments = generateInstallments(5000000, { maxInstallments: 24 }); // R$ 50.000
    
    // Depending on min installment value, may not reach 24
    expect(installments.length).toBeLessThanOrEqual(24);
  });
});

// ============================================================================
// generateInstallments - Minimum Installment Value
// ============================================================================

describe("generateInstallments - Minimum Installment Value", () => {
  it("should not generate installments below minimum value", () => {
    // With default min of R$ 5,00 (500 centavos)
    const installments = generateInstallments(2000); // R$ 20,00
    
    installments.forEach((installment) => {
      // Installment amount should be at least R$ 5,00
      expect(installment.installmentAmount * 100).toBeGreaterThanOrEqual(500);
    });
  });

  it("should respect custom minimum installment value", () => {
    const installments = generateInstallments(10000, { minInstallmentValue: 2000 }); // Min R$ 20
    
    installments.forEach((installment) => {
      expect(installment.installmentAmount * 100).toBeGreaterThanOrEqual(2000);
    });
  });

  it("should generate fewer installments for small amounts", () => {
    const smallAmount = 1000; // R$ 10,00
    const largeAmount = 100000; // R$ 1.000,00
    
    const smallInstallments = generateInstallments(smallAmount);
    const largeInstallments = generateInstallments(largeAmount);
    
    expect(smallInstallments.length).toBeLessThan(largeInstallments.length);
  });

  it("should return empty array for amounts below minimum installment", () => {
    // With default min R$ 5,00 (500 centavos), R$ 4,00 is below min
    // The implementation breaks before adding 1x if even 1x is below min
    const installments = generateInstallments(400); // R$ 4,00
    
    // The current implementation returns empty array for very small amounts
    // because even 1x would be below the minimum installment value
    expect(installments.length).toBe(0);
  });
});

// ============================================================================
// generateInstallments - Custom Interest Rate
// ============================================================================

describe("generateInstallments - Custom Interest Rate", () => {
  it("should apply custom interest rate", () => {
    const defaultInstallments = generateInstallments(10000);
    const customInstallments = generateInstallments(10000, { interestRate: 0.05 }); // 5%
    
    const defaultTotal = defaultInstallments.find((i) => i.value === 3)?.totalAmount;
    const customTotal = customInstallments.find((i) => i.value === 3)?.totalAmount;
    
    // Higher interest rate should result in higher total
    expect(customTotal).toBeGreaterThan(defaultTotal!);
  });

  it("should handle 0% interest rate", () => {
    const installments = generateInstallments(10000, { interestRate: 0 });
    
    // All installments should have the same total (no interest)
    installments.forEach((installment) => {
      expect(installment.totalAmount).toBe(100); // R$ 100,00
    });
  });

  it("should handle low interest rate", () => {
    const installments = generateInstallments(10000, { interestRate: 0.01 }); // 1%
    
    const threeInstallments = installments.find((i) => i.value === 3);
    // Total should be slightly higher than R$ 100 due to 1% interest
    expect(threeInstallments!.totalAmount).toBeGreaterThan(100);
    expect(threeInstallments!.totalAmount).toBeLessThan(110); // But not too much
  });
});

// ============================================================================
// generateInstallments - Label Formatting
// ============================================================================

describe("generateInstallments - Label Formatting", () => {
  it("should format label with correct number of installments", () => {
    const installments = generateInstallments(10000);
    
    installments.forEach((installment) => {
      expect(installment.label).toContain(`${installment.value}x`);
    });
  });

  it("should format label with Brazilian currency format", () => {
    const installments = generateInstallments(10000);
    
    installments.forEach((installment) => {
      // Should contain comma as decimal separator (Brazilian format)
      expect(installment.label).toMatch(/\d+,\d{2}/);
    });
  });

  it("should format label with R$ symbol", () => {
    const installments = generateInstallments(10000);
    
    installments.forEach((installment) => {
      expect(installment.label).toContain("R$");
    });
  });
});

// ============================================================================
// generateInstallments - Edge Cases
// ============================================================================

describe("generateInstallments - Edge Cases", () => {
  it("should handle very large amounts", () => {
    const installments = generateInstallments(100000000); // R$ 1.000.000
    
    expect(installments.length).toBeGreaterThan(0);
    expect(installments[0].totalAmount).toBe(1000000);
  });

  it("should handle small amounts by returning empty if below minimum", () => {
    const installments = generateInstallments(100); // R$ 1,00
    
    // With default min of R$ 5,00 (500 centavos), R$ 1,00 is too small
    // The implementation returns empty array when even 1x is below minimum
    expect(installments.length).toBe(0);
  });

  it("should handle exact minimum installment boundary", () => {
    // With default min of R$ 5,00 and max 12 installments
    // R$ 60,00 should allow exactly 12x of R$ 5,00 + interest
    const installments = generateInstallments(6000);
    
    expect(installments.length).toBeGreaterThan(1);
  });

  it("should handle all config options together", () => {
    const installments = generateInstallments(100000, {
      interestRate: 0.02,
      maxInstallments: 6,
      minInstallmentValue: 10000, // R$ 100,00 minimum
    });
    
    expect(installments.length).toBeLessThanOrEqual(6);
    installments.forEach((i) => {
      expect(i.installmentAmount * 100).toBeGreaterThanOrEqual(10000);
    });
  });
});

// ============================================================================
// generateInstallments - Values Consistency
// ============================================================================

describe("generateInstallments - Values Consistency", () => {
  it("should have consistent values array (1, 2, 3, ...)", () => {
    const installments = generateInstallments(100000);
    
    for (let i = 0; i < installments.length; i++) {
      expect(installments[i].value).toBe(i + 1);
    }
  });

  it("should have positive values only", () => {
    const installments = generateInstallments(10000);
    
    installments.forEach((installment) => {
      expect(installment.value).toBeGreaterThan(0);
      expect(installment.installmentAmount).toBeGreaterThan(0);
      expect(installment.totalAmount).toBeGreaterThan(0);
    });
  });
});
