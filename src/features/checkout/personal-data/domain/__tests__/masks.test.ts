/**
 * @file masks.test.ts
 * @description Tests for Personal Data Masks
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  maskPersonalField,
  getFieldMaxLength,
  getFieldPlaceholder,
  getFieldLabel,
  getFieldInputType,
  getFieldAutocomplete,
} from "../masks";
import type { PersonalDataField } from "../../types";

// Mock @/lib/validation
vi.mock("@/lib/validation", () => ({
  maskName: vi.fn((value: string) => {
    return value
      .replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
      .replace(/\s+/g, " ")
      .trimStart();
  }),
  maskDocument: vi.fn((value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return cleaned
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }),
  maskPhone: vi.fn((value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      return cleaned
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return cleaned
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }),
}));

describe("masks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== maskPersonalField ==========

  describe("maskPersonalField", () => {
    describe("name masking", () => {
      it("should mask name by removing special characters", () => {
        const result = maskPersonalField("name", "João123 Silva");
        expect(result).toBe("João Silva");
      });

      it("should normalize multiple spaces", () => {
        const result = maskPersonalField("name", "João    Silva");
        expect(result).toBe("João Silva");
      });

      it("should trim leading spaces", () => {
        const result = maskPersonalField("name", "   João Silva");
        expect(result).toBe("João Silva");
      });
    });

    describe("cpf masking", () => {
      it("should mask CPF with 11 digits", () => {
        const result = maskPersonalField("cpf", "12345678901");
        expect(result).toBe("123.456.789-01");
      });

      it("should mask CNPJ with 14 digits", () => {
        const result = maskPersonalField("cpf", "12345678901234");
        expect(result).toBe("12.345.678/9012-34");
      });

      it("should handle partial CPF", () => {
        const result = maskPersonalField("cpf", "123456");
        expect(result).toBe("123.456");
      });
    });

    describe("phone masking", () => {
      it("should mask phone with 10 digits", () => {
        const result = maskPersonalField("phone", "1234567890");
        expect(result).toBe("(12) 3456-7890");
      });

      it("should mask phone with 11 digits", () => {
        const result = maskPersonalField("phone", "12345678901");
        expect(result).toBe("(12) 34567-8901");
      });

      it("should handle partial phone", () => {
        const result = maskPersonalField("phone", "12345");
        expect(result).toBe("(12) 345");
      });
    });

    describe("email masking", () => {
      it("should not mask email", () => {
        const result = maskPersonalField("email", "test@example.com");
        expect(result).toBe("test@example.com");
      });
    });
  });

  // ========== getFieldMaxLength ==========

  describe("getFieldMaxLength", () => {
    it("should return 18 for cpf field", () => {
      expect(getFieldMaxLength("cpf")).toBe(18);
    });

    it("should return 15 for phone field", () => {
      expect(getFieldMaxLength("phone")).toBe(15);
    });

    it("should return undefined for name field", () => {
      expect(getFieldMaxLength("name")).toBeUndefined();
    });

    it("should return undefined for email field", () => {
      expect(getFieldMaxLength("email")).toBeUndefined();
    });
  });

  // ========== getFieldPlaceholder ==========

  describe("getFieldPlaceholder", () => {
    it("should return correct placeholder for name", () => {
      expect(getFieldPlaceholder("name")).toBe("Digite seu nome completo");
    });

    it("should return correct placeholder for email", () => {
      expect(getFieldPlaceholder("email")).toBe("Digite seu email");
    });

    it("should return correct placeholder for cpf", () => {
      expect(getFieldPlaceholder("cpf")).toBe(
        "000.000.000-00 ou 00.000.000/0000-00"
      );
    });

    it("should return correct placeholder for phone", () => {
      expect(getFieldPlaceholder("phone")).toBe("(00) 00000-0000");
    });
  });

  // ========== getFieldLabel ==========

  describe("getFieldLabel", () => {
    it("should return correct label for name", () => {
      expect(getFieldLabel("name")).toBe("Nome completo");
    });

    it("should return correct label for email", () => {
      expect(getFieldLabel("email")).toBe("Email");
    });

    it("should return correct label for cpf", () => {
      expect(getFieldLabel("cpf")).toBe("CPF/CNPJ");
    });

    it("should return correct label for phone", () => {
      expect(getFieldLabel("phone")).toBe("Celular");
    });
  });

  // ========== getFieldInputType ==========

  describe("getFieldInputType", () => {
    it("should return 'email' for email field", () => {
      expect(getFieldInputType("email")).toBe("email");
    });

    it("should return 'tel' for phone field", () => {
      expect(getFieldInputType("phone")).toBe("tel");
    });

    it("should return 'text' for name field", () => {
      expect(getFieldInputType("name")).toBe("text");
    });

    it("should return 'text' for cpf field", () => {
      expect(getFieldInputType("cpf")).toBe("text");
    });
  });

  // ========== getFieldAutocomplete ==========

  describe("getFieldAutocomplete", () => {
    it("should return 'name' for name field", () => {
      expect(getFieldAutocomplete("name")).toBe("name");
    });

    it("should return 'email' for email field", () => {
      expect(getFieldAutocomplete("email")).toBe("email");
    });

    it("should return 'tel' for phone field", () => {
      expect(getFieldAutocomplete("phone")).toBe("tel");
    });

    it("should return 'off' for cpf field", () => {
      expect(getFieldAutocomplete("cpf")).toBe("off");
    });
  });

  // ========== Edge Cases ==========

  describe("Edge Cases", () => {
    it("should handle empty string for all mask functions", () => {
      expect(maskPersonalField("name", "")).toBe("");
      expect(maskPersonalField("email", "")).toBe("");
      expect(maskPersonalField("cpf", "")).toBe("");
      expect(maskPersonalField("phone", "")).toBe("");
    });

    it("should handle unknown field type gracefully", () => {
      const unknownField = "unknown" as PersonalDataField;
      expect(maskPersonalField(unknownField, "test")).toBe("test");
      expect(getFieldMaxLength(unknownField)).toBeUndefined();
      expect(getFieldPlaceholder(unknownField)).toBe("");
      expect(getFieldLabel(unknownField)).toBe("");
      expect(getFieldInputType(unknownField)).toBe("text");
      expect(getFieldAutocomplete(unknownField)).toBe("off");
    });
  });
});
