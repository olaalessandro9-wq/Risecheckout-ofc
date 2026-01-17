/**
 * API para buscar pedidos do dashboard via Edge Function
 * 
 * @module dashboard/api
 * @version RISE V3 Compliant
 */

import { api } from "@/lib/api";
import { toUTCStartOfDay, toUTCEndOfDay } from "@/lib/date-utils";
import type { Order } from "../types";

/**
 * Busca pedidos recentes via Edge Function (limitado a 50 para a tabela)
 */
export async function fetchRecentOrders(
  vendorId: string,
  startDate: Date,
  endDate: Date
): Promise<Order[]> {
  const { data, error } = await api.call<{ orders: Order[] }>(
    "dashboard-orders",
    {
      action: "recent",
      vendorId,
      startDate: toUTCStartOfDay(startDate),
      endDate: toUTCEndOfDay(endDate),
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
 */
export async function fetchChartOrders(
  vendorId: string,
  startDate: Date,
  endDate: Date
): Promise<Order[]> {
  const { data, error } = await api.call<{ orders: Order[] }>(
    "dashboard-orders",
    {
      action: "chart",
      vendorId,
      startDate: toUTCStartOfDay(startDate),
      endDate: toUTCEndOfDay(endDate),
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
