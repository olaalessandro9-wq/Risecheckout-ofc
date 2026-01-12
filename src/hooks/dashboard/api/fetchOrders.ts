/**
 * API para buscar pedidos do dashboard
 */

import { supabase } from "@/integrations/supabase/client";
import { toUTCStartOfDay, toUTCEndOfDay } from "@/lib/date-utils";
import type { Order } from "../types";

const ORDER_QUERY = `
  id,
  customer_name,
  customer_email,
  customer_phone,
  customer_document,
  amount_cents,
  status,
  payment_method,
  created_at,
  product:product_id (
    id,
    name,
    image_url,
    user_id
  )
`;

/**
 * Busca pedidos recentes do Supabase (limitado a 50 para a tabela)
 * 
 * CORREÇÃO DE TIMEZONE:
 * Usa toUTCStartOfDay/toUTCEndOfDay para garantir que a conversão
 * de datas preserve o dia/mês/ano da timezone local do usuário.
 */
export async function fetchRecentOrders(
  vendorId: string,
  startDate: Date,
  endDate: Date
): Promise<Order[]> {
  const { data: orders, error } = await supabase
    .from("orders")
    .select(ORDER_QUERY)
    .eq("vendor_id", vendorId)
    .gte("created_at", toUTCStartOfDay(startDate))
    .lte("created_at", toUTCEndOfDay(endDate))
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[fetchRecentOrders] Erro ao buscar pedidos:", error);
    throw error;
  }

  return (orders as unknown as Order[]) || [];
}

/**
 * Busca dados para o gráfico (apenas pagos, agregados por dia)
 * 
 * CORREÇÃO DE TIMEZONE:
 * Usa toUTCStartOfDay/toUTCEndOfDay para garantir que a conversão
 * de datas preserve o dia/mês/ano da timezone local do usuário.
 * 
 * CORREÇÃO CASE-INSENSITIVE:
 * Não filtra status no SQL para suportar 'paid', 'PAID', 'Paid'.
 * Filtramos no JS após a busca.
 */
export async function fetchChartOrders(
  vendorId: string,
  startDate: Date,
  endDate: Date
): Promise<Order[]> {
  const { data: orders, error } = await supabase
    .from("orders")
    .select(ORDER_QUERY)
    .eq("vendor_id", vendorId)
    // Removido: .eq("status", "paid") - filtrar case-insensitive no JS
    .gte("created_at", toUTCStartOfDay(startDate))
    .lte("created_at", toUTCEndOfDay(endDate))
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[fetchChartOrders] Erro ao buscar pedidos para gráfico:", error);
    throw error;
  }

  // Filtrar apenas status 'paid' (case-insensitive)
  return (orders as unknown as Order[])?.filter(
    order => order.status?.toLowerCase() === 'paid'
  ) || [];
}
