/**
 * API para buscar métricas agregadas do dashboard via RPC Proxy
 * 
 * @module dashboard/api
 * @version 2.0.0 - RISE V3 Compliant (Timezone Support)
 */

import { getDashboardMetricsRpc } from "@/lib/rpc/rpcProxy";
import { timezoneService } from "@/lib/timezone";
import { createLogger } from "@/lib/logger";
import type { RpcDashboardMetrics } from "../types";

const log = createLogger('FetchMetrics');

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
  
  log.trace('Buscando métricas', { timezone: timezoneService.timezone, startOfDay, endOfDay });
  
  const { data, error } = await getDashboardMetricsRpc(
    vendorId,
    startOfDay,
    endOfDay
  );

  if (error) {
    log.error('Erro ao buscar métricas', error);
    throw error;
  }

  return data as unknown as RpcDashboardMetrics;
}
