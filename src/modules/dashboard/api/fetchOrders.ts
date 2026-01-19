/**
 * API para buscar pedidos do dashboard via Edge Function
 * 
 * @module dashboard/api
 * @version 2.0.0 - RISE V3 Compliant (Timezone Support)
 */

import { api } from "@/lib/api";
import { timezoneService, DEFAULT_TIMEZONE } from "@/lib/timezone";
import { createLogger } from "@/lib/logger";
import type { Order } from "../types";

const log = createLogger('FetchOrders');

/**
 * Busca pedidos recentes via Edge Function (limitado a 50 para a tabela)
 * 
 * Passes the timezone to the Edge Function for accurate date filtering.
 */
export async function fetchRecentOrders(
  vendorId: string,
  startDate: Date,
  endDate: Date
): Promise<Order[]> {
  // Use timezone service for accurate date boundaries
  const startOfDay = timezoneService.toStartOfDay(startDate);
  const endOfDay = timezoneService.toEndOfDay(endDate);
  
  log.trace('Buscando pedidos recentes', { timezone: timezoneService.timezone, startOfDay, endOfDay });
  
  const { data, error } = await api.call<{ orders: Order[] }>(
    "dashboard-orders",
    {
      action: "recent",
      vendorId,
      startDate: startOfDay,
      endDate: endOfDay,
      timezone: DEFAULT_TIMEZONE,
      limit: 50,
    }
  );

  if (error) {
    log.error('Erro ao buscar pedidos recentes', error.message);
    throw new Error(error.message);
  }

  return data?.orders || [];
}

/**
 * Busca dados para o gráfico (apenas pagos, agregados por dia)
 * 
 * Passes the timezone to the Edge Function for accurate date filtering.
 */
export async function fetchChartOrders(
  vendorId: string,
  startDate: Date,
  endDate: Date
): Promise<Order[]> {
  // Use timezone service for accurate date boundaries
  const startOfDay = timezoneService.toStartOfDay(startDate);
  const endOfDay = timezoneService.toEndOfDay(endDate);
  
  log.trace('Buscando pedidos para gráfico', { timezone: timezoneService.timezone, startOfDay, endOfDay });
  
  const { data, error } = await api.call<{ orders: Order[] }>(
    "dashboard-orders",
    {
      action: "chart",
      vendorId,
      startDate: startOfDay,
      endDate: endOfDay,
      timezone: DEFAULT_TIMEZONE,
    }
  );

  if (error) {
    log.error('Erro ao buscar pedidos para gráfico', error.message);
    throw new Error(error.message);
  }

  return data?.orders || [];
}
