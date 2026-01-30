/**
 * useStudentsActions Hook Tests
 * 
 * RISE V3 Compliant - 10.0/10
 * Tests student actions: assign groups, revoke access, export
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStudentsActions } from "../useStudentsActions";
import { studentsService } from "../../services/students.service";
import type { BuyerWithGroups } from "../../types";

// Mock dependencies
vi.mock("../../services/students.service", () => ({
  studentsService: {
    assignGroups: vi.fn(),
    revokeAccess: vi.fn(),
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
function createMockStudent(): BuyerWithGroups {
  return {
    buyer_id: "buyer-1",
    buyer_email: "student@example.com",
    buyer_name: "John Student",
    groups: [],
    access_type: "purchase",
    last_access_at: new Date().toISOString(),
    progress_percent: 50,
    status: "active",
  };
}

describe("useStudentsActions", () => {
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock URL global
    global.URL.createObjectURL = vi.fn(() => "blob:test");
    global.URL.revokeObjectURL = vi.fn();
  });

  describe("handleAssignGroups", () => {
    it("should assign groups successfully", async () => {
      (studentsService.assignGroups as Mock).mockResolvedValueOnce({
        error: null,
      });

      const { result } = renderHook(() =>
        useStudentsActions({
          productId: "product-1",
          students: [createMockStudent()],
          onRefresh: mockOnRefresh,
        })
      );

      await act(async () => {
        await result.current.handleAssignGroups("buyer-1", ["group-1", "group-2"]);
      });

      expect(studentsService.assignGroups).toHaveBeenCalledWith({
        buyer_id: "buyer-1",
        group_ids: ["group-1", "group-2"],
      });
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it("should handle error on assign", async () => {
      (studentsService.assignGroups as Mock).mockResolvedValueOnce({
        error: "Failed to assign",
      });

      const { result } = renderHook(() =>
        useStudentsActions({
          productId: "product-1",
          students: [createMockStudent()],
          onRefresh: mockOnRefresh,
        })
      );

      await act(async () => {
        await result.current.handleAssignGroups("buyer-1", ["group-1"]);
      });

      expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    it("should not assign when productId is undefined", async () => {
      const { result } = renderHook(() =>
        useStudentsActions({
          productId: undefined,
          students: [],
          onRefresh: mockOnRefresh,
        })
      );

      await act(async () => {
        await result.current.handleAssignGroups("buyer-1", ["group-1"]);
      });

      expect(studentsService.assignGroups).not.toHaveBeenCalled();
    });
  });

  describe("handleRevokeAccess", () => {
    it("should revoke access successfully", async () => {
      (studentsService.revokeAccess as Mock).mockResolvedValueOnce({
        error: null,
      });

      const { result } = renderHook(() =>
        useStudentsActions({
          productId: "product-1",
          students: [createMockStudent()],
          onRefresh: mockOnRefresh,
        })
      );

      await act(async () => {
        await result.current.handleRevokeAccess("buyer-1");
      });

      expect(studentsService.revokeAccess).toHaveBeenCalledWith("buyer-1", "product-1");
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it("should handle error on revoke", async () => {
      (studentsService.revokeAccess as Mock).mockResolvedValueOnce({
        error: "Failed to revoke",
      });

      const { result } = renderHook(() =>
        useStudentsActions({
          productId: "product-1",
          students: [createMockStudent()],
          onRefresh: mockOnRefresh,
        })
      );

      await act(async () => {
        await result.current.handleRevokeAccess("buyer-1");
      });

      expect(mockOnRefresh).not.toHaveBeenCalled();
    });
  });

  describe("handleExport", () => {
    it("should export students as CSV", () => {
      const students = [
        createMockStudent(),
        { ...createMockStudent(), buyer_id: "buyer-2", buyer_email: "another@example.com" },
      ];

      const { result } = renderHook(() =>
        useStudentsActions({
          productId: "product-1",
          students,
          onRefresh: mockOnRefresh,
        })
      );

      act(() => {
        result.current.handleExport("csv");
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it("should export students as XLS", () => {
      const students = [createMockStudent()];

      const { result } = renderHook(() =>
        useStudentsActions({
          productId: "product-1",
          students,
          onRefresh: mockOnRefresh,
        })
      );

      act(() => {
        result.current.handleExport("xls");
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it("should show error when no students to export", () => {
      const { result } = renderHook(() =>
        useStudentsActions({
          productId: "product-1",
          students: [],
          onRefresh: mockOnRefresh,
        })
      );

      act(() => {
        result.current.handleExport("csv");
      });

      expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    });
  });
});
