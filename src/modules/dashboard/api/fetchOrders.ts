/**
 * API para buscar pedidos do dashboard via Edge Function
 * 
 * @module dashboard/api
 * @version 2.0.0 - RISE V3 Compliant (Timezone Support)
 */

import { api } from "@/lib/api";
import { timezoneService, DEFAULT_TIMEZONE } from "@/lib/timezone";
import type { Order } from "../types";

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
  
  console.log(`[fetchRecentOrders] Timezone: ${timezoneService.timezone}, Start: ${startOfDay}, End: ${endOfDay}`);
  
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
    console.error(
      "[fetchRecentOrders] Erro ao buscar pedidos:",
      error.message
    );
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
  
  console.log(`[fetchChartOrders] Timezone: ${timezoneService.timezone}, Start: ${startOfDay}, End: ${endOfDay}`);
  
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
    console.error(
      "[fetchChartOrders] Erro ao buscar pedidos para gráfico:",
      error.message
    );
    throw new Error(error.message);
  }

  return data?.orders || [];
}
