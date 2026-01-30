/**
 * useAdminAnalytics.test.ts
 * 
 * Tests for admin analytics hooks
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useAdminFinancialMetrics,
  useAdminDailyRevenue,
  useAdminTrafficMetrics,
  useAdminDailyVisits,
  useAdminTopSources,
  useAdminTopSellers,
} from "../useAdminAnalytics";

// Mock api module
vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

import { api } from "@/lib/api";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useAdminAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useAdminFinancialMetrics", () => {
    it("should fetch financial metrics successfully", async () => {
      const mockMetrics = {
        totalPlatformFees: 5000,
        totalGMV: 100000,
        totalPaidOrders: 50,
        averageTicket: 2000,
        activeSellers: 10,
      };

      vi.mocked(api.call).mockResolvedValueOnce({
        data: { metrics: mockMetrics },
        error: null,
      });

      const { result } = renderHook(() => useAdminFinancialMetrics("30days"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockMetrics);
      expect(api.call).toHaveBeenCalledWith("admin-data", {
        action: "admin-analytics-financial",
        period: "30days",
      });
    });

    it("should handle API error", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { code: "INTERNAL_ERROR" as const, message: "API Error" },
      });

      const { result } = renderHook(() => useAdminFinancialMetrics("today"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe("useAdminDailyRevenue", () => {
    it("should fetch daily revenue successfully", async () => {
      const mockRevenue = [
        { date: "2024-01-01", platformFee: 100, gmv: 1000 },
        { date: "2024-01-02", platformFee: 150, gmv: 1500 },
      ];

      vi.mocked(api.call).mockResolvedValueOnce({
        data: { dailyRevenue: mockRevenue },
        error: null,
      });

      const { result } = renderHook(() => useAdminDailyRevenue("7days"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockRevenue);
    });
  });

  describe("useAdminTrafficMetrics", () => {
    it("should fetch traffic metrics successfully", async () => {
      const mockMetrics = {
        totalVisits: 10000,
        uniqueVisitors: 5000,
        activeCheckouts: 100,
        globalConversionRate: 0.05,
      };

      vi.mocked(api.call).mockResolvedValueOnce({
        data: { metrics: mockMetrics },
        error: null,
      });

      const { result } = renderHook(() => useAdminTrafficMetrics("30days"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockMetrics);
    });
  });

  describe("useAdminDailyVisits", () => {
    it("should fetch daily visits successfully", async () => {
      const mockVisits = [
        { date: "2024-01-01", visits: 500 },
        { date: "2024-01-02", visits: 600 },
      ];

      vi.mocked(api.call).mockResolvedValueOnce({
        data: { dailyVisits: mockVisits },
        error: null,
      });

      const { result } = renderHook(() => useAdminDailyVisits("7days"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockVisits);
    });
  });

  describe("useAdminTopSources", () => {
    it("should fetch top sources successfully", async () => {
      const mockSources = [
        { source: "google", visits: 1000 },
        { source: "facebook", visits: 500 },
      ];

      vi.mocked(api.call).mockResolvedValueOnce({
        data: { topSources: mockSources },
        error: null,
      });

      const { result } = renderHook(() => useAdminTopSources("30days"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockSources);
    });
  });

  describe("useAdminTopSellers", () => {
    it("should fetch top sellers successfully", async () => {
      const mockSellers = [
        {
          vendorId: "v1",
          vendorName: "Seller 1",
          vendorEmail: "seller1@test.com",
          totalGMV: 50000,
          totalFees: 2500,
          ordersCount: 25,
        },
      ];

      vi.mocked(api.call).mockResolvedValueOnce({
        data: { topSellers: mockSellers },
        error: null,
      });

      const { result } = renderHook(() => useAdminTopSellers("all"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockSellers);
    });
  });
});
