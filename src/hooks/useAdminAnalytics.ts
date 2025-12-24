/**
 * useAdminAnalytics - Hook para métricas globais da plataforma (Owner/Admin)
 * 
 * Busca dados agregados de todos os vendedores para o dashboard administrativo.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, format, eachDayOfInterval } from "date-fns";

export type PeriodFilter = "today" | "yesterday" | "7days" | "30days" | "all";

interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRange(period: PeriodFilter): DateRange {
  const now = new Date();
  const today = startOfDay(now);

  switch (period) {
    case "today":
      return { start: today, end: now };
    case "yesterday":
      const yesterday = subDays(today, 1);
      return { start: yesterday, end: today };
    case "7days":
      return { start: subDays(today, 7), end: now };
    case "30days":
      return { start: subDays(today, 30), end: now };
    case "all":
    default:
      return { start: new Date("2020-01-01"), end: now };
  }
}

// ========== FINANCIAL METRICS ==========

interface FinancialMetrics {
  totalPlatformFees: number;
  totalGMV: number;
  totalPaidOrders: number;
  averageTicket: number;
  activeSellers: number;
}

interface DailyRevenue {
  date: string;
  platformFee: number;
  gmv: number;
}

export function useAdminFinancialMetrics(period: PeriodFilter) {
  const { start, end } = getDateRange(period);

  return useQuery({
    queryKey: ["admin-financial-metrics", period],
    queryFn: async (): Promise<FinancialMetrics> => {
      const { data, error } = await supabase
        .from("orders")
        .select("amount_cents, platform_fee_cents, vendor_id, status")
        .eq("status", "paid")
        .gte("paid_at", start.toISOString())
        .lte("paid_at", end.toISOString());

      if (error) throw error;

      const orders = data || [];
      const totalPlatformFees = orders.reduce((sum, o) => sum + (o.platform_fee_cents || 0), 0);
      const totalGMV = orders.reduce((sum, o) => sum + (o.amount_cents || 0), 0);
      const totalPaidOrders = orders.length;
      const averageTicket = totalPaidOrders > 0 ? totalGMV / totalPaidOrders : 0;
      const uniqueVendors = new Set(orders.map((o) => o.vendor_id));
      const activeSellers = uniqueVendors.size;

      return {
        totalPlatformFees,
        totalGMV,
        totalPaidOrders,
        averageTicket,
        activeSellers,
      };
    },
  });
}

export function useAdminDailyRevenue(period: PeriodFilter) {
  const { start, end } = getDateRange(period);

  return useQuery({
    queryKey: ["admin-daily-revenue", period],
    queryFn: async (): Promise<DailyRevenue[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("amount_cents, platform_fee_cents, paid_at")
        .eq("status", "paid")
        .gte("paid_at", start.toISOString())
        .lte("paid_at", end.toISOString());

      if (error) throw error;

      // Agrupar por dia
      const dailyMap = new Map<string, { platformFee: number; gmv: number }>();
      
      // Inicializar todos os dias do período
      const days = eachDayOfInterval({ start, end });
      days.forEach((day) => {
        const key = format(day, "dd/MM");
        dailyMap.set(key, { platformFee: 0, gmv: 0 });
      });

      // Somar valores por dia
      (data || []).forEach((order) => {
        if (!order.paid_at) return;
        const key = format(new Date(order.paid_at), "dd/MM");
        const current = dailyMap.get(key) || { platformFee: 0, gmv: 0 };
        dailyMap.set(key, {
          platformFee: current.platformFee + (order.platform_fee_cents || 0),
          gmv: current.gmv + (order.amount_cents || 0),
        });
      });

      return Array.from(dailyMap.entries()).map(([date, values]) => ({
        date,
        platformFee: values.platformFee / 100,
        gmv: values.gmv / 100,
      }));
    },
  });
}

// ========== TRAFFIC METRICS ==========

interface TrafficMetrics {
  totalVisits: number;
  uniqueVisitors: number;
  activeCheckouts: number;
  globalConversionRate: number;
}

interface DailyVisits {
  date: string;
  visits: number;
}

interface TopSource {
  source: string;
  visits: number;
}

export function useAdminTrafficMetrics(period: PeriodFilter) {
  const { start, end } = getDateRange(period);

  return useQuery({
    queryKey: ["admin-traffic-metrics", period],
    queryFn: async (): Promise<TrafficMetrics> => {
      // Buscar visitas
      const { data: visits, error: visitsError } = await supabase
        .from("checkout_visits")
        .select("id, ip_address, checkout_id")
        .gte("visited_at", start.toISOString())
        .lte("visited_at", end.toISOString());

      if (visitsError) throw visitsError;

      // Buscar pedidos pagos no mesmo período
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id")
        .eq("status", "paid")
        .gte("paid_at", start.toISOString())
        .lte("paid_at", end.toISOString());

      if (ordersError) throw ordersError;

      const allVisits = visits || [];
      const uniqueIPs = new Set(allVisits.map((v) => v.ip_address).filter(Boolean));
      const uniqueCheckouts = new Set(allVisits.map((v) => v.checkout_id));
      const paidOrders = (orders || []).length;
      const conversionRate = allVisits.length > 0 ? (paidOrders / allVisits.length) * 100 : 0;

      return {
        totalVisits: allVisits.length,
        uniqueVisitors: uniqueIPs.size,
        activeCheckouts: uniqueCheckouts.size,
        globalConversionRate: Math.round(conversionRate * 100) / 100,
      };
    },
  });
}

export function useAdminDailyVisits(period: PeriodFilter) {
  const { start, end } = getDateRange(period);

  return useQuery({
    queryKey: ["admin-daily-visits", period],
    queryFn: async (): Promise<DailyVisits[]> => {
      const { data, error } = await supabase
        .from("checkout_visits")
        .select("visited_at")
        .gte("visited_at", start.toISOString())
        .lte("visited_at", end.toISOString());

      if (error) throw error;

      // Agrupar por dia
      const dailyMap = new Map<string, number>();
      
      const days = eachDayOfInterval({ start, end });
      days.forEach((day) => {
        const key = format(day, "dd/MM");
        dailyMap.set(key, 0);
      });

      (data || []).forEach((visit) => {
        const key = format(new Date(visit.visited_at), "dd/MM");
        dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
      });

      return Array.from(dailyMap.entries()).map(([date, visits]) => ({
        date,
        visits,
      }));
    },
  });
}

export function useAdminTopSources(period: PeriodFilter) {
  const { start, end } = getDateRange(period);

  return useQuery({
    queryKey: ["admin-top-sources", period],
    queryFn: async (): Promise<TopSource[]> => {
      const { data, error } = await supabase
        .from("checkout_visits")
        .select("utm_source")
        .gte("visited_at", start.toISOString())
        .lte("visited_at", end.toISOString());

      if (error) throw error;

      // Agrupar por source
      const sourceMap = new Map<string, number>();
      (data || []).forEach((visit) => {
        const source = visit.utm_source || "Direto";
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });

      return Array.from(sourceMap.entries())
        .map(([source, visits]) => ({ source, visits }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 5);
    },
  });
}

// ========== TOP SELLERS ==========

interface TopSeller {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  totalGMV: number;
  totalFees: number;
  ordersCount: number;
}

export function useAdminTopSellers(period: PeriodFilter) {
  const { start, end } = getDateRange(period);

  return useQuery({
    queryKey: ["admin-top-sellers", period],
    queryFn: async (): Promise<TopSeller[]> => {
      // Buscar pedidos
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("vendor_id, amount_cents, platform_fee_cents")
        .eq("status", "paid")
        .gte("paid_at", start.toISOString())
        .lte("paid_at", end.toISOString());

      if (ordersError) throw ordersError;

      // Agrupar por vendor
      const vendorMap = new Map<string, { gmv: number; fees: number; count: number }>();
      (orders || []).forEach((order) => {
        const current = vendorMap.get(order.vendor_id) || { gmv: 0, fees: 0, count: 0 };
        vendorMap.set(order.vendor_id, {
          gmv: current.gmv + (order.amount_cents || 0),
          fees: current.fees + (order.platform_fee_cents || 0),
          count: current.count + 1,
        });
      });

      // Buscar perfis dos vendedores
      const vendorIds = Array.from(vendorMap.keys());
      if (vendorIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", vendorIds);

      if (profilesError) throw profilesError;

      // Buscar emails do auth.users via user_roles
      const profileMap = new Map((profiles || []).map((p) => [p.id, p.name || "Sem nome"]));

      return Array.from(vendorMap.entries())
        .map(([vendorId, stats]) => ({
          vendorId,
          vendorName: profileMap.get(vendorId) || "Sem nome",
          vendorEmail: "", // Não temos acesso direto ao email
          totalGMV: stats.gmv,
          totalFees: stats.fees,
          ordersCount: stats.count,
        }))
        .sort((a, b) => b.totalGMV - a.totalGMV)
        .slice(0, 10);
    },
  });
}
