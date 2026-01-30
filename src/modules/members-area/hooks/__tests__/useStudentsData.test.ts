/**
 * useStudentsData Hook Tests
 * 
 * RISE V3 Compliant - 10.0/10
 * Tests student data fetching with filters and producer display
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
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

describe("useStudentsData", () => {
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

  describe("initialization", () => {
    it("should fetch students and groups on mount", async () => {
      const students = [createMockStudent()];
      (studentsService.list as Mock).mockResolvedValueOnce({
        data: { students, total: 1 },
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

      expect(studentsService.list).toHaveBeenCalledWith("product-1", expect.any(Object));
      expect(api.call).toHaveBeenCalledWith("students-groups", {
        action: "list-groups",
        product_id: "product-1",
      });
    });

    it("should not fetch when productId is undefined", () => {
      renderHook(() =>
        useStudentsData({
          productId: undefined,
          page: 1,
          limit: 10,
          filters: defaultFilters,
          searchQuery: "",
        })
      );

      expect(studentsService.list).not.toHaveBeenCalled();
    });
  });

  describe("producer student", () => {
    it("should include producer as first student on page 1", async () => {
      const students = [createMockStudent({ buyer_id: "student-1" })];
      (studentsService.list as Mock).mockResolvedValueOnce({
        data: { students, total: 1 },
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

      expect(result.current.students).toHaveLength(2);
      expect(result.current.students[0].access_type).toBe("producer");
      expect(result.current.students[1].buyer_id).toBe("student-1");
    });

    it("should not include producer on page 2", async () => {
      const students = [createMockStudent()];
      (studentsService.list as Mock).mockResolvedValueOnce({
        data: { students, total: 1 },
        error: null,
      });

      const { result } = renderHook(() =>
        useStudentsData({
          productId: "product-1",
          page: 2,
          limit: 10,
          filters: defaultFilters,
          searchQuery: "",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Only the regular student, not producer
      expect(result.current.students).toHaveLength(1);
      expect(result.current.students[0].access_type).toBe("purchase");
    });

    it("should filter producer when accessType filter excludes it", async () => {
      const students = [createMockStudent()];
      (studentsService.list as Mock).mockResolvedValueOnce({
        data: { students, total: 1 },
        error: null,
      });

      const { result } = renderHook(() =>
        useStudentsData({
          productId: "product-1",
          page: 1,
          limit: 10,
          filters: { ...defaultFilters, accessType: "purchase" },
          searchQuery: "",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not include producer when filtering by purchase type
      expect(result.current.students.every((s) => s.access_type !== "producer")).toBe(true);
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
  });

  describe("fetchStudents", () => {
    it("should refetch students with new search", async () => {
      (studentsService.list as Mock).mockResolvedValue({
        data: { students: [], total: 0 },
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

      await act(async () => {
        await result.current.fetchStudents("new search");
      });

      expect(studentsService.list).toHaveBeenLastCalledWith(
        "product-1",
        expect.objectContaining({ search: "new search" })
      );
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
  });
});
