/**
 * useFormValidation - State Management Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - Modularized Tests
 * @see src/hooks/useFormValidation.ts
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormValidation } from "../useFormValidation";

describe("useFormValidation - State Management", () => {
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

  it("should return undefined maxLength for text", () => {
    const { result } = renderHook(() => useFormValidation("text", true));
    expect(result.current.maxLength).toBeUndefined();
  });
});
