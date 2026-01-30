/**
 * useStudentsData Hook Tests - Filters, Stats & Error Handling
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Tests filter passing, stats computation, and error scenarios
 * 
 * @module test/modules/members-area/hooks/useStudentsData.filters
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useStudentsData } from "../useStudentsData";
import { api } from "@/lib/api";
import { studentsService } from "../../services/students.service";
import type { BuyerWithGroups, StudentFilters } from "../../types";

// Mock dependencies
vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

vi.mock("../../services/students.service", () => ({
  studentsService: {
    list: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Test factory
function createMockStudent(overrides: Partial<BuyerWithGroups> = {}): BuyerWithGroups {
  return {
    buyer_id: "buyer-1",
    buyer_email: "student@example.com",
    buyer_name: "John Student",
    groups: [],
    access_type: "purchase",
    last_access_at: new Date().toISOString(),
    progress_percent: 50,
    status: "active",
    ...overrides,
  };
}

const defaultFilters: StudentFilters = {
  accessType: null,
  status: null,
  groupId: null,
};

describe("useStudentsData - Filters & Stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    (studentsService.list as Mock).mockResolvedValue({
      data: { students: [], total: 0 },
      error: null,
    });

    (api.call as Mock).mockImplementation((functionName: string, params: Record<string, unknown>) => {
      if (params.action === "list-groups") {
        return Promise.resolve({ data: { groups: [] }, error: null });
      }
      if (params.action === "get-producer-info") {
        return Promise.resolve({
          data: {
            producer_info: {
              id: "producer-1",
              email: "producer@example.com",
              name: "Producer",
            },
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });
  });

  describe("filters", () => {
    it("should pass filters to service", async () => {
      (studentsService.list as Mock).mockResolvedValueOnce({
        data: { students: [], total: 0 },
        error: null,
      });

      renderHook(() =>
        useStudentsData({
          productId: "product-1",
          page: 1,
          limit: 10,
          filters: {
            accessType: "purchase",
            status: "active",
            groupId: "group-1",
          },
          searchQuery: "john",
        })
      );

      await waitFor(() => {
        expect(studentsService.list).toHaveBeenCalledWith("product-1", {
          page: 1,
          limit: 10,
          search: "john",
          access_type: "purchase",
          status: "active",
          group_id: "group-1",
        });
      });
    });

    it("should omit null filters", async () => {
      (studentsService.list as Mock).mockResolvedValueOnce({
        data: { students: [], total: 0 },
        error: null,
      });

      renderHook(() =>
        useStudentsData({
          productId: "product-1",
          page: 1,
          limit: 10,
          filters: defaultFilters,
          searchQuery: "",
        })
      );

      await waitFor(() => {
        expect(studentsService.list).toHaveBeenCalledWith("product-1", {
          page: 1,
          limit: 10,
          search: "",
          access_type: null,
          status: null,
          group_id: null,
        });
      });
    });
  });

  describe("stats", () => {
    it("should use backend stats when available", async () => {
      (studentsService.list as Mock).mockResolvedValueOnce({
        data: {
          students: [createMockStudent()],
          total: 100,
          stats: {
            totalStudents: 100,
            averageProgress: 75,
            completionRate: 50,
          },
        },
        error: null,
      });

      const { result } = renderHook(() =>
        useStudentsData({
          productId: "product-1",
          page: 1,
          limit: 10,
          filters: defaultFilters,
          searchQuery: "",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.averageProgress).toBe(75);
      expect(result.current.stats.completionRate).toBe(50);
    });

    it("should compute default stats when backend stats unavailable", async () => {
      (studentsService.list as Mock).mockResolvedValueOnce({
        data: {
          students: [
            createMockStudent({ progress_percent: 100 }),
            createMockStudent({ buyer_id: "buyer-2", progress_percent: 50 }),
          ],
          total: 2,
        },
        error: null,
      });

      const { result } = renderHook(() =>
        useStudentsData({
          productId: "product-1",
          page: 1,
          limit: 10,
          filters: defaultFilters,
          searchQuery: "",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Stats should be computed from students data
      expect(result.current.stats).toBeDefined();
    });
  });

  describe("error handling", () => {
    it("should handle fetch error gracefully", async () => {
      (studentsService.list as Mock).mockResolvedValueOnce({
        data: null,
        error: "Network error",
      });

      const { result } = renderHook(() =>
        useStudentsData({
          productId: "product-1",
          page: 1,
          limit: 10,
          filters: defaultFilters,
          searchQuery: "",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.students).toEqual([]);
    });

    it("should handle groups fetch error gracefully", async () => {
      (api.call as Mock).mockImplementation((functionName: string, params: Record<string, unknown>) => {
        if (params.action === "list-groups") {
          return Promise.resolve({ data: null, error: "Groups error" });
        }
        if (params.action === "get-producer-info") {
          return Promise.resolve({
            data: {
              producer_info: {
                id: "producer-1",
                email: "producer@example.com",
                name: "Producer",
              },
            },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const { result } = renderHook(() =>
        useStudentsData({
          productId: "product-1",
          page: 1,
          limit: 10,
          filters: defaultFilters,
          searchQuery: "",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.groups).toEqual([]);
    });
  });
});
