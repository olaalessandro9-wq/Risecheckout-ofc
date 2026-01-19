/**
 * Full Handler - BFF that aggregates all dashboard data in one call
 * 
 * @module dashboard-analytics/handlers
 * @version RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchMetrics } from "./metricsHandler.ts";
import { fetchChartOrders, fetchRecentOrders } from "./ordersHandler.ts";
import type { DashboardFullResponse } from "../types.ts";

export async function handleFullDashboard(
  supabase: SupabaseClient,
  vendorId: string,
  startDate: string,
  endDate: string,
  timezone: string
): Promise<DashboardFullResponse> {
  // Calculate previous period dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - daysDiff);
  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);
  previousEnd.setHours(23, 59, 59, 999);

  const previousStartStr = previousStart.toISOString();
  const previousEndStr = previousEnd.toISOString();

  // Fetch all data in parallel (4 queries in 1 round-trip)
  const [
    currentMetrics,
    previousMetrics,
    chartOrders,
    recentOrders,
  ] = await Promise.all([
    fetchMetrics(supabase, vendorId, startDate, endDate, timezone),
    fetchMetrics(supabase, vendorId, previousStartStr, previousEndStr, timezone),
    fetchChartOrders(supabase, vendorId, startDate, endDate, timezone),
    fetchRecentOrders(supabase, vendorId, startDate, endDate),
  ]);

  return {
    currentMetrics,
    previousMetrics,
    chartOrders,
    recentOrders,
  };
}
