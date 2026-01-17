/**
 * useAdminAnalytics - Hook para métricas globais da plataforma (Owner/Admin)
 * 
 * MIGRATED: Uses api.call() - Unified API Client
 * @see RISE Protocol V3
 * 
 * Busca dados agregados de todos os vendedores para o dashboard administrativo.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type PeriodFilter = "today" | "yesterday" | "7days" | "30days" | "all";

// ========== FINANCIAL METRICS ==========

interface FinancialMetrics {
  totalPlatformFees: number;
  totalGMV: number;
  totalPaidOrders: number;
  averageTicket: number;
  activeSellers: number;
}

interface DailyRevenue {
  date: string;
  platformFee: number;
  gmv: number;
}

interface FinancialResponse {
  metrics?: FinancialMetrics;
  dailyRevenue?: DailyRevenue[];
  error?: string;
}

/**
 * Financial metrics via Edge Function
 * MIGRATED: Uses api.call() - Unified API Client
 */
export function useAdminFinancialMetrics(period: PeriodFilter) {
  return useQuery({
    queryKey: ["admin-financial-metrics", period],
    queryFn: async (): Promise<FinancialMetrics> => {
      const { data, error } = await api.call<FinancialResponse>("admin-data", {
        action: "admin-analytics-financial",
        period,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data?.metrics as FinancialMetrics;
    },
  });
}

/**
 * Daily revenue via Edge Function
 * MIGRATED: Uses api.call() - Unified API Client
 */
export function useAdminDailyRevenue(period: PeriodFilter) {
  return useQuery({
    queryKey: ["admin-daily-revenue", period],
    queryFn: async (): Promise<DailyRevenue[]> => {
      const { data, error } = await api.call<FinancialResponse>("admin-data", {
        action: "admin-analytics-financial",
        period,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data?.dailyRevenue as DailyRevenue[];
    },
  });
}

// ========== TRAFFIC METRICS ==========

interface TrafficMetrics {
  totalVisits: number;
  uniqueVisitors: number;
  activeCheckouts: number;
  globalConversionRate: number;
}

interface DailyVisits {
  date: string;
  visits: number;
}

interface TopSource {
  source: string;
  visits: number;
}

interface TrafficResponse {
  metrics?: TrafficMetrics;
  dailyVisits?: DailyVisits[];
  topSources?: TopSource[];
  error?: string;
}

/**
 * Traffic metrics via Edge Function
 * MIGRATED: Uses api.call() - Unified API Client
 */
export function useAdminTrafficMetrics(period: PeriodFilter) {
  return useQuery({
    queryKey: ["admin-traffic-metrics", period],
    queryFn: async (): Promise<TrafficMetrics> => {
      const { data, error } = await api.call<TrafficResponse>("admin-data", {
        action: "admin-analytics-traffic",
        period,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data?.metrics as TrafficMetrics;
    },
  });
}

/**
 * Daily visits via Edge Function
 * MIGRATED: Uses api.call() - Unified API Client
 */
export function useAdminDailyVisits(period: PeriodFilter) {
  return useQuery({
    queryKey: ["admin-daily-visits", period],
    queryFn: async (): Promise<DailyVisits[]> => {
      const { data, error } = await api.call<TrafficResponse>("admin-data", {
        action: "admin-analytics-traffic",
        period,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data?.dailyVisits as DailyVisits[];
    },
  });
}

/**
 * Top sources via Edge Function
 * MIGRATED: Uses api.call() - Unified API Client
 */
export function useAdminTopSources(period: PeriodFilter) {
  return useQuery({
    queryKey: ["admin-top-sources", period],
    queryFn: async (): Promise<TopSource[]> => {
      const { data, error } = await api.call<TrafficResponse>("admin-data", {
        action: "admin-analytics-traffic",
        period,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data?.topSources as TopSource[];
    },
  });
}

// ========== TOP SELLERS ==========

interface TopSeller {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  totalGMV: number;
  totalFees: number;
  ordersCount: number;
}

interface TopSellersResponse {
  topSellers?: TopSeller[];
  error?: string;
}

/**
 * Top sellers via Edge Function
 * MIGRATED: Uses api.call() - Unified API Client
 */
export function useAdminTopSellers(period: PeriodFilter) {
  return useQuery({
    queryKey: ["admin-top-sellers", period],
    queryFn: async (): Promise<TopSeller[]> => {
      const { data, error } = await api.call<TopSellersResponse>("admin-data", {
        action: "admin-analytics-top-sellers",
        period,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data?.topSellers as TopSeller[];
    },
  });
}
