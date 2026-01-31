/**
 * @file useAsaasValidation.test.ts
 * @description Tests for useAsaasValidation hook
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// Setup mocks
vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: vi.fn(() => ({
    user: { id: "user-123" },
    isLoading: false,
  })),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("../../api", () => ({
  getAsaasSettings: vi.fn(),
  saveAsaasSettings: vi.fn(),
  validateAsaasCredentials: vi.fn(),
  disconnectAsaas: vi.fn(),
  isAsaasConnected: vi.fn(),
}));

import { validateAsaasCredentials } from "../../api";
import { useAsaasValidation } from "../../hooks";

describe("useAsaasValidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should start with null result", () => {
      const { result } = renderHook(() => useAsaasValidation());

      expect(result.current.lastResult).toBeNull();
      expect(result.current.isValidating).toBe(false);
    });
  });

  describe("Validation Flow", () => {
    it("should validate credentials successfully", async () => {
      vi.mocked(validateAsaasCredentials).mockResolvedValueOnce({
        valid: true,
        accountName: "Test Company",
        walletId: "wallet-123",
      });

      const { result } = renderHook(() => useAsaasValidation());

      let validationResult: Awaited<
        ReturnType<typeof result.current.validate>
      >;

      await act(async () => {
        validationResult = await result.current.validate(
          "$aact_prod_xxx",
          "production"
        );
      });

      expect(validationResult!.valid).toBe(true);
      expect(validationResult!.accountName).toBe("Test Company");
      expect(result.current.lastResult?.valid).toBe(true);
    });

    it("should return invalid for bad credentials", async () => {
      vi.mocked(validateAsaasCredentials).mockResolvedValueOnce({
        valid: false,
        message: "API key inválida",
      });

      const { result } = renderHook(() => useAsaasValidation());

      let validationResult: Awaited<
        ReturnType<typeof result.current.validate>
      >;

      await act(async () => {
        validationResult = await result.current.validate(
          "invalid",
          "production"
        );
      });

      expect(validationResult!.valid).toBe(false);
      expect(validationResult!.message).toBe("API key inválida");
    });

    it("should show pending state during validation", async () => {
      let resolveValidation: (value: { valid: boolean }) => void;

      vi.mocked(validateAsaasCredentials).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveValidation = resolve;
        })
      );

      const { result } = renderHook(() => useAsaasValidation());

      act(() => {
        result.current.validate("$aact_prod_xxx", "production");
      });

      expect(result.current.isValidating).toBe(true);

      await act(async () => {
        resolveValidation!({ valid: true });
      });

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      });
    });
  });
});
