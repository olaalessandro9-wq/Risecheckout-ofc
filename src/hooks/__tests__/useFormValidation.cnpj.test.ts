/**
 * useFormValidation - CNPJ Validation Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - Modularized Tests
 * @see src/hooks/useFormValidation.ts
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormValidation } from "../useFormValidation";

describe("useFormValidation - CNPJ Field", () => {
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

  it("should return correct maxLength for CNPJ", () => {
    const { result } = renderHook(() => useFormValidation("cnpj", true));
    expect(result.current.maxLength).toBe(18);
  });
});
