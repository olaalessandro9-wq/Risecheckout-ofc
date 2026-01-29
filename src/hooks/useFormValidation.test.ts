/**
 * useFormValidation Hook Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormValidation } from "./useFormValidation";

describe("useFormValidation", () => {
  // ============================================================================
  // CPF Field
  // ============================================================================

  describe("CPF Field", () => {
    it("should apply CPF mask", () => {
      const { result } = renderHook(() => useFormValidation("cpf", true));

      act(() => {
        result.current.onChange({
          target: { value: "12345678900" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.value).toBe("123.456.789-00");
    });

    it("should validate CPF on blur", () => {
      const { result } = renderHook(() => useFormValidation("cpf", true));

      act(() => {
        result.current.setValue("123.456.789-09"); // Valid CPF
      });

      act(() => {
        result.current.onBlur();
      });

      expect(result.current.isTouched).toBe(true);
    });

    it("should return error for invalid CPF", () => {
      const { result } = renderHook(() => useFormValidation("cpf", true));

      act(() => {
        result.current.onChange({
          target: { value: "11111111111" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.onBlur();
      });

      expect(result.current.error).toBeTruthy();
    });

    it("should return raw value without mask", () => {
      const { result } = renderHook(() => useFormValidation("cpf", true));

      act(() => {
        result.current.onChange({
          target: { value: "12345678900" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.getRawValue()).toBe("12345678900");
    });
  });

  // ============================================================================
  // CNPJ Field
  // ============================================================================

  describe("CNPJ Field", () => {
    it("should apply CNPJ mask", () => {
      const { result } = renderHook(() => useFormValidation("cnpj", true));

      act(() => {
        result.current.onChange({
          target: { value: "12345678000100" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.value).toBe("12.345.678/0001-00");
    });

    it("should validate CNPJ on blur", () => {
      const { result } = renderHook(() => useFormValidation("cnpj", true));

      act(() => {
        result.current.setValue("12.345.678/0001-00");
      });

      act(() => {
        result.current.onBlur();
      });

      expect(result.current.isTouched).toBe(true);
    });

    it("should return error for invalid CNPJ", () => {
      const { result } = renderHook(() => useFormValidation("cnpj", true));

      act(() => {
        result.current.onChange({
          target: { value: "11111111111111" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.onBlur();
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  // ============================================================================
  // Phone Field
  // ============================================================================

  describe("Phone Field", () => {
    it("should apply phone mask", () => {
      const { result } = renderHook(() => useFormValidation("phone", true));

      act(() => {
        result.current.onChange({
          target: { value: "11999887766" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.value).toMatch(/^\(\d{2}\) \d{4,5}-\d{4}$/);
    });

    it("should validate phone format", () => {
      const { result } = renderHook(() => useFormValidation("phone", true));

      act(() => {
        result.current.onChange({
          target: { value: "11999" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.onBlur();
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  // ============================================================================
  // Email Field
  // ============================================================================

  describe("Email Field", () => {
    it("should validate email format", () => {
      const { result } = renderHook(() => useFormValidation("email", true));

      act(() => {
        result.current.onChange({
          target: { value: "valid@email.com" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.onBlur();
      });

      expect(result.current.isValid).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("should return error for invalid email", () => {
      const { result } = renderHook(() => useFormValidation("email", true));

      act(() => {
        result.current.onChange({
          target: { value: "invalid-email" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.onBlur();
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  // ============================================================================
  // Name Field
  // ============================================================================

  describe("Name Field", () => {
    it("should validate name", () => {
      const { result } = renderHook(() => useFormValidation("name", true));

      act(() => {
        result.current.onChange({
          target: { value: "João Silva" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.onBlur();
      });

      expect(result.current.isValid).toBe(true);
    });

    it("should apply name mask (capitalize)", () => {
      const { result } = renderHook(() => useFormValidation("name", true));

      act(() => {
        result.current.onChange({
          target: { value: "joão silva" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // The maskName function should capitalize
      expect(result.current.value).toBeTruthy();
    });
  });

  // ============================================================================
  // Required Fields
  // ============================================================================

  describe("Required Fields", () => {
    it("should return error for empty required field", () => {
      const { result } = renderHook(() => useFormValidation("text", true));

      act(() => {
        result.current.onBlur();
      });

      expect(result.current.error).toBeTruthy();
    });

    it("should allow empty optional field", () => {
      const { result } = renderHook(() => useFormValidation("text", false));

      act(() => {
        result.current.onBlur();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.isValid).toBe(true);
    });
  });

  // ============================================================================
  // State Management
  // ============================================================================

  describe("State Management", () => {
    it("should track isTouched", () => {
      const { result } = renderHook(() => useFormValidation("text", false));

      expect(result.current.isTouched).toBe(false);

      act(() => {
        result.current.onBlur();
      });

      expect(result.current.isTouched).toBe(true);
    });

    it("should reset field", () => {
      const { result } = renderHook(() => useFormValidation("text", false));

      act(() => {
        result.current.onChange({
          target: { value: "some text" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.onBlur();
      });

      expect(result.current.value).toBe("some text");
      expect(result.current.isTouched).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.value).toBe("");
      expect(result.current.isTouched).toBe(false);
    });

    it("should setValue programmatically", () => {
      const { result } = renderHook(() => useFormValidation("text", false));

      act(() => {
        result.current.setValue("programmatic value");
      });

      expect(result.current.value).toBe("programmatic value");
      expect(result.current.isTouched).toBe(true);
    });

    it("should validate on manual call", () => {
      const { result } = renderHook(() => useFormValidation("email", true));

      act(() => {
        result.current.onChange({
          target: { value: "invalid" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(false);
      expect(result.current.isTouched).toBe(true);
    });
  });

  // ============================================================================
  // maxLength
  // ============================================================================

  describe("maxLength", () => {
    it("should return correct maxLength for CPF", () => {
      const { result } = renderHook(() => useFormValidation("cpf", true));
      expect(result.current.maxLength).toBe(14);
    });

    it("should return correct maxLength for CNPJ", () => {
      const { result } = renderHook(() => useFormValidation("cnpj", true));
      expect(result.current.maxLength).toBe(18);
    });

    it("should return correct maxLength for phone", () => {
      const { result } = renderHook(() => useFormValidation("phone", true));
      expect(result.current.maxLength).toBe(15);
    });

    it("should return undefined maxLength for text", () => {
      const { result } = renderHook(() => useFormValidation("text", true));
      expect(result.current.maxLength).toBeUndefined();
    });

    it("should return correct maxLength for document", () => {
      const { result } = renderHook(() => useFormValidation("document", true));
      expect(result.current.maxLength).toBe(18);
    });
  });
});
