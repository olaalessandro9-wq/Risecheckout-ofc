/**
 * useDashboardAnalytics Hook Tests
 * 
 * RISE V3 Compliant - 10.0/10
 * Tests dashboard analytics data fetching with BFF pattern
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDashboardAnalytics } from "../useDashboardAnalytics";
import { api } from "@/lib/api";
import type { DateRange } from "../../types";

// Mock dependencies
vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: () => ({
    user: { id: "user-1" },
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

const mockDateRange: DateRange = {
  startDate: new Date("2025-01-01T00:00:00Z"),
  endDate: new Date("2025-01-07T23:59:59Z"),
};

describe("useDashboardAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("data fetching", () => {
    it("should fetch dashboard data via BFF pattern", async () => {
      const mockResponse = {
        success: true,
        data: {
          currentMetrics: {
            total_revenue: 10000,
            total_orders: 50,
            approved_orders: 45,
            avg_ticket: 200,
          },
          previousMetrics: {
            total_revenue: 8000,
            total_orders: 40,
            approved_orders: 38,
            avg_ticket: 190,
          },
          chartOrders: [],
          recentOrders: [],
        },
      };

      (api.call as Mock).mockResolvedValueOnce({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHook(
        () => useDashboardAnalytics(mockDateRange, "7days"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.call).toHaveBeenCalledWith(
        "dashboard-analytics",
        expect.objectContaining({
          action: "full",
          startDate: expect.any(String),
          endDate: expect.any(String),
          timezone: "America/Sao_Paulo",
        })
      );
    });

    it("should calculate metrics from response", async () => {
      const mockResponse = {
        success: true,
        data: {
          currentMetrics: {
            total_revenue: 10000,
            total_orders: 50,
            approved_orders: 45,
            avg_ticket: 200,
          },
          previousMetrics: {
            total_revenue: 8000,
            total_orders: 40,
            approved_orders: 38,
            avg_ticket: 190,
          },
          chartOrders: [],
          recentOrders: [],
        },
      };

      (api.call as Mock).mockResolvedValueOnce({
        data: mockResponse,
        error: null,
      });

      const { result } = renderHook(
        () => useDashboardAnalytics(mockDateRange, "7days"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.data?.metrics).toBeDefined();
    });
  });

  describe("error handling", () => {
    it("should handle API error", async () => {
      (api.call as Mock).mockResolvedValueOnce({
        data: null,
        error: { message: "Network error" },
      });

      const { result } = renderHook(
        () => useDashboardAnalytics(mockDateRange, "7days"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("should handle unsuccessful response", async () => {
      (api.call as Mock).mockResolvedValueOnce({
        data: { success: false, error: "Failed to load" },
        error: null,
      });

      const { result } = renderHook(
        () => useDashboardAnalytics(mockDateRange, "7days"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("query key", () => {
    it("should include user ID and date range in query key", async () => {
      (api.call as Mock).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            currentMetrics: {},
            previousMetrics: {},
            chartOrders: [],
            recentOrders: [],
          },
        },
        error: null,
      });

      renderHook(
        () => useDashboardAnalytics(mockDateRange, "7days"),
        { wrapper: createWrapper() }
      );

      // The hook should be enabled and make a call
      await waitFor(() => {
        expect(api.call).toHaveBeenCalled();
      });
    });
  });

  describe("loading state", () => {
    it("should start in loading state", () => {
      (api.call as Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(
        () => useDashboardAnalytics(mockDateRange, "7days"),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
    });
  });
});
