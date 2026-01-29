/**
 * UTMify Helper Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for UTM tracking utilities:
 * - Extract UTM parameters from URL
 * - Format date for UTMify API
 * - Convert values to cents
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractUTMParameters, formatDateForUTMify, convertToCents } from "../utmify-helper";

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
  }),
}));

// Mock api
vi.mock("@/lib/api", () => ({
  api: {
    publicCall: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
  },
}));

describe("UTMify Helper", () => {
  // ========== EXTRACT UTM PARAMETERS ==========

  describe("extractUTMParameters", () => {
    it("should extract all UTM parameters from URL", () => {
      const url = "https://example.com/checkout?utm_source=google&utm_campaign=summer&utm_medium=cpc&utm_content=banner&utm_term=shoes&src=affiliate123&sck=click456";

      const result = extractUTMParameters(url);

      expect(result.utm_source).toBe("google");
      expect(result.utm_campaign).toBe("summer");
      expect(result.utm_medium).toBe("cpc");
      expect(result.utm_content).toBe("banner");
      expect(result.utm_term).toBe("shoes");
      expect(result.src).toBe("affiliate123");
      expect(result.sck).toBe("click456");
    });

    it("should return null for missing parameters", () => {
      const url = "https://example.com/checkout?utm_source=google";

      const result = extractUTMParameters(url);

      expect(result.utm_source).toBe("google");
      expect(result.utm_campaign).toBeNull();
      expect(result.utm_medium).toBeNull();
      expect(result.utm_content).toBeNull();
      expect(result.utm_term).toBeNull();
      expect(result.src).toBeNull();
      expect(result.sck).toBeNull();
    });

    it("should handle URL without any parameters", () => {
      const url = "https://example.com/checkout";

      const result = extractUTMParameters(url);

      expect(result.utm_source).toBeNull();
      expect(result.utm_campaign).toBeNull();
      expect(result.src).toBeNull();
    });

    it("should handle URL-encoded values", () => {
      const url = "https://example.com?utm_source=my%20source&utm_campaign=spring%20sale";

      const result = extractUTMParameters(url);

      expect(result.utm_source).toBe("my source");
      expect(result.utm_campaign).toBe("spring sale");
    });

    it("should handle complex query strings", () => {
      const url = "https://example.com/checkout?product=123&utm_source=fb&variant=blue&utm_campaign=promo";

      const result = extractUTMParameters(url);

      expect(result.utm_source).toBe("fb");
      expect(result.utm_campaign).toBe("promo");
    });
  });

  // ========== FORMAT DATE FOR UTMIFY ==========

  describe("formatDateForUTMify", () => {
    it("should format Date object to UTC string", () => {
      // Create a specific UTC date
      const date = new Date(Date.UTC(2024, 5, 15, 14, 30, 45)); // June 15, 2024, 14:30:45 UTC

      const result = formatDateForUTMify(date);

      expect(result).toBe("2024-06-15 14:30:45");
    });

    it("should format ISO string to UTC string", () => {
      const isoString = "2024-06-15T14:30:45.000Z";

      const result = formatDateForUTMify(isoString);

      expect(result).toBe("2024-06-15 14:30:45");
    });

    it("should handle midnight correctly", () => {
      const date = new Date(Date.UTC(2024, 0, 1, 0, 0, 0)); // Jan 1, 2024, 00:00:00 UTC

      const result = formatDateForUTMify(date);

      expect(result).toBe("2024-01-01 00:00:00");
    });

    it("should pad single-digit values", () => {
      const date = new Date(Date.UTC(2024, 0, 5, 9, 5, 3)); // Jan 5, 2024, 09:05:03 UTC

      const result = formatDateForUTMify(date);

      expect(result).toBe("2024-01-05 09:05:03");
    });

    it("should handle end of day", () => {
      const date = new Date(Date.UTC(2024, 11, 31, 23, 59, 59)); // Dec 31, 2024, 23:59:59 UTC

      const result = formatDateForUTMify(date);

      expect(result).toBe("2024-12-31 23:59:59");
    });

    it("should handle date string with timezone", () => {
      const dateString = "2024-06-15T10:30:00-03:00"; // 10:30 in -03:00 = 13:30 UTC

      const result = formatDateForUTMify(dateString);

      expect(result).toBe("2024-06-15 13:30:00");
    });
  });

  // ========== CONVERT TO CENTS ==========

  describe("convertToCents", () => {
    it("should convert whole numbers", () => {
      expect(convertToCents(100)).toBe(10000);
      expect(convertToCents(1)).toBe(100);
      expect(convertToCents(0)).toBe(0);
    });

    it("should convert decimal values", () => {
      expect(convertToCents(99.99)).toBe(9999);
      expect(convertToCents(19.50)).toBe(1950);
      expect(convertToCents(0.99)).toBe(99);
    });

    it("should round correctly", () => {
      // Floating point precision issues should be handled
      expect(convertToCents(29.99)).toBe(2999);
      expect(convertToCents(0.01)).toBe(1);
      expect(convertToCents(0.001)).toBe(0); // Rounds down
    });

    it("should handle small values", () => {
      expect(convertToCents(0.1)).toBe(10);
      expect(convertToCents(0.05)).toBe(5);
    });

    it("should handle large values", () => {
      expect(convertToCents(9999.99)).toBe(999999);
      expect(convertToCents(10000)).toBe(1000000);
    });

    it("should handle negative values", () => {
      expect(convertToCents(-10)).toBe(-1000);
      expect(convertToCents(-99.99)).toBe(-9999);
    });
  });
});
