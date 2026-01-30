/**
 * useAffiliations - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests affiliate management hook with API mocking.
 * 
 * @module hooks/__tests__/useAffiliations.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAffiliations, Affiliation } from "../useAffiliations";

// Mock dependencies
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockApiCall = vi.fn();
vi.mock("@/lib/api", () => ({
  api: {
    call: (...args: unknown[]) => mockApiCall(...args),
  },
}));

// Mock useUnifiedAuth
const mockUser = { id: "user-123" };
let mockIsAuthenticated = true;

vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: () => ({
    user: mockUser,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

const mockAffiliations: Affiliation[] = [
  {
    id: "aff-1",
    commission_rate: 10,
    status: "active",
    created_at: "2024-01-01",
    affiliate_code: "CODE1",
    product: { id: "prod-1", name: "Product 1" },
  },
  {
    id: "aff-2",
    commission_rate: 15,
    status: "pending",
    created_at: "2024-01-02",
    affiliate_code: "CODE2",
    product: { id: "prod-2", name: "Product 2" },
  },
];

describe("useAffiliations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
  });

  describe("initial fetch", () => {
    it("should fetch affiliations on mount", async () => {
      mockApiCall.mockResolvedValueOnce({
        data: { affiliations: mockAffiliations },
        error: null,
      });

      const { result } = renderHook(() => useAffiliations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiCall).toHaveBeenCalledWith("get-my-affiliations", {});
      expect(result.current.affiliations).toEqual(mockAffiliations);
    });

    it("should set empty array when not authenticated", async () => {
      mockIsAuthenticated = false;

      const { result } = renderHook(() => useAffiliations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.affiliations).toEqual([]);
      expect(mockApiCall).not.toHaveBeenCalled();
    });

    it("should handle API error", async () => {
      mockApiCall.mockResolvedValueOnce({
        data: null,
        error: new Error("Network error"),
      });

      const { result } = renderHook(() => useAffiliations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Erro ao carregar suas afiliações.");
    });

    it("should handle error in response data", async () => {
      mockApiCall.mockResolvedValueOnce({
        data: { error: "Server error" },
        error: null,
      });

      const { result } = renderHook(() => useAffiliations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Erro ao carregar suas afiliações.");
    });
  });

  describe("refetch", () => {
    it("should refetch affiliations", async () => {
      mockApiCall.mockResolvedValue({
        data: { affiliations: mockAffiliations },
        error: null,
      });

      const { result } = renderHook(() => useAffiliations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockApiCall).toHaveBeenCalledTimes(2);
    });
  });

  describe("cancelAffiliation", () => {
    it("should cancel affiliation successfully", async () => {
      mockApiCall
        .mockResolvedValueOnce({
          data: { affiliations: mockAffiliations },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {},
          error: null,
        });

      const { result } = renderHook(() => useAffiliations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.cancelAffiliation("aff-1");
      });

      expect(success!).toBe(true);
      expect(mockApiCall).toHaveBeenCalledWith("update-affiliate-settings", {
        action: "cancel_affiliation",
        affiliate_id: "aff-1",
      });

      // Check local state updated
      expect(result.current.affiliations[0].status).toBe("cancelled");
    });

    it("should handle cancel error from API", async () => {
      mockApiCall
        .mockResolvedValueOnce({
          data: { affiliations: mockAffiliations },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: new Error("Cancel failed"),
        });

      const { result } = renderHook(() => useAffiliations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.cancelAffiliation("aff-1");
      });

      expect(success!).toBe(false);
    });

    it("should handle cancel error in response", async () => {
      mockApiCall
        .mockResolvedValueOnce({
          data: { affiliations: mockAffiliations },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { error: "Not allowed" },
          error: null,
        });

      const { result } = renderHook(() => useAffiliations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.cancelAffiliation("aff-1");
      });

      expect(success!).toBe(false);
    });
  });

  describe("loading states", () => {
    it("should start with isLoading true", () => {
      mockApiCall.mockResolvedValueOnce({
        data: { affiliations: [] },
        error: null,
      });

      const { result } = renderHook(() => useAffiliations());
      expect(result.current.isLoading).toBe(true);
    });

    it("should set isLoading false after fetch", async () => {
      mockApiCall.mockResolvedValueOnce({
        data: { affiliations: [] },
        error: null,
      });

      const { result } = renderHook(() => useAffiliations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
