/**
 * API para buscar métricas agregadas do dashboard via RPC Proxy
 * 
 * @see RISE Protocol V2 - Zero direct RPC calls from frontend
 */

import { getDashboardMetricsRpc } from "@/lib/rpc/rpcProxy";
import { toUTCStartOfDay, toUTCEndOfDay } from "@/lib/date-utils";
import type { RpcDashboardMetrics } from "../types";

/**
 * Busca métricas agregadas do banco via RPC Proxy
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
  const { data, error } = await getDashboardMetricsRpc(
    vendorId,
    toUTCStartOfDay(startDate),
    toUTCEndOfDay(endDate)
  );

  if (error) {
    console.error("[fetchAggregatedMetrics] Erro ao buscar métricas:", error);
    throw error;
  }

  // O RPC retorna JSON, então precisamos fazer cast seguro
  return data as unknown as RpcDashboardMetrics;
}
