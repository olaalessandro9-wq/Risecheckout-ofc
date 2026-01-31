/**
 * @file validators.test.ts
 * @description Tests for Personal Data Validators
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateField,
  validatePersonalData,
  validateRequiredFields,
} from "../validators";
import type { PersonalData, RequiredFieldsConfig } from "../../types";

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

describe("validators", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== validateField ==========

  describe("validateField", () => {
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

  // ========== validatePersonalData ==========

  describe("validatePersonalData", () => {
    const requiredFieldsAll: RequiredFieldsConfig = {
      cpf: true,
      phone: true,
    };

    const requiredFieldsMinimal: RequiredFieldsConfig = {
      cpf: false,
      phone: false,
    };

    it("should validate complete valid data", () => {
      const data: PersonalData = {
        name: "João Silva",
        email: "joao@example.com",
        cpf: "12345678901",
        phone: "11987654321",
      };

      const result = validatePersonalData(data, requiredFieldsAll);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should validate minimal valid data", () => {
      const data: PersonalData = {
        name: "João Silva",
        email: "joao@example.com",
        cpf: "",
        phone: "",
      };

      const result = validatePersonalData(data, requiredFieldsMinimal);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should return errors for all invalid fields", () => {
      const data: PersonalData = {
        name: "",
        email: "invalid",
        cpf: "123",
        phone: "456",
      };

      const result = validatePersonalData(data, requiredFieldsAll);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty("name");
      expect(result.errors).toHaveProperty("email");
      expect(result.errors).toHaveProperty("cpf");
      expect(result.errors).toHaveProperty("phone");
    });

    it("should not require CPF when not configured", () => {
      const data: PersonalData = {
        name: "João Silva",
        email: "joao@example.com",
        cpf: "",
        phone: "11987654321",
      };

      const result = validatePersonalData(data, {
        cpf: false,
        phone: true,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).not.toHaveProperty("cpf");
    });

    it("should not require phone when not configured", () => {
      const data: PersonalData = {
        name: "João Silva",
        email: "joao@example.com",
        cpf: "12345678901",
        phone: "",
      };

      const result = validatePersonalData(data, {
        cpf: true,
        phone: false,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).not.toHaveProperty("phone");
    });
  });

  // ========== validateRequiredFields ==========

  describe("validateRequiredFields", () => {
    const requiredFieldsAll: RequiredFieldsConfig = {
      cpf: true,
      phone: true,
    };

    it("should return no errors for complete data", () => {
      const data: PersonalData = {
        name: "João Silva",
        email: "joao@example.com",
        cpf: "12345678901",
        phone: "11987654321",
      };

      const errors = validateRequiredFields(data, requiredFieldsAll);
      expect(errors).toEqual({});
    });

    it("should return error for missing name", () => {
      const data: PersonalData = {
        name: "",
        email: "joao@example.com",
        cpf: "12345678901",
        phone: "11987654321",
      };

      const errors = validateRequiredFields(data, requiredFieldsAll);
      expect(errors).toHaveProperty("name", "Campo obrigatório");
    });

    it("should return error for missing email", () => {
      const data: PersonalData = {
        name: "João Silva",
        email: "",
        cpf: "12345678901",
        phone: "11987654321",
      };

      const errors = validateRequiredFields(data, requiredFieldsAll);
      expect(errors).toHaveProperty("email", "Campo obrigatório");
    });

    it("should return error for missing CPF when required", () => {
      const data: PersonalData = {
        name: "João Silva",
        email: "joao@example.com",
        cpf: "",
        phone: "11987654321",
      };

      const errors = validateRequiredFields(data, requiredFieldsAll);
      expect(errors).toHaveProperty("cpf", "Campo obrigatório");
    });

    it("should not return error for missing CPF when not required", () => {
      const data: PersonalData = {
        name: "João Silva",
        email: "joao@example.com",
        cpf: "",
        phone: "11987654321",
      };

      const errors = validateRequiredFields(data, {
        cpf: false,
        phone: true,
      });

      expect(errors).not.toHaveProperty("cpf");
    });

    it("should handle whitespace-only values as empty", () => {
      const data: PersonalData = {
        name: "   ",
        email: "  ",
        cpf: "  ",
        phone: "  ",
      };

      const errors = validateRequiredFields(data, requiredFieldsAll);
      expect(errors).toHaveProperty("name");
      expect(errors).toHaveProperty("email");
      expect(errors).toHaveProperty("cpf");
      expect(errors).toHaveProperty("phone");
    });
  });
});
