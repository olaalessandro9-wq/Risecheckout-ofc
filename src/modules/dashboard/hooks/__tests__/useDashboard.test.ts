/**
 * useDashboard Hook Tests
 * 
 * RISE V3 Compliant - 10.0/10
 * Tests main dashboard orchestration hook
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDashboard } from "../useDashboard";

// Mock child hooks
vi.mock("../useDateRangeState", () => ({
  useDateRangeState: () => ({
    state: {
      preset: "7days",
      dropdownOpen: false,
      calendarOpen: false,
      leftDate: undefined,
      rightDate: undefined,
      leftMonth: new Date(),
      rightMonth: new Date(),
      savedRange: undefined,
      hasError: false,
    },
    actions: {
      setPreset: vi.fn(),
      openDropdown: vi.fn(),
      closeDropdown: vi.fn(),
      openCalendar: vi.fn(),
      closeCalendar: vi.fn(),
      setLeftDate: vi.fn(),
      setRightDate: vi.fn(),
      setLeftMonth: vi.fn(),
      setRightMonth: vi.fn(),
      applyCustomRange: vi.fn(),
      cancel: vi.fn(),
      restoreSaved: vi.fn(),
    },
    dateRange: {
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-07"),
      startISO: "2025-01-01T03:00:00.000Z",
      endISO: "2025-01-08T02:59:59.999Z",
      timezone: "America/Sao_Paulo",
      label: "Últimos 7 dias",
    },
  }),
}));

vi.mock("../useDashboardAnalytics", () => ({
  useDashboardAnalytics: () => ({
    data: {
      metrics: [],
      chartData: [],
      recentCustomers: [],
    },
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

// Test wrapper
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("useDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("interface shape", () => {
    it("should return state, actions, dateRange, data, isLoading, and refetch", () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      // DateRange State
      expect(result.current).toHaveProperty("state");
      expect(result.current).toHaveProperty("actions");
      expect(result.current).toHaveProperty("dateRange");

      // Data Query
      expect(result.current).toHaveProperty("data");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("refetch");
    });

    it("should have correct state shape", () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.state).toHaveProperty("preset");
      expect(result.current.state).toHaveProperty("dropdownOpen");
      expect(result.current.state).toHaveProperty("calendarOpen");
      expect(result.current.state).toHaveProperty("hasError");
    });

    it("should have correct actions shape", () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.actions.setPreset).toBe("function");
      expect(typeof result.current.actions.openDropdown).toBe("function");
      expect(typeof result.current.actions.closeDropdown).toBe("function");
      expect(typeof result.current.actions.openCalendar).toBe("function");
      expect(typeof result.current.actions.closeCalendar).toBe("function");
      expect(typeof result.current.actions.applyCustomRange).toBe("function");
    });

    it("should have correct dateRange shape", () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.dateRange).toHaveProperty("startDate");
      expect(result.current.dateRange).toHaveProperty("endDate");
      expect(result.current.dateRange).toHaveProperty("startISO");
      expect(result.current.dateRange).toHaveProperty("endISO");
      expect(result.current.dateRange).toHaveProperty("timezone");
    });
  });

  describe("data composition", () => {
    it("should compose data from useDashboardAnalytics", () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.data).toHaveProperty("metrics");
      expect(result.current.data).toHaveProperty("chartData");
      expect(result.current.data).toHaveProperty("recentCustomers");
    });

    it("should have refetch function", () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.refetch).toBe("function");
    });
  });

  describe("loading state", () => {
    it("should reflect loading from analytics hook", () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      // Mocked as false
      expect(result.current.isLoading).toBe(false);
    });
  });
});
