/**
 * Hook principal para analytics do Dashboard
 * 
 * @module dashboard/hooks
 * @version RISE V3 Compliant - BFF Pattern
 * 
 * Este hook usa a action "full" do dashboard-analytics para buscar
 * todos os dados em 1 única chamada HTTP (antes eram 4).
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { invokeEdgeFunction } from "@/lib/api-client";
import type { DashboardData, DateRange, RpcDashboardMetrics, Order } from "../types";
import {
  calculateMetricsFromRpc,
  calculateChartData,
  calculateHourlyChartData,
  formatRecentCustomers,
} from "../utils";

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

interface DashboardFullResponse {
  success: boolean;
  data?: {
    currentMetrics: RpcDashboardMetrics;
    previousMetrics: RpcDashboardMetrics;
    chartOrders: Order[];
    recentOrders: Order[];
  };
  error?: string;
}

/**
 * Hook para buscar e calcular métricas do dashboard
 * Usa BFF pattern: 1 HTTP call em vez de 4
 */
export function useDashboardAnalytics(dateRange: DateRange) {
  const { user } = useAuth();
  const { startDate, endDate } = dateRange;

  return useQuery({
    queryKey: [
      "dashboard-analytics",
      user?.id,
      startDate.toISOString(),
      endDate.toISOString(),
    ],
    queryFn: async (): Promise<DashboardData> => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      // 1 única chamada BFF (antes eram 4 paralelas)
      const { data: response, error: fetchError } = await invokeEdgeFunction<DashboardFullResponse>(
        "dashboard-analytics",
        {
          action: "full",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          timezone: DEFAULT_TIMEZONE,
        }
      );

      if (fetchError) {
        throw new Error(fetchError);
      }

      if (!response?.success || !response?.data) {
        throw new Error(response?.error ?? "Failed to load dashboard data");
      }

      const { currentMetrics, previousMetrics, chartOrders, recentOrders } = response.data;

      // Calcular métricas
      const metrics = calculateMetricsFromRpc(currentMetrics, previousMetrics);

      // Detectar se é período de 1 dia
      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const isSingleDay = daysDiff <= 1;

      // Calcular dados dos gráficos
      const chartData = isSingleDay
        ? calculateHourlyChartData(chartOrders, startDate)
        : calculateChartData(chartOrders, startDate, endDate);

      // Formatar clientes recentes
      const recentCustomers = formatRecentCustomers(recentOrders);

      return {
        metrics,
        chartData,
        recentCustomers,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
