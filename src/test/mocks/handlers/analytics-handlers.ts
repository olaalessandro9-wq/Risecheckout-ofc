/**
 * Analytics API MSW Handlers
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Mock handlers for analytics-api edge function.
 * Provides consistent mock data for dashboard, sales charts, and product analytics.
 * 
 * @module test/mocks/handlers/analytics-handlers
 */

import { http, HttpResponse } from "msw";

// ============================================================================
// Constants
// ============================================================================

const API_URL = "https://api.risecheckout.com/functions/v1";

// ============================================================================
// Mock Data
// ============================================================================

export const mockDashboardData = {
  summary: {
    totalRevenue: 1500000, // R$ 15.000,00 in cents
    totalOrders: 150,
    totalProducts: 10,
    totalCustomers: 120,
    revenueChange: 12.5,
    ordersChange: 8.3,
    conversionRate: 3.2,
    averageOrderValue: 10000, // R$ 100,00 in cents
  },
  salesChart: [
    { date: "2026-01-01", revenue: 50000, orders: 5 },
    { date: "2026-01-02", revenue: 75000, orders: 8 },
    { date: "2026-01-03", revenue: 60000, orders: 6 },
    { date: "2026-01-04", revenue: 90000, orders: 10 },
    { date: "2026-01-05", revenue: 120000, orders: 12 },
  ],
  topProducts: [
    { productId: "prod-1", productName: "Product A", revenue: 500000, orders: 50 },
    { productId: "prod-2", productName: "Product B", revenue: 300000, orders: 30 },
    { productId: "prod-3", productName: "Product C", revenue: 200000, orders: 20 },
  ],
};

export const mockSalesChartData = [
  { date: "2026-01-01", revenue: 50000, orders: 5 },
  { date: "2026-01-02", revenue: 75000, orders: 8 },
  { date: "2026-01-03", revenue: 60000, orders: 6 },
  { date: "2026-01-04", revenue: 90000, orders: 10 },
  { date: "2026-01-05", revenue: 120000, orders: 12 },
  { date: "2026-01-06", revenue: 85000, orders: 9 },
  { date: "2026-01-07", revenue: 110000, orders: 11 },
];

export const mockProductAnalyticsData = {
  revenue: 500000,
  orders: 50,
  views: 2500,
  conversionRate: 2.0,
  salesChart: [
    { date: "2026-01-01", revenue: 50000, orders: 5 },
    { date: "2026-01-02", revenue: 75000, orders: 8 },
    { date: "2026-01-03", revenue: 60000, orders: 6 },
  ],
};

// ============================================================================
// Request Body Types
// ============================================================================

interface AnalyticsRequest {
  action: "dashboard" | "sales_chart" | "product_analytics";
  params?: {
    period?: string;
    productId?: string;
  };
}

// ============================================================================
// Handlers
// ============================================================================

export const analyticsHandlers = [
  http.post(`${API_URL}/analytics-api`, async ({ request }) => {
    const body = (await request.json()) as AnalyticsRequest;

    switch (body.action) {
      case "dashboard":
        return HttpResponse.json({
          data: mockDashboardData,
          error: null,
        });

      case "sales_chart":
        return HttpResponse.json({
          data: mockSalesChartData,
          error: null,
        });

      case "product_analytics":
        if (!body.params?.productId) {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Product ID is required" },
            },
            { status: 400 }
          );
        }

        if (body.params.productId === "not-found") {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Product not found" },
            },
            { status: 404 }
          );
        }

        return HttpResponse.json({
          data: mockProductAnalyticsData,
          error: null,
        });

      default:
        return HttpResponse.json(
          {
            data: null,
            error: { message: `Unknown action: ${body.action}` },
          },
          { status: 400 }
        );
    }
  }),
];
