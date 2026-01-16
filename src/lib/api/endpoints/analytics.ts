/**
 * Analytics API Endpoint
 * 
 * RISE ARCHITECT PROTOCOL - Zero Technical Debt
 * 
 * This module provides typed functions for all analytics-related operations.
 * All functions use the unified API client - NO direct database access.
 */

import { api } from "../client";
import type { ApiResponse } from "../types";

// ============================================
// TYPES
// ============================================

/**
 * Dashboard analytics summary
 */
export interface DashboardAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueChange: number; // Percentage change
  ordersChange: number;
  conversionRate: number;
  averageOrderValue: number;
}

/**
 * Sales chart data point
 */
export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

/**
 * Top product
 */
export interface TopProduct {
  productId: string;
  productName: string;
  revenue: number;
  orders: number;
}

/**
 * Analytics period
 */
export type AnalyticsPeriod = "today" | "week" | "month" | "year" | "all";

/**
 * Dashboard data response
 */
export interface DashboardData {
  summary: DashboardAnalytics;
  salesChart: SalesDataPoint[];
  topProducts: TopProduct[];
}

// ============================================
// API FUNCTIONS
// ============================================

const FUNCTION_NAME = "analytics-api";

/**
 * Get dashboard analytics
 */
async function getDashboard(
  period: AnalyticsPeriod = "month"
): Promise<ApiResponse<DashboardData>> {
  return api.call<DashboardData>(FUNCTION_NAME, {
    action: "dashboard",
    params: { period },
  });
}

/**
 * Get sales chart data
 */
async function getSalesChart(
  period: AnalyticsPeriod = "month"
): Promise<ApiResponse<SalesDataPoint[]>> {
  return api.call<SalesDataPoint[]>(FUNCTION_NAME, {
    action: "sales_chart",
    params: { period },
  });
}

/**
 * Get product-specific analytics
 */
async function getProductAnalytics(
  productId: string,
  period: AnalyticsPeriod = "month"
): Promise<ApiResponse<{
  revenue: number;
  orders: number;
  views: number;
  conversionRate: number;
  salesChart: SalesDataPoint[];
}>> {
  return api.call(FUNCTION_NAME, {
    action: "product_analytics",
    params: { productId, period },
  });
}

// ============================================
// EXPORTED API OBJECT
// ============================================

export const analyticsApi = {
  getDashboard,
  getSalesChart,
  getProductAnalytics,
} as const;
