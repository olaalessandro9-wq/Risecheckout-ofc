/**
 * API para buscar métricas agregadas do dashboard via RPC Proxy
 * 
 * @module dashboard/api
 * @version 2.0.0 - RISE V3 Compliant (Timezone Support)
 */

import { getDashboardMetricsRpc } from "@/lib/rpc/rpcProxy";
import { timezoneService } from "@/lib/timezone";
import type { RpcDashboardMetrics } from "../types";

/**
 * Busca métricas agregadas do banco via RPC Proxy
 * 
 * Uses the centralized TimezoneService to convert dates
 * to the correct boundaries for São Paulo timezone.
 */
export async function fetchAggregatedMetrics(
  vendorId: string,
  startDate: Date,
  endDate: Date
): Promise<RpcDashboardMetrics> {
  // Use timezone service for accurate date boundaries
  const startOfDay = timezoneService.toStartOfDay(startDate);
  const endOfDay = timezoneService.toEndOfDay(endDate);
  
  console.log(`[fetchAggregatedMetrics] Timezone: ${timezoneService.timezone}, Start: ${startOfDay}, End: ${endOfDay}`);
  
  const { data, error } = await getDashboardMetricsRpc(
    vendorId,
    startOfDay,
    endOfDay
  );

  if (error) {
    console.error("[fetchAggregatedMetrics] Erro ao buscar métricas:", error);
    throw error;
  }

  return data as unknown as RpcDashboardMetrics;
}
