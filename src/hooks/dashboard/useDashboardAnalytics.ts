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
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DashboardData } from "./types";
import { fetchAggregatedMetrics } from "./api/fetchMetrics";
import { fetchRecentOrders, fetchChartOrders } from "./api/fetchOrders";
import { calculateMetricsFromRpc, calculateChartData } from "./utils/calculations";
import { formatRecentCustomers } from "./utils/formatters";

/**
 * Hook para buscar e calcular todas as métricas do dashboard
 * 
 * @param startDate - Data de início do período
 * @param endDate - Data de fim do período
 * @returns Query com dados do dashboard, loading state e função de refetch
 */
export function useDashboardAnalytics(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ["dashboard-analytics", startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<DashboardData> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Usuário não autenticado");
      }

      const vendorId = session.user.id;

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

      console.log("[useDashboardAnalytics] Métricas período atual:", currentMetrics);
      console.log("[useDashboardAnalytics] Métricas período anterior:", previousMetrics);

      // Calcular métricas usando dados agregados do banco
      const metrics = calculateMetricsFromRpc(currentMetrics, previousMetrics);

      // Calcular dados dos gráficos
      const chartData = calculateChartData(chartOrders, startDate, endDate);

      // Formatar clientes recentes
      const recentCustomers = formatRecentCustomers(recentOrders);

      return {
        metrics,
        chartData,
        recentCustomers
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
