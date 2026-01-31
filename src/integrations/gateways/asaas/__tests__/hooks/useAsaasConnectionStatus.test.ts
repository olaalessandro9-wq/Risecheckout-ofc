/**
 * @file useAsaasConnectionStatus.test.ts
 * @description Tests for useAsaasConnectionStatus hook
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
import { isAsaasConnected } from "../../api";
import { useAsaasConnectionStatus } from "../../hooks";

describe("useAsaasConnectionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Connection Status", () => {
    it("should return connected when connected", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: { id: "user-123" },
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      vi.mocked(isAsaasConnected).mockResolvedValueOnce(true);

      const { result } = renderHook(() => useAsaasConnectionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isConnected).toBe(true);
    });

    it("should return disconnected when not connected", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: { id: "user-123" },
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      vi.mocked(isAsaasConnected).mockResolvedValueOnce(false);

      const { result } = renderHook(() => useAsaasConnectionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isConnected).toBe(false);
    });

    it("should return disconnected when no user", () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: null,
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      const { result } = renderHook(() => useAsaasConnectionStatus());

      expect(result.current.isConnected).toBe(false);
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: { id: "user-123" },
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      vi.mocked(isAsaasConnected).mockRejectedValueOnce(
        new Error("API Error")
      );

      const { result } = renderHook(() => useAsaasConnectionStatus());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isConnected).toBe(false);
    });

    it("should refetch status when called", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        user: { id: "user-123" },
        isLoading: false,
      } as ReturnType<typeof useUnifiedAuth>);

      vi.mocked(isAsaasConnected)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const { result } = renderHook(() => useAsaasConnectionStatus());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });
  });
});
