/**
 * API para buscar métricas agregadas do dashboard
 */

import { supabase } from "@/integrations/supabase/client";
import { toUTCStartOfDay, toUTCEndOfDay } from "@/lib/date-utils";
import type { RpcDashboardMetrics } from "../types";

/**
 * Busca métricas agregadas do banco via RPC
 * 
 * VANTAGENS:
 * - Não tem limite de 1000 registros (agregação no banco)
 * - Performance muito melhor para grandes volumes
 * - Dados sempre precisos
 * 
 * CORREÇÃO DE TIMEZONE:
 * Usa toUTCStartOfDay/toUTCEndOfDay para garantir que a conversão
 * de datas preserve o dia/mês/ano da timezone local do usuário.
 */
export async function fetchAggregatedMetrics(
  vendorId: string,
  startDate: Date,
  endDate: Date
): Promise<RpcDashboardMetrics> {
  const { data, error } = await supabase.rpc('get_dashboard_metrics', {
    p_vendor_id: vendorId,
    p_start_date: toUTCStartOfDay(startDate),
    p_end_date: toUTCEndOfDay(endDate)
  });

  if (error) {
    console.error("[fetchAggregatedMetrics] Erro ao buscar métricas:", error);
    throw error;
  }

  // O RPC retorna JSON, então precisamos fazer cast seguro
  return data as unknown as RpcDashboardMetrics;
}
