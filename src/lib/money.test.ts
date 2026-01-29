/**
 * Money Utilities Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the monetary calculation and formatting module.
 * CRITICAL: These tests validate price display that affects user trust.
 * 
 * @module lib/money.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  toCents,
  parseBRLInput,
  toReais,
  formatCentsToBRL,
  sumCents,
  applyDiscount,
  calculateDiscountPercent,
  isValidAmount,
  debugMoney,
} from "./money";

// Mock the logger to prevent console output during tests
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ============================================================================
// toCents Tests
// ============================================================================

describe("toCents", () => {
  describe("string inputs (Brazilian format)", () => {
    it('should convert "19,90" to 1990 cents', () => {
      expect(toCents("19,90")).toBe(1990);
    });

    it('should convert "R$ 19,90" to 1990 cents', () => {
      expect(toCents("R$ 19,90")).toBe(1990);
    });

    it('should convert "R$19,90" (no space) to 1990 cents', () => {
      expect(toCents("R$19,90")).toBe(1990);
    });

    it('should convert "1.234,56" to 123456 cents', () => {
      expect(toCents("1.234,56")).toBe(123456);
    });

    it('should convert "R$ 1.234,56" to 123456 cents', () => {
      expect(toCents("R$ 1.234,56")).toBe(123456);
    });

    it('should convert "100" (no decimal) to 100 cents (assumes cents)', () => {
      expect(toCents("100")).toBe(100);
    });

    it('should convert "1990" (no decimal) to 1990 cents', () => {
      expect(toCents("1990")).toBe(1990);
    });

    it("should return 0 for empty string", () => {
      expect(toCents("")).toBe(0);
    });

    it("should return 0 for invalid string", () => {
      expect(toCents("abc")).toBe(0);
    });

    it("should return 0 for string with only symbols", () => {
      expect(toCents("R$")).toBe(0);
    });
  });

  describe("number inputs", () => {
    it("should convert 19.90 (reais) to 1990 cents", () => {
      expect(toCents(19.9)).toBe(1990);
    });

    it("should convert 99.90 (reais) to 9990 cents", () => {
      expect(toCents(99.9)).toBe(9990);
    });

    it("should keep 1990 (integer) as 1990 cents", () => {
      expect(toCents(1990)).toBe(1990);
    });

    it("should keep 100 (integer) as 100 cents", () => {
      expect(toCents(100)).toBe(100);
    });

    it("should convert 0.01 to 1 cent", () => {
      expect(toCents(0.01)).toBe(1);
    });

    it("should return 0 for 0", () => {
      expect(toCents(0)).toBe(0);
    });
  });

  describe("null/undefined inputs", () => {
    it("should return 0 for null", () => {
      expect(toCents(null)).toBe(0);
    });

    it("should return 0 for undefined", () => {
      expect(toCents(undefined)).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should handle 0.99 correctly", () => {
      expect(toCents(0.99)).toBe(99);
    });

    it('should handle "0,99" correctly', () => {
      expect(toCents("0,99")).toBe(99);
    });

    it('should handle large values "99.999,99"', () => {
      expect(toCents("99.999,99")).toBe(9999999);
    });

    it("should handle floating point precision issues", () => {
      // 0.1 + 0.2 = 0.30000000000000004 in JS
      // Our function should round correctly
      expect(toCents(0.1 + 0.2)).toBe(30);
    });
  });
});

// ============================================================================
// parseBRLInput Tests
// ============================================================================

describe("parseBRLInput", () => {
  it('should parse "R$ 1.234,56" to 123456 cents', () => {
    expect(parseBRLInput("R$ 1.234,56")).toBe(123456);
  });

  it('should parse "1.234,56" to 123456 cents', () => {
    expect(parseBRLInput("1.234,56")).toBe(123456);
  });

  it('should parse "1234,56" to 123456 cents', () => {
    expect(parseBRLInput("1234,56")).toBe(123456);
  });

  it('should parse "19,90" to 1990 cents', () => {
    expect(parseBRLInput("19,90")).toBe(1990);
  });

  it("should return 0 for empty string", () => {
    expect(parseBRLInput("")).toBe(0);
  });

  it("should return 0 for whitespace", () => {
    expect(parseBRLInput("   ")).toBe(0);
  });

  it("should return 0 for invalid input", () => {
    expect(parseBRLInput("invalid")).toBe(0);
  });
});

// ============================================================================
// toReais Tests
// ============================================================================

describe("toReais", () => {
  it("should convert 1990 cents to 19.90 reais", () => {
    expect(toReais(1990)).toBe(19.9);
  });

  it("should convert 100 cents to 1.00 reais", () => {
    expect(toReais(100)).toBe(1);
  });

  it("should convert 1 cent to 0.01 reais", () => {
    expect(toReais(1)).toBe(0.01);
  });

  it("should convert 0 cents to 0 reais", () => {
    expect(toReais(0)).toBe(0);
  });

  it("should return 0 for null", () => {
    expect(toReais(null)).toBe(0);
  });

  it("should return 0 for undefined", () => {
    expect(toReais(undefined)).toBe(0);
  });

  it("should handle large values", () => {
    expect(toReais(10000000)).toBe(100000); // R$ 100.000
  });
});

// ============================================================================
// formatCentsToBRL Tests
// ============================================================================

describe("formatCentsToBRL", () => {
  it('should format 1990 cents as "R$ 19,90"', () => {
    expect(formatCentsToBRL(1990)).toBe("R$ 19,90");
  });

  it('should format 123456 cents as "R$ 1.234,56"', () => {
    expect(formatCentsToBRL(123456)).toBe("R$ 1.234,56");
  });

  it('should format 100 cents as "R$ 1,00"', () => {
    expect(formatCentsToBRL(100)).toBe("R$ 1,00");
  });

  it('should format 1 cent as "R$ 0,01"', () => {
    expect(formatCentsToBRL(1)).toBe("R$ 0,01");
  });

  it('should format 0 cents as "R$ 0,00"', () => {
    expect(formatCentsToBRL(0)).toBe("R$ 0,00");
  });

  it('should format null as "R$ 0,00"', () => {
    expect(formatCentsToBRL(null)).toBe("R$ 0,00");
  });

  it('should format undefined as "R$ 0,00"', () => {
    expect(formatCentsToBRL(undefined)).toBe("R$ 0,00");
  });

  describe("without symbol", () => {
    it('should format 1990 cents as "19,90" without symbol', () => {
      expect(formatCentsToBRL(1990, { symbol: false })).toBe("19,90");
    });

    it('should format 123456 cents as "1.234,56" without symbol', () => {
      expect(formatCentsToBRL(123456, { symbol: false })).toBe("1.234,56");
    });

    it('should format null as "0,00" without symbol', () => {
      expect(formatCentsToBRL(null, { symbol: false })).toBe("0,00");
    });
  });

  describe("large values", () => {
    it("should format R$ 100.000,00 correctly", () => {
      expect(formatCentsToBRL(10000000)).toBe("R$ 100.000,00");
    });

    it("should format R$ 1.000.000,00 correctly", () => {
      expect(formatCentsToBRL(100000000)).toBe("R$ 1.000.000,00");
    });
  });
});

// ============================================================================
// sumCents Tests
// ============================================================================

describe("sumCents", () => {
  it("should sum multiple values", () => {
    expect(sumCents(1990, 500, 1000)).toBe(3490);
  });

  it("should handle single value", () => {
    expect(sumCents(1990)).toBe(1990);
  });

  it("should return 0 for no arguments", () => {
    expect(sumCents()).toBe(0);
  });

  it("should handle null values", () => {
    expect(sumCents(1990, null, 500)).toBe(2490);
  });

  it("should handle undefined values", () => {
    expect(sumCents(1990, undefined, 500)).toBe(2490);
  });

  it("should handle all null/undefined", () => {
    expect(sumCents(null, undefined, null)).toBe(0);
  });

  it("should handle zero values", () => {
    expect(sumCents(1990, 0, 500)).toBe(2490);
  });
});

// ============================================================================
// applyDiscount Tests
// ============================================================================

describe("applyDiscount", () => {
  it("should apply 10% discount correctly", () => {
    expect(applyDiscount(1990, 10)).toBe(1791);
  });

  it("should apply 50% discount correctly", () => {
    expect(applyDiscount(1000, 50)).toBe(500);
  });

  it("should apply 100% discount correctly", () => {
    expect(applyDiscount(1990, 100)).toBe(0);
  });

  it("should apply 0% discount correctly", () => {
    expect(applyDiscount(1990, 0)).toBe(1990);
  });

  it("should return original value for negative discount", () => {
    expect(applyDiscount(1990, -10)).toBe(1990);
  });

  it("should return original value for discount > 100", () => {
    expect(applyDiscount(1990, 150)).toBe(1990);
  });

  it("should handle decimal percentages", () => {
    expect(applyDiscount(10000, 15)).toBe(8500);
  });

  it("should round correctly", () => {
    // 1990 * 0.85 = 1691.5 → should round to 1692 or 1691
    expect(applyDiscount(1990, 15)).toBeCloseTo(1692, 0);
  });
});

// ============================================================================
// calculateDiscountPercent Tests
// ============================================================================

describe("calculateDiscountPercent", () => {
  it("should calculate 10% discount", () => {
    expect(calculateDiscountPercent(1990, 1791)).toBe(10);
  });

  it("should calculate 50% discount", () => {
    expect(calculateDiscountPercent(1000, 500)).toBe(50);
  });

  it("should calculate 100% discount", () => {
    expect(calculateDiscountPercent(1990, 0)).toBe(100);
  });

  it("should calculate 0% discount", () => {
    expect(calculateDiscountPercent(1990, 1990)).toBe(0);
  });

  it("should return 0 for zero original value", () => {
    expect(calculateDiscountPercent(0, 0)).toBe(0);
  });

  it("should return 0 for negative original value", () => {
    expect(calculateDiscountPercent(-100, 0)).toBe(0);
  });

  it("should handle when discounted > original (negative discount)", () => {
    // This would be a markup, not a discount
    expect(calculateDiscountPercent(1000, 1500)).toBe(-50);
  });
});

// ============================================================================
// isValidAmount Tests
// ============================================================================

describe("isValidAmount", () => {
  it("should return true for positive integer", () => {
    expect(isValidAmount(1990)).toBe(true);
  });

  it("should return true for 1 cent (minimum)", () => {
    expect(isValidAmount(1)).toBe(true);
  });

  it("should return false for 0", () => {
    expect(isValidAmount(0)).toBe(false);
  });

  it("should return false for negative value", () => {
    expect(isValidAmount(-100)).toBe(false);
  });

  it("should return false for decimal value", () => {
    expect(isValidAmount(19.9)).toBe(false);
  });

  it("should accept custom minimum", () => {
    expect(isValidAmount(500, 500)).toBe(true);
    expect(isValidAmount(499, 500)).toBe(false);
  });

  it("should return true for large values", () => {
    expect(isValidAmount(100000000)).toBe(true);
  });
});

// ============================================================================
// debugMoney Tests
// ============================================================================

describe("debugMoney", () => {
  it("should format debug string correctly", () => {
    expect(debugMoney(1990)).toBe("1990 cents (R$ 19,90)");
  });

  it("should handle 0 cents", () => {
    expect(debugMoney(0)).toBe("0 cents (R$ 0,00)");
  });

  it("should handle large values", () => {
    expect(debugMoney(123456)).toBe("123456 cents (R$ 1.234,56)");
  });
});

// ============================================================================
// Integration Tests - Round Trip
// ============================================================================

describe("Round Trip Conversions", () => {
  it("should maintain value through toCents → formatCentsToBRL", () => {
    const original = "19,90";
    const cents = toCents(original);
    const formatted = formatCentsToBRL(cents);
    expect(formatted).toBe("R$ 19,90");
  });

  it("should maintain value through number → toCents → toReais", () => {
    const original = 19.9;
    const cents = toCents(original);
    const reais = toReais(cents);
    expect(reais).toBe(original);
  });

  it("should maintain value through parseBRLInput → formatCentsToBRL", () => {
    const original = "R$ 1.234,56";
    const cents = parseBRLInput(original);
    const formatted = formatCentsToBRL(cents);
    expect(formatted).toBe("R$ 1.234,56");
  });

  it("should correctly calculate discount and format", () => {
    const original = 10000; // R$ 100,00
    const discounted = applyDiscount(original, 20); // 20% off
    const formatted = formatCentsToBRL(discounted);
    expect(formatted).toBe("R$ 80,00");
  });
});
