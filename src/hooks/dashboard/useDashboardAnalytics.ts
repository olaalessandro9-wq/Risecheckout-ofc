/**
 * Hook principal para analytics do Dashboard
 * 
 * Este hook é responsável por orquestrar as chamadas de API
 * e calcular as métricas finais para exibição no dashboard.
 * 
 * ARQUITETURA (RISE ARCHITECT PROTOCOL):
 * - Tipos: ./types.ts
 * - API: ./api/fetchMetrics.ts, ./api/fetchOrders.ts
 * - Cálculos: ./utils/calculations.ts
 * - Formatadores: ./utils/formatters.ts
 * - Presets: ./utils/datePresets.ts
 * 
 * MIGRATED: Uses useAuth() instead of supabase.auth.getSession()
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { DashboardData } from "./types";
import { fetchAggregatedMetrics } from "./api/fetchMetrics";
import { fetchRecentOrders, fetchChartOrders } from "./api/fetchOrders";
import { calculateMetricsFromRpc, calculateChartData, calculateHourlyChartData } from "./utils/calculations";
import { formatRecentCustomers } from "./utils/formatters";

/**
 * Hook para buscar e calcular todas as métricas do dashboard
 * 
 * @param startDate - Data de início do período
 * @param endDate - Data de fim do período
 * @returns Query com dados do dashboard, loading state e função de refetch
 */
export function useDashboardAnalytics(startDate: Date, endDate: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-analytics", user?.id, startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<DashboardData> => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const vendorId = user.id;

      // Calcular período anterior (mesmo tamanho do período atual)
      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
      const previousEndDate = new Date(startDate);
      previousEndDate.setDate(previousEndDate.getDate() - 1);

      // Buscar todos os dados em paralelo
      const [currentMetrics, previousMetrics, chartOrders, recentOrders] = await Promise.all([
        fetchAggregatedMetrics(vendorId, startDate, endDate),
        fetchAggregatedMetrics(vendorId, previousStartDate, previousEndDate),
        fetchChartOrders(vendorId, startDate, endDate),
        fetchRecentOrders(vendorId, startDate, endDate)
      ]);

      // Calcular métricas usando dados agregados do banco
      const metrics = calculateMetricsFromRpc(currentMetrics, previousMetrics);

      // Detectar se é período de 1 dia para usar granularidade por hora
      const isSingleDay = daysDiff <= 1;

      // Calcular dados dos gráficos (por hora se 1 dia, por dia se mais)
      const chartData = isSingleDay
        ? calculateHourlyChartData(chartOrders, startDate)
        : calculateChartData(chartOrders, startDate, endDate);

      // Formatar clientes recentes
      const recentCustomers = formatRecentCustomers(recentOrders);

      return {
        metrics,
        chartData,
        recentCustomers
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
