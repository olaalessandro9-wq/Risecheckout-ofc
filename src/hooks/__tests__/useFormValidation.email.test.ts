/**
 * useFormValidation - Email Validation Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - Modularized Tests
 * @see src/hooks/useFormValidation.ts
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormValidation } from "../useFormValidation";

describe("useFormValidation - Email Field", () => {
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
