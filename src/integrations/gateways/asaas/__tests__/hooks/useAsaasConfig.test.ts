/**
 * @file useAsaasConfig.test.ts
 * @description Tests for useAsaasConfig hook
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
import { getAsaasSettings } from "../../api";
import { useAsaasConfig } from "../../hooks";

describe("useAsaasConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should start in loading state", () => {
      vi.mocked(getAsaasSettings).mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useAsaasConfig());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.config).toBeNull();
    });

    it("should return null config when no user", () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: null,
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      const { result } = renderHook(() => useAsaasConfig());

      expect(result.current.config).toBeNull();
    });
  });

  describe("Success States", () => {
    it("should return config data on success", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: { id: "user-123" },
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      vi.mocked(getAsaasSettings).mockResolvedValueOnce({
        api_key: "hidden",
        environment: "production",
        wallet_id: "wallet-123",
        account_name: "Test Account",
      });

      const { result } = renderHook(() => useAsaasConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.config?.isConfigured).toBe(true);
      expect(result.current.config?.environment).toBe("production");
    });

    it("should handle sandbox environment", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: { id: "user-123" },
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      vi.mocked(getAsaasSettings).mockResolvedValueOnce({
        api_key: "hidden",
        environment: "sandbox",
      });

      const { result } = renderHook(() => useAsaasConfig());

      await waitFor(() => {
        expect(result.current.config?.environment).toBe("sandbox");
      });
    });

    it("should return unconfigured state when no settings", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: { id: "user-123" },
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      vi.mocked(getAsaasSettings).mockResolvedValueOnce(null);

      const { result } = renderHook(() => useAsaasConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.config?.isConfigured).toBe(false);
    });
  });

  describe("Error States", () => {
    it("should handle API errors", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: { id: "user-123" },
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      vi.mocked(getAsaasSettings).mockRejectedValueOnce(
        new Error("API Error")
      );

      const { result } = renderHook(() => useAsaasConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Erro ao carregar configuração");
      expect(result.current.config).toBeNull();
    });
  });

  describe("Refetch Behavior", () => {
    it("should refetch when called", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: { id: "user-123" },
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      vi.mocked(getAsaasSettings)
        .mockResolvedValueOnce({
          api_key: "hidden",
          environment: "sandbox",
        })
        .mockResolvedValueOnce({
          api_key: "hidden",
          environment: "production",
        });

      const { result } = renderHook(() => useAsaasConfig());

      await waitFor(() => {
        expect(result.current.config?.environment).toBe("sandbox");
      });

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.config?.environment).toBe("production");
      });

      expect(getAsaasSettings).toHaveBeenCalledTimes(2);
    });
  });
});
