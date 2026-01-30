/**
 * useAffiliateRequest.test.ts
 * 
 * Tests for useAffiliateRequest hook
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock dependencies
vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: vi.fn(() => ({
    user: { id: "test-user-id" },
    isAuthenticated: true,
  })),
}));

vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

vi.mock("@/services/marketplace", () => ({
  checkAffiliationStatus: vi.fn(),
}));

vi.mock("@/hooks/useAffiliationStatusCache", () => ({
  useAffiliationStatusCache: vi.fn(() => ({
    updateStatus: vi.fn(),
  })),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

import { useAffiliateRequest } from "../useAffiliateRequest";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { api } from "@/lib/api";
import { checkAffiliationStatus } from "@/services/marketplace";

describe("useAffiliateRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useAffiliateRequest());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isCheckingStatus).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBeNull();
    expect(result.current.affiliationStatus).toBeNull();
  });

  describe("requestAffiliate", () => {
    it("should set error when not authenticated", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValueOnce({
        user: null,
        isAuthenticated: false,
      } as ReturnType<typeof useUnifiedAuth>);

      const { result } = renderHook(() => useAffiliateRequest());

      await act(async () => {
        await result.current.requestAffiliate("product-123");
      });

      expect(result.current.error).toBe("Você precisa estar logado para solicitar afiliação");
    });

    it("should successfully request affiliation", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          message: "Solicitação enviada",
          status: "pending",
          affiliationId: "aff-123",
        },
        error: null,
      });

      const { result } = renderHook(() => useAffiliateRequest());

      await act(async () => {
        await result.current.requestAffiliate("product-123");
      });

      expect(result.current.success).toBe("Solicitação enviada");
      expect(result.current.affiliationStatus?.status).toBe("pending");
      expect(result.current.error).toBeNull();
    });

    it("should handle API error", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { code: "RATE_LIMITED" as const, message: "Rate limit exceeded" },
      });

      const { result } = renderHook(() => useAffiliateRequest());

      await act(async () => {
        await result.current.requestAffiliate("product-123");
      });

      expect(result.current.error).toBe("Rate limit exceeded");
      expect(result.current.success).toBeNull();
    });

    it("should handle pending status from error message", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { code: "CONFLICT" as const, message: "Solicitação pendente já existe" },
      });

      const { result } = renderHook(() => useAffiliateRequest());

      await act(async () => {
        await result.current.requestAffiliate("product-123");
      });

      expect(result.current.affiliationStatus?.status).toBe("pending");
      expect(result.current.success).toBe("Você já possui uma solicitação pendente para este produto.");
    });

    it("should set active status when affiliate_code is returned", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          message: "Aprovado automaticamente",
          affiliate_code: "ABC123",
        },
        error: null,
      });

      const { result } = renderHook(() => useAffiliateRequest());

      await act(async () => {
        await result.current.requestAffiliate("product-123");
      });

      expect(result.current.affiliationStatus?.isAffiliate).toBe(true);
      expect(result.current.affiliationStatus?.status).toBe("active");
    });
  });

  describe("checkStatus", () => {
    it("should set not affiliated when no user", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValueOnce({
        user: null,
        isAuthenticated: false,
      } as ReturnType<typeof useUnifiedAuth>);

      const { result } = renderHook(() => useAffiliateRequest());

      await act(async () => {
        await result.current.checkStatus("product-123");
      });

      expect(result.current.affiliationStatus?.isAffiliate).toBe(false);
    });

    it("should fetch and set affiliation status", async () => {
      vi.mocked(checkAffiliationStatus).mockResolvedValueOnce({
        isAffiliate: true,
        status: "active",
        affiliationId: "aff-123",
      });

      const { result } = renderHook(() => useAffiliateRequest());

      await act(async () => {
        await result.current.checkStatus("product-123");
      });

      await waitFor(() => {
        expect(result.current.affiliationStatus?.isAffiliate).toBe(true);
      });
    });

    it("should handle error in checkStatus", async () => {
      vi.mocked(checkAffiliationStatus).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useAffiliateRequest());

      await act(async () => {
        await result.current.checkStatus("product-123");
      });

      expect(result.current.affiliationStatus?.isAffiliate).toBe(false);
    });
  });
});
