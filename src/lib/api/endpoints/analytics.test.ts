/**
 * Analytics API Endpoint Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyticsApi } from "./analytics";
import { api } from "../client";

vi.mock("../client", () => ({
  api: {
    call: vi.fn(),
  },
}));

describe("analyticsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // getDashboard
  // ============================================================================

  describe("getDashboard", () => {
    it("should call api.call with correct action and default period", async () => {
      const mockResponse = {
        data: {
          summary: { totalRevenue: 100000, totalOrders: 50 },
          salesChart: [],
          topProducts: [],
        },
        error: null,
      };
      vi.mocked(api.call).mockResolvedValue(mockResponse);

      await analyticsApi.getDashboard();

      expect(api.call).toHaveBeenCalledWith("analytics-api", {
        action: "dashboard",
        params: { period: "month" },
      });
    });

    it("should pass custom period to params", async () => {
      const mockResponse = { data: null, error: null };
      vi.mocked(api.call).mockResolvedValue(mockResponse);

      await analyticsApi.getDashboard("week");

      expect(api.call).toHaveBeenCalledWith("analytics-api", {
        action: "dashboard",
        params: { period: "week" },
      });
    });

    it("should return API response as-is", async () => {
      const mockData = {
        summary: {
          totalRevenue: 500000,
          totalOrders: 100,
          totalProducts: 5,
          totalCustomers: 80,
          revenueChange: 15.5,
          ordersChange: 10.2,
          conversionRate: 3.5,
          averageOrderValue: 5000,
        },
        salesChart: [{ date: "2024-01-01", revenue: 10000, orders: 5 }],
        topProducts: [{ productId: "1", productName: "Test", revenue: 5000, orders: 10 }],
      };
      const mockResponse = { data: mockData, error: null };
      vi.mocked(api.call).mockResolvedValue(mockResponse);

      const result = await analyticsApi.getDashboard("year");

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });
  });

  // ============================================================================
  // getSalesChart
  // ============================================================================

  describe("getSalesChart", () => {
    it("should call api.call with correct action and default period", async () => {
      const mockResponse = { data: [], error: null };
      vi.mocked(api.call).mockResolvedValue(mockResponse);

      await analyticsApi.getSalesChart();

      expect(api.call).toHaveBeenCalledWith("analytics-api", {
        action: "sales_chart",
        params: { period: "month" },
      });
    });

    it("should return sales data points array", async () => {
      const mockData = [
        { date: "2024-01-01", revenue: 10000, orders: 5 },
        { date: "2024-01-02", revenue: 15000, orders: 8 },
      ];
      const mockResponse = { data: mockData, error: null };
      vi.mocked(api.call).mockResolvedValue(mockResponse);

      const result = await analyticsApi.getSalesChart("today");

      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toHaveProperty("date");
      expect(result.data?.[0]).toHaveProperty("revenue");
    });

    it("should handle empty data", async () => {
      const mockResponse = { data: [], error: null };
      vi.mocked(api.call).mockResolvedValue(mockResponse);

      const result = await analyticsApi.getSalesChart();

      expect(result.data).toEqual([]);
    });
  });

  // ============================================================================
  // getProductAnalytics
  // ============================================================================

  describe("getProductAnalytics", () => {
    it("should call api.call with productId and period", async () => {
      const mockResponse = { data: null, error: null };
      vi.mocked(api.call).mockResolvedValue(mockResponse);

      await analyticsApi.getProductAnalytics("product-123", "week");

      expect(api.call).toHaveBeenCalledWith("analytics-api", {
        action: "product_analytics",
        params: { productId: "product-123", period: "week" },
      });
    });

    it("should return product-specific metrics", async () => {
      const mockData = {
        revenue: 50000,
        orders: 25,
        views: 1000,
        conversionRate: 2.5,
        salesChart: [{ date: "2024-01-01", revenue: 5000, orders: 2 }],
      };
      const mockResponse = { data: mockData, error: null };
      vi.mocked(api.call).mockResolvedValue(mockResponse);

      const result = await analyticsApi.getProductAnalytics("product-123");

      expect(result.data).toHaveProperty("revenue", 50000);
      expect(result.data).toHaveProperty("conversionRate", 2.5);
      expect(result.data?.salesChart).toHaveLength(1);
    });

    it("should handle product not found error", async () => {
      const mockResponse = {
        data: null,
        error: { code: "NOT_FOUND" as const, message: "Product not found" },
      };
      vi.mocked(api.call).mockResolvedValue(mockResponse);

      const result = await analyticsApi.getProductAnalytics("invalid-id");

      expect(result.data).toBeNull();
      expect(result.error).toHaveProperty("message", "Product not found");
    });

    it("should use default period when not specified", async () => {
      const mockResponse = { data: null, error: null };
      vi.mocked(api.call).mockResolvedValue(mockResponse);

      await analyticsApi.getProductAnalytics("product-123");

      expect(api.call).toHaveBeenCalledWith("analytics-api", {
        action: "product_analytics",
        params: { productId: "product-123", period: "month" },
      });
    });
  });
});
