/**
 * @file useAsaasDisconnect.test.ts
 * @description Tests for useAsaasDisconnect hook
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

import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { disconnectAsaas } from "../../api";
import { useAsaasDisconnect } from "../../hooks";

describe("useAsaasDisconnect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Disconnect Flow", () => {
    it("should disconnect successfully", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: { id: "user-123" },
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      vi.mocked(disconnectAsaas).mockResolvedValueOnce({
        success: true,
      });

      const { result } = renderHook(() => useAsaasDisconnect());

      let disconnectResult: Awaited<
        ReturnType<typeof result.current.disconnect>
      >;

      await act(async () => {
        disconnectResult = await result.current.disconnect();
      });

      expect(disconnectResult!.success).toBe(true);
    });

    it("should return error when no user", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: null,
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      const { result } = renderHook(() => useAsaasDisconnect());

      let disconnectResult: Awaited<
        ReturnType<typeof result.current.disconnect>
      >;

      await act(async () => {
        disconnectResult = await result.current.disconnect();
      });

      expect(disconnectResult!.success).toBe(false);
      expect(disconnectResult!.error).toBe("Usuário não autenticado");
    });

    it("should show disconnecting state", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: { id: "user-123" },
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      let resolveDisconnect: (value: { success: boolean }) => void;

      vi.mocked(disconnectAsaas).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveDisconnect = resolve;
        })
      );

      const { result } = renderHook(() => useAsaasDisconnect());

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isDisconnecting).toBe(true);

      await act(async () => {
        resolveDisconnect!({ success: true });
      });

      await waitFor(() => {
        expect(result.current.isDisconnecting).toBe(false);
      });
    });
  });
});
