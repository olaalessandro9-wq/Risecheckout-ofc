/**
 * useResetPassword.test.ts
 * 
 * Tests for useResetPassword hook
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock dependencies
const mockSearchParams = new URLSearchParams();

vi.mock("react-router-dom", () => ({
  useSearchParams: () => [mockSearchParams, vi.fn()],
}));

vi.mock("@/lib/api", () => ({
  api: {
    publicCall: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

import { useResetPassword } from "../useResetPassword";
import { api } from "@/lib/api";

describe("useResetPassword", () => {
  const defaultConfig = {
    onSuccess: vi.fn(),
    apiEndpoint: "/api/reset",
    loginRoute: "/auth",
    recoveryRoute: "/recuperar-senha",
    brandDescription: "suas vendas",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("token");
  });

  it("should set invalid state when no token", async () => {
    const { result } = renderHook(() => useResetPassword(defaultConfig));

    await waitFor(() => {
      expect(result.current.viewState).toBe("invalid");
    });

    expect(result.current.errorMessage).toBe("Link inválido. Token não encontrado.");
  });

  it("should validate token on mount", async () => {
    mockSearchParams.set("token", "valid-token");

    vi.mocked(api.publicCall).mockResolvedValueOnce({
      data: { valid: true, email: "test@example.com" },
      error: null,
    });

    const { result } = renderHook(() => useResetPassword(defaultConfig));

    await waitFor(() => {
      expect(result.current.viewState).toBe("form");
    });

    expect(result.current.email).toBe("test@example.com");
  });

  it("should handle invalid token", async () => {
    mockSearchParams.set("token", "invalid-token");

    vi.mocked(api.publicCall).mockResolvedValueOnce({
      data: { valid: false, error: "Token expirado" },
      error: null,
    });

    const { result } = renderHook(() => useResetPassword(defaultConfig));

    await waitFor(() => {
      expect(result.current.viewState).toBe("invalid");
    });

    expect(result.current.errorMessage).toBe("Token expirado");
  });

  describe("handleSubmit", () => {
    beforeEach(() => {
      mockSearchParams.set("token", "valid-token");
    });

    it("should validate passwords match", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: { valid: true, email: "test@example.com" },
        error: null,
      });

      const { result } = renderHook(() => useResetPassword(defaultConfig));

      await waitFor(() => {
        expect(result.current.viewState).toBe("form");
      });

      act(() => {
        result.current.setPassword("password123");
        result.current.setConfirmPassword("different");
      });

      await act(async () => {
        const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        await result.current.handleSubmit(event);
      });

      expect(result.current.errorMessage).toBe("As senhas não coincidem");
    });

    it("should validate minimum password length", async () => {
      vi.mocked(api.publicCall).mockResolvedValueOnce({
        data: { valid: true, email: "test@example.com" },
        error: null,
      });

      const { result } = renderHook(() => useResetPassword(defaultConfig));

      await waitFor(() => {
        expect(result.current.viewState).toBe("form");
      });

      act(() => {
        result.current.setPassword("short");
        result.current.setConfirmPassword("short");
      });

      await act(async () => {
        const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        await result.current.handleSubmit(event);
      });

      expect(result.current.errorMessage).toBe("A senha deve ter no mínimo 8 caracteres");
    });

    it("should reset password successfully", async () => {
      vi.mocked(api.publicCall)
        .mockResolvedValueOnce({
          data: { valid: true, email: "test@example.com" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { success: true },
          error: null,
        });

      const { result } = renderHook(() => useResetPassword(defaultConfig));

      await waitFor(() => {
        expect(result.current.viewState).toBe("form");
      });

      act(() => {
        result.current.setPassword("newPassword123");
        result.current.setConfirmPassword("newPassword123");
      });

      await act(async () => {
        const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        await result.current.handleSubmit(event);
      });

      expect(result.current.viewState).toBe("success");
    });

    it("should handle reset error with validation", async () => {
      vi.mocked(api.publicCall)
        .mockResolvedValueOnce({
          data: { valid: true, email: "test@example.com" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            success: false,
            error: "Senha muito fraca",
            validation: {
              hasMinLength: true,
              hasUppercase: false,
              hasNumber: false,
            },
          },
          error: null,
        });

      const { result } = renderHook(() => useResetPassword(defaultConfig));

      await waitFor(() => {
        expect(result.current.viewState).toBe("form");
      });

      act(() => {
        result.current.setPassword("weakpassword");
        result.current.setConfirmPassword("weakpassword");
      });

      await act(async () => {
        const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;
        await result.current.handleSubmit(event);
      });

      expect(result.current.errorMessage).toBe("Senha muito fraca");
      expect(result.current.passwordValidation).toBeDefined();
    });
  });

  it("should toggle showPassword", async () => {
    const { result } = renderHook(() => useResetPassword(defaultConfig));

    expect(result.current.showPassword).toBe(false);

    act(() => {
      result.current.setShowPassword(true);
    });

    expect(result.current.showPassword).toBe(true);
  });
});
