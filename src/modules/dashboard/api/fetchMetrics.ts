/**
 * API para buscar métricas agregadas do dashboard via RPC Proxy
 * 
 * @module dashboard/api
 * @version RISE V3 Compliant
 */

import { getDashboardMetricsRpc } from "@/lib/rpc/rpcProxy";
import { toUTCStartOfDay, toUTCEndOfDay } from "@/lib/date-utils";
import type { RpcDashboardMetrics } from "../types";

/**
 * Busca métricas agregadas do banco via RPC Proxy
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

  return data as unknown as RpcDashboardMetrics;
}
