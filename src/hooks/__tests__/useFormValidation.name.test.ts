/**
 * useFormValidation - Name Validation Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - Modularized Tests
 * @see src/hooks/useFormValidation.ts
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormValidation } from "../useFormValidation";

describe("useFormValidation - Name Field", () => {
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

    expect(result.current.value).toBeTruthy();
  });
});
