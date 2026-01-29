/**
 * useFormValidation - CPF Validation Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - Modularized Tests
 * @see src/hooks/useFormValidation.ts
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormValidation } from "../useFormValidation";

describe("useFormValidation - CPF Field", () => {
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
      result.current.setValue("123.456.789-09");
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

  it("should return correct maxLength for CPF", () => {
    const { result } = renderHook(() => useFormValidation("cpf", true));
    expect(result.current.maxLength).toBe(14);
  });
});
