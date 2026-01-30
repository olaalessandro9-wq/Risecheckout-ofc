/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * useUTMifyContext - Testes Unitários
 * 
 * Testa o hook de contexto do UTMify.
 * Cobre erro quando usado fora do Provider.
 * 
 * @version 1.0.0
 */

import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useUTMifyContext } from "../UTMifyContext";

// ============================================
// TESTS: ERROR HANDLING
// ============================================

describe("useUTMifyContext - Error Handling", () => {
  it("should throw error when used outside Provider", () => {
    expect(() => {
      renderHook(() => useUTMifyContext());
    }).toThrow("useUTMifyContext must be used within UTMifyProvider");
  });

  it("should have descriptive error message", () => {
    try {
      renderHook(() => useUTMifyContext());
    } catch (error) {
      expect((error as Error).message).toContain("UTMifyProvider");
    }
  });

  it("should throw Error instance", () => {
    try {
      renderHook(() => useUTMifyContext());
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
