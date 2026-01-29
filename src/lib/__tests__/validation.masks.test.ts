/**
 * Validation Library - Mask Functions Unit Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for all mask functions: CPF, CNPJ, Phone, Name, Document, and unmask.
 * Single Responsibility: Only mask transformation tests.
 *
 * @module lib/__tests__/validation.masks.test
 */

import { describe, it, expect } from "vitest";
import {
  maskCPF,
  maskCNPJ,
  maskPhone,
  maskName,
  maskDocument,
  unmask,
} from "../validation";

// ============================================================================
// MASK CPF TESTS
// ============================================================================

describe("Mask Functions", () => {
  describe("maskCPF", () => {
    it("should return empty string for empty input", () => {
      expect(maskCPF("")).toBe("");
    });

    it("should return digits only for 1-3 digits", () => {
      expect(maskCPF("1")).toBe("1");
      expect(maskCPF("12")).toBe("12");
      expect(maskCPF("123")).toBe("123");
    });

    it("should add first dot after 3 digits", () => {
      expect(maskCPF("1234")).toBe("123.4");
      expect(maskCPF("12345")).toBe("123.45");
      expect(maskCPF("123456")).toBe("123.456");
    });

    it("should add second dot after 6 digits", () => {
      expect(maskCPF("1234567")).toBe("123.456.7");
      expect(maskCPF("12345678")).toBe("123.456.78");
      expect(maskCPF("123456789")).toBe("123.456.789");
    });

    it("should add dash after 9 digits", () => {
      expect(maskCPF("1234567890")).toBe("123.456.789-0");
      expect(maskCPF("12345678901")).toBe("123.456.789-01");
    });

    it("should limit to 11 digits", () => {
      expect(maskCPF("123456789012345")).toBe("123.456.789-01");
    });

    it("should strip non-numeric characters from input", () => {
      expect(maskCPF("123.456.789-01")).toBe("123.456.789-01");
      expect(maskCPF("abc123def456")).toBe("123.456");
    });

    it("should handle already formatted CPF", () => {
      expect(maskCPF("123.456.789-01")).toBe("123.456.789-01");
    });
  });

  // ==========================================================================
  // MASK CNPJ TESTS
  // ==========================================================================

  describe("maskCNPJ", () => {
    it("should return empty string for empty input", () => {
      expect(maskCNPJ("")).toBe("");
    });

    it("should return digits only for 1-2 digits", () => {
      expect(maskCNPJ("1")).toBe("1");
      expect(maskCNPJ("12")).toBe("12");
    });

    it("should add first dot after 2 digits", () => {
      expect(maskCNPJ("123")).toBe("12.3");
      expect(maskCNPJ("12345")).toBe("12.345");
    });

    it("should add second dot after 5 digits", () => {
      expect(maskCNPJ("123456")).toBe("12.345.6");
      expect(maskCNPJ("12345678")).toBe("12.345.678");
    });

    it("should add slash after 8 digits", () => {
      expect(maskCNPJ("123456780")).toBe("12.345.678/0");
      expect(maskCNPJ("123456780001")).toBe("12.345.678/0001");
    });

    it("should add dash after 12 digits", () => {
      expect(maskCNPJ("1234567800019")).toBe("12.345.678/0001-9");
      expect(maskCNPJ("12345678000199")).toBe("12.345.678/0001-99");
    });

    it("should limit to 14 digits", () => {
      expect(maskCNPJ("1234567800019999999")).toBe("12.345.678/0001-99");
    });

    it("should strip non-numeric characters from input", () => {
      expect(maskCNPJ("12.345.678/0001-99")).toBe("12.345.678/0001-99");
    });
  });

  // ==========================================================================
  // MASK PHONE TESTS
  // ==========================================================================

  describe("maskPhone", () => {
    it("should return empty string for empty input", () => {
      expect(maskPhone("")).toBe("");
    });

    it("should return digits only for 1-2 digits (DDD)", () => {
      expect(maskPhone("1")).toBe("1");
      expect(maskPhone("11")).toBe("11");
    });

    it("should add parentheses and space after DDD", () => {
      expect(maskPhone("119")).toBe("(11) 9");
      expect(maskPhone("11987")).toBe("(11) 987");
      expect(maskPhone("119876")).toBe("(11) 9876");
    });

    it("should add dash for landline (10 digits)", () => {
      expect(maskPhone("1134567890")).toBe("(11) 3456-7890");
    });

    it("should format mobile with 9 in front (11 digits)", () => {
      expect(maskPhone("11987654321")).toBe("(11) 98765-4321");
    });

    it("should limit to 11 digits", () => {
      expect(maskPhone("1198765432199999")).toBe("(11) 98765-4321");
    });

    it("should strip non-numeric characters from input", () => {
      expect(maskPhone("(11) 98765-4321")).toBe("(11) 98765-4321");
    });
  });

  // ==========================================================================
  // MASK NAME TESTS
  // ==========================================================================

  describe("maskName", () => {
    it("should return empty string for empty input", () => {
      expect(maskName("")).toBe("");
    });

    it("should allow letters and spaces", () => {
      expect(maskName("João Silva")).toBe("João Silva");
    });

    it("should allow accented characters", () => {
      expect(maskName("José Müller Çàéíóú")).toBe("José Müller Çàéíóú");
    });

    it("should strip numbers", () => {
      expect(maskName("João123Silva")).toBe("JoãoSilva");
    });

    it("should strip special characters", () => {
      expect(maskName("João@Silva#Teste!")).toBe("JoãoSilvaTeste");
    });

    it("should preserve multiple spaces", () => {
      expect(maskName("João  da  Silva")).toBe("João  da  Silva");
    });
  });

  // ==========================================================================
  // UNMASK TESTS
  // ==========================================================================

  describe("unmask", () => {
    it("should return empty string for empty input", () => {
      expect(unmask("")).toBe("");
    });

    it("should remove all non-numeric characters", () => {
      expect(unmask("123.456.789-01")).toBe("12345678901");
      expect(unmask("(11) 98765-4321")).toBe("11987654321");
      expect(unmask("12.345.678/0001-99")).toBe("12345678000199");
    });

    it("should return only digits from mixed input", () => {
      expect(unmask("abc123def456")).toBe("123456");
    });

    it("should handle strings with no digits", () => {
      expect(unmask("abcdef")).toBe("");
    });
  });

  // ==========================================================================
  // MASK DOCUMENT (AUTO-DETECT CPF/CNPJ) TESTS
  // ==========================================================================

  describe("maskDocument", () => {
    it("should mask as CPF for <= 11 digits", () => {
      expect(maskDocument("12345678901")).toBe("123.456.789-01");
    });

    it("should mask as CNPJ for > 11 digits", () => {
      expect(maskDocument("12345678000199")).toBe("12.345.678/0001-99");
    });

    it("should handle partial CPF", () => {
      expect(maskDocument("123456")).toBe("123.456");
    });

    it("should handle partial CNPJ", () => {
      expect(maskDocument("123456789012")).toBe("12.345.678/9012");
    });
  });
});
