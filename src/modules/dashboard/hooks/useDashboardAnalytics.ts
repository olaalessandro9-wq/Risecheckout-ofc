/**
 * Hook principal para analytics do Dashboard
 * 
 * @module dashboard/hooks
 * @version RISE V3 Compliant
 * 
 * Este hook orquestra as chamadas de API e cálculos de métricas.
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { DashboardData, DateRange } from "../types";
import { fetchAggregatedMetrics } from "../api/fetchMetrics";
import { fetchRecentOrders, fetchChartOrders } from "../api/fetchOrders";
import {
  calculateMetricsFromRpc,
  calculateChartData,
  calculateHourlyChartData,
  formatRecentCustomers,
} from "../utils";

/**
 * Hook para buscar e calcular métricas do dashboard
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

      const vendorId = user.id;

      // Calcular período anterior
      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
      const previousEndDate = new Date(startDate);
      previousEndDate.setDate(previousEndDate.getDate() - 1);

      // Buscar todos os dados em paralelo
      const [currentMetrics, previousMetrics, chartOrders, recentOrders] =
        await Promise.all([
          fetchAggregatedMetrics(vendorId, startDate, endDate),
          fetchAggregatedMetrics(vendorId, previousStartDate, previousEndDate),
          fetchChartOrders(vendorId, startDate, endDate),
          fetchRecentOrders(vendorId, startDate, endDate),
        ]);

      // Calcular métricas
      const metrics = calculateMetricsFromRpc(currentMetrics, previousMetrics);

      // Detectar se é período de 1 dia
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
