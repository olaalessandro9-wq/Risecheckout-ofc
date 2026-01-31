/**
 * @file validators-full.test.ts
 * @description Tests for Full Validation Functions
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
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

describe("validators - Full Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
