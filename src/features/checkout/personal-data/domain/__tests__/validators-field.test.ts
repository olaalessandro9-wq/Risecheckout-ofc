/**
 * @file validators-field.test.ts
 * @description Tests for validateField Function
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateField } from "../validators";

// Mock @/lib/validation
vi.mock("@/lib/validation", () => ({
  validateName: vi.fn((value: string) => {
    const trimmed = value.trim();
    return trimmed.length >= 3 && trimmed.includes(" ");
  }),
  validateEmail: vi.fn((value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }),
  validateDocument: vi.fn((value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.length === 11 || cleaned.length === 14;
  }),
  validatePhone: vi.fn((value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.length === 10 || cleaned.length === 11;
  }),
  ERROR_MESSAGES: {
    required: "Campo obrigatório",
    name: "Nome inválido",
    email: "Email inválido",
    phone: "Telefone inválido",
  },
}));

describe("validators - validateField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("name validation", () => {
    it("should validate correct name", () => {
      const result = validateField("name", "João Silva");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should reject empty name", () => {
      const result = validateField("name", "");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Campo obrigatório");
    });

    it("should reject whitespace-only name", () => {
      const result = validateField("name", "   ");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Campo obrigatório");
    });

    it("should reject invalid name format", () => {
      const result = validateField("name", "Jo");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Nome inválido");
    });

    it("should trim name before validation", () => {
      const result = validateField("name", "  João Silva  ");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe("email validation", () => {
    it("should validate correct email", () => {
      const result = validateField("email", "test@example.com");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should reject empty email", () => {
      const result = validateField("email", "");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Campo obrigatório");
    });

    it("should reject invalid email format", () => {
      const result = validateField("email", "invalid-email");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Email inválido");
    });

    it("should trim email before validation", () => {
      const result = validateField("email", "  test@example.com  ");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe("cpf validation", () => {
    it("should validate correct CPF", () => {
      const result = validateField("cpf", "12345678901");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should validate correct CNPJ", () => {
      const result = validateField("cpf", "12345678901234");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should reject empty CPF", () => {
      const result = validateField("cpf", "");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Campo obrigatório");
    });

    it("should reject invalid CPF length", () => {
      const result = validateField("cpf", "123456");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("CPF/CNPJ inválido");
    });
  });

  describe("phone validation", () => {
    it("should validate correct phone with 10 digits", () => {
      const result = validateField("phone", "1234567890");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should validate correct phone with 11 digits", () => {
      const result = validateField("phone", "12345678901");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should reject empty phone", () => {
      const result = validateField("phone", "");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Campo obrigatório");
    });

    it("should reject invalid phone length", () => {
      const result = validateField("phone", "123456");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Telefone inválido");
    });
  });
});
