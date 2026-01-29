/**
 * useFormValidation - Document (CPF/CNPJ) Validation Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - Modularized Tests
 * @see src/hooks/useFormValidation.ts
 */

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFormValidation } from "../useFormValidation";

describe("useFormValidation - Document Field", () => {
  it("should return correct maxLength for document", () => {
    const { result } = renderHook(() => useFormValidation("document", true));
    expect(result.current.maxLength).toBe(18);
  });
});
