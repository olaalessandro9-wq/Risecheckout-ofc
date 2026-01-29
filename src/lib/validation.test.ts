/**
 * Validation Library Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Comprehensive tests for masks, validations, and helpers.
 * Covers all edge cases, invalid inputs, and boundary conditions.
 * 
 * @module lib/validation.test
 */

import { describe, it, expect } from "vitest";
import {
  // Masks
  maskCPF,
  maskCNPJ,
  maskPhone,
  maskName,
  maskDocument,
  unmask,
  // Validations
  validateCPF,
  validateCNPJ,
  validatePhone,
  validateEmail,
  validateName,
  validatePassword,
  validateDocument,
  // Helpers
  detectDocumentType,
  // Constants
  ERROR_MESSAGES,
} from "./validation";

// ============================================================================
// MASK TESTS
// ============================================================================

describe("Mask Functions", () => {
  // --------------------------------------------------------------------------
  // maskCPF
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // maskCNPJ
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // maskPhone
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // maskName
  // --------------------------------------------------------------------------
  describe("maskName", () => {
    it("should return empty string for empty input", () => {
      expect(maskName("")).toBe("");
    });

    it("should allow letters and spaces", () => {
      expect(maskName("João Silva")).toBe("João Silva");
    });

    it("should allow accented characters", () => {
      expect(maskName("José Müller Çağlar")).toBe("José Müller Çağlar");
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

  // --------------------------------------------------------------------------
  // unmask
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // maskDocument (CPF/CNPJ auto-detect)
  // --------------------------------------------------------------------------
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

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe("Validation Functions", () => {
  // --------------------------------------------------------------------------
  // validateCPF
  // --------------------------------------------------------------------------
  describe("validateCPF", () => {
    // Valid CPFs (real algorithm validation)
    const validCPFs = [
      "529.982.247-25",
      "52998224725",
      "111.444.777-35",
      "11144477735",
    ];

    // Invalid CPFs
    const invalidCPFs = [
      "000.000.000-00", // All same digit
      "111.111.111-11",
      "222.222.222-22",
      "123.456.789-00", // Wrong check digits
      "123.456.789-10",
      "12345678",       // Too short
      "1234567890123",  // Too long
    ];

    it.each(validCPFs)("should validate valid CPF: %s", (cpf) => {
      expect(validateCPF(cpf)).toBe(true);
    });

    it.each(invalidCPFs)("should reject invalid CPF: %s", (cpf) => {
      expect(validateCPF(cpf)).toBe(false);
    });

    it("should reject empty string", () => {
      expect(validateCPF("")).toBe(false);
    });

    it("should reject CPF with all same digits", () => {
      for (let i = 0; i <= 9; i++) {
        const sameCPF = String(i).repeat(11);
        expect(validateCPF(sameCPF)).toBe(false);
      }
    });
  });

  // --------------------------------------------------------------------------
  // validateCNPJ
  // --------------------------------------------------------------------------
  describe("validateCNPJ", () => {
    // Valid CNPJs (real algorithm validation)
    const validCNPJs = [
      "11.222.333/0001-81",
      "11222333000181",
      "45.997.418/0001-53",
      "45997418000153",
    ];

    // Invalid CNPJs
    const invalidCNPJs = [
      "00.000.000/0000-00", // All same digit
      "11.111.111/1111-11",
      "12.345.678/0001-00", // Wrong check digits
      "1234567800019",      // Too short (13 digits)
      "123456780001990",    // Too long (15 digits)
    ];

    it.each(validCNPJs)("should validate valid CNPJ: %s", (cnpj) => {
      expect(validateCNPJ(cnpj)).toBe(true);
    });

    it.each(invalidCNPJs)("should reject invalid CNPJ: %s", (cnpj) => {
      expect(validateCNPJ(cnpj)).toBe(false);
    });

    it("should reject empty string", () => {
      expect(validateCNPJ("")).toBe(false);
    });

    it("should reject CNPJ with all same digits", () => {
      for (let i = 0; i <= 9; i++) {
        const sameCNPJ = String(i).repeat(14);
        expect(validateCNPJ(sameCNPJ)).toBe(false);
      }
    });
  });

  // --------------------------------------------------------------------------
  // validatePhone
  // --------------------------------------------------------------------------
  describe("validatePhone", () => {
    // Valid phones
    const validPhones = [
      "(11) 98765-4321", // Mobile SP
      "11987654321",     // Mobile unmasked
      "(21) 3456-7890",  // Landline RJ
      "2134567890",      // Landline unmasked
      "(99) 99999-9999", // Max DDD mobile
    ];

    // Invalid phones
    const invalidPhones = [
      "(10) 98765-4321", // DDD < 11
      "(00) 98765-4321", // DDD = 00
      "123456789",       // Too short (9 digits)
      "123456789012",    // Too long (12 digits)
      "(11) 88765-4321", // 11 digits but 3rd not 9
    ];

    it.each(validPhones)("should validate valid phone: %s", (phone) => {
      expect(validatePhone(phone)).toBe(true);
    });

    it.each(invalidPhones)("should reject invalid phone: %s", (phone) => {
      expect(validatePhone(phone)).toBe(false);
    });

    it("should reject empty string", () => {
      expect(validatePhone("")).toBe(false);
    });

    it("should accept landline format (10 digits)", () => {
      expect(validatePhone("1134567890")).toBe(true);
    });

    it("should accept mobile format (11 digits starting with 9)", () => {
      expect(validatePhone("11987654321")).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // validateEmail
  // --------------------------------------------------------------------------
  describe("validateEmail", () => {
    // Valid emails
    const validEmails = [
      "test@example.com",
      "user.name@domain.org",
      "user-name@domain.co.uk",
      "user_name@domain.io",
      "user123@sub.domain.com",
    ];

    // Invalid emails
    const invalidEmails = [
      "",                    // Empty
      "notanemail",          // No @
      "@nodomain.com",       // No local part
      "no@",                 // No domain
      "no@domain",           // No TLD
      "no@domain.c",         // TLD too short
      "spa ces@domain.com",  // Spaces in local
      "no@doma in.com",      // Spaces in domain
    ];

    it.each(validEmails)("should validate valid email: %s", (email) => {
      expect(validateEmail(email)).toBe(true);
    });

    it.each(invalidEmails)("should reject invalid email: %s", (email) => {
      expect(validateEmail(email)).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // validateName
  // --------------------------------------------------------------------------
  describe("validateName", () => {
    it("should accept valid names", () => {
      expect(validateName("João")).toBe(true);
      expect(validateName("Maria Silva")).toBe(true);
      expect(validateName("José da Costa")).toBe(true);
    });

    it("should accept names with accents", () => {
      expect(validateName("José")).toBe(true);
      expect(validateName("Müller")).toBe(true);
      expect(validateName("François")).toBe(true);
    });

    it("should reject names shorter than 3 characters", () => {
      expect(validateName("")).toBe(false);
      expect(validateName("A")).toBe(false);
      expect(validateName("AB")).toBe(false);
    });

    it("should accept names with exactly 3 characters", () => {
      expect(validateName("Ana")).toBe(true);
    });

    it("should reject names with numbers", () => {
      expect(validateName("João123")).toBe(false);
      expect(validateName("Maria 2nd")).toBe(false);
    });

    it("should reject names with special characters", () => {
      expect(validateName("João@Silva")).toBe(false);
      expect(validateName("Maria!")).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // validatePassword
  // --------------------------------------------------------------------------
  describe("validatePassword", () => {
    it("should accept passwords with 6+ characters", () => {
      expect(validatePassword("123456")).toBe(true);
      expect(validatePassword("abcdef")).toBe(true);
      expect(validatePassword("pass12")).toBe(true);
    });

    it("should reject passwords shorter than 6 characters", () => {
      expect(validatePassword("")).toBe(false);
      expect(validatePassword("12345")).toBe(false);
      expect(validatePassword("abcde")).toBe(false);
    });

    it("should accept exactly 6 characters", () => {
      expect(validatePassword("abcdef")).toBe(true);
    });

    it("should accept special characters", () => {
      expect(validatePassword("p@ss!#")).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // validateDocument (CPF/CNPJ auto-detect)
  // --------------------------------------------------------------------------
  describe("validateDocument", () => {
    it("should validate CPF when <= 11 digits", () => {
      expect(validateDocument("529.982.247-25")).toBe(true);
      expect(validateDocument("52998224725")).toBe(true);
    });

    it("should validate CNPJ when > 11 digits", () => {
      expect(validateDocument("11.222.333/0001-81")).toBe(true);
      expect(validateDocument("11222333000181")).toBe(true);
    });

    it("should reject invalid CPF", () => {
      expect(validateDocument("123.456.789-00")).toBe(false);
    });

    it("should reject invalid CNPJ", () => {
      expect(validateDocument("12.345.678/0001-00")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(validateDocument("")).toBe(false);
    });
  });
});

// ============================================================================
// HELPER FUNCTION TESTS
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
