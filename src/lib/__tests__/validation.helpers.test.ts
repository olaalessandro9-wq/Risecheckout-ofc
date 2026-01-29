/**
 * Validation Library - Helpers, Constants & Security Unit Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for helper functions, ERROR_MESSAGES constants, and edge cases.
 * Single Responsibility: Only helper/utility/security tests.
 *
 * @module lib/__tests__/validation.helpers.test
 */

import { describe, it, expect } from "vitest";
import {
  detectDocumentType,
  maskCPF,
  maskPhone,
  maskName,
  unmask,
  ERROR_MESSAGES,
} from "../validation";

// ============================================================================
// HELPER FUNCTIONS TESTS
// ============================================================================

describe("Helper Functions", () => {
  describe("detectDocumentType", () => {
    it("should detect CPF for <= 11 digits", () => {
      expect(detectDocumentType("123")).toBe("cpf");
      expect(detectDocumentType("12345678901")).toBe("cpf");
      expect(detectDocumentType("123.456.789-01")).toBe("cpf");
    });

    it("should detect CNPJ for 12-14 digits", () => {
      expect(detectDocumentType("123456789012")).toBe("cnpj");
      expect(detectDocumentType("12345678901234")).toBe("cnpj");
      expect(detectDocumentType("12.345.678/0001-99")).toBe("cnpj");
    });

    it("should return null for > 14 digits", () => {
      expect(detectDocumentType("123456789012345")).toBe(null);
    });

    it("should handle empty string as CPF", () => {
      expect(detectDocumentType("")).toBe("cpf");
    });
  });
});

// ============================================================================
// ERROR MESSAGES TESTS
// ============================================================================

describe("ERROR_MESSAGES", () => {
  it("should have all required error messages", () => {
    expect(ERROR_MESSAGES.cpf).toBeDefined();
    expect(ERROR_MESSAGES.cnpj).toBeDefined();
    expect(ERROR_MESSAGES.phone).toBeDefined();
    expect(ERROR_MESSAGES.email).toBeDefined();
    expect(ERROR_MESSAGES.name).toBeDefined();
    expect(ERROR_MESSAGES.password).toBeDefined();
    expect(ERROR_MESSAGES.required).toBeDefined();
  });

  it("should have meaningful error messages", () => {
    expect(ERROR_MESSAGES.cpf).toContain("CPF");
    expect(ERROR_MESSAGES.cnpj).toContain("CNPJ");
    expect(ERROR_MESSAGES.phone).toContain("Telefone");
    expect(ERROR_MESSAGES.email).toContain("Email");
    expect(ERROR_MESSAGES.name).toContain("Nome");
    expect(ERROR_MESSAGES.password).toContain("Senha");
    expect(ERROR_MESSAGES.required).toContain("obrigatório");
  });
});

// ============================================================================
// EDGE CASES & SECURITY TESTS
// ============================================================================

describe("Edge Cases & Security", () => {
  describe("XSS Prevention in masks", () => {
    it("should strip script tags from maskName", () => {
      const malicious = "<script>alert('xss')</script>";
      const result = maskName(malicious);
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });

    it("should strip HTML from maskName", () => {
      const html = "<b>Bold</b>";
      const result = maskName(html);
      expect(result).toBe("bBoldb");
    });
  });

  describe("Unicode handling", () => {
    it("should handle emoji in unmask", () => {
      expect(unmask("123🔥456")).toBe("123456");
    });

    it("should handle emoji in maskName", () => {
      expect(maskName("João 🔥")).toBe("João ");
    });
  });

  describe("Whitespace handling", () => {
    it("should handle leading/trailing spaces in unmask", () => {
      expect(unmask("  123  ")).toBe("123");
    });

    it("should preserve spaces in maskName", () => {
      expect(maskName("  João  ")).toBe("  João  ");
    });
  });

  describe("Null-like string handling", () => {
    it("should handle 'null' string in masks", () => {
      expect(maskCPF("null")).toBe("");
      expect(maskPhone("null")).toBe("");
    });

    it("should handle 'undefined' string in masks", () => {
      expect(maskCPF("undefined")).toBe("");
      expect(maskPhone("undefined")).toBe("");
    });
  });
});
