/**
 * useFormValidation - Phone Validation Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - Modularized Tests
 * @see src/hooks/useFormValidation.ts
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormValidation } from "../useFormValidation";

describe("useFormValidation - Phone Field", () => {
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

  it("should return correct maxLength for phone", () => {
    const { result } = renderHook(() => useFormValidation("phone", true));
    expect(result.current.maxLength).toBe(15);
  });
});
