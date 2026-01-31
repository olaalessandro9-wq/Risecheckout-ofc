/**
 * @file useAsaasSaveConfig.test.ts
 * @description Tests for useAsaasSaveConfig hook
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
import { saveAsaasSettings } from "../../api";
import { useAsaasSaveConfig } from "../../hooks";

describe("useAsaasSaveConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Save Flow", () => {
    it("should save config successfully", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: { id: "user-123" },
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      vi.mocked(saveAsaasSettings).mockResolvedValueOnce({
        success: true,
      });

      const { result } = renderHook(() => useAsaasSaveConfig());

      let saveResult: Awaited<ReturnType<typeof result.current.save>>;

      await act(async () => {
        saveResult = await result.current.save({
          api_key: "$aact_prod_xxx",
          environment: "production",
        });
      });

      expect(saveResult!.success).toBe(true);
    });

    it("should return error when no user", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: null,
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      const { result } = renderHook(() => useAsaasSaveConfig());

      let saveResult: Awaited<ReturnType<typeof result.current.save>>;

      await act(async () => {
        saveResult = await result.current.save({
          api_key: "$aact_prod_xxx",
          environment: "production",
        });
      });

      expect(saveResult!.success).toBe(false);
      expect(saveResult!.error).toBe("Usuário não autenticado");
    });

    it("should show saving state during save", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: { id: "user-123" },
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      let resolveSave: (value: { success: boolean }) => void;

      vi.mocked(saveAsaasSettings).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSave = resolve;
        })
      );

      const { result } = renderHook(() => useAsaasSaveConfig());

      act(() => {
        result.current.save({
          api_key: "$aact_prod_xxx",
          environment: "production",
        });
      });

      expect(result.current.isSaving).toBe(true);

      await act(async () => {
        resolveSave!({ success: true });
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });
    });
  });
});
