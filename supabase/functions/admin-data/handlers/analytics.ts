/**
 * Analytics Handlers for admin-data
 * 
 * Handles: admin-analytics-financial, admin-analytics-traffic, admin-analytics-top-sellers
 * 
 * @see RISE Protocol V3 - Limite 300 linhas por arquivo
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse, getDateRange } from "../types.ts";
import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("admin-data/analytics");

// ==========================================
// FINANCIAL ANALYTICS
// ==========================================

export async function getAdminAnalyticsFinancial(
  supabase: SupabaseClient,
  producerId: string,
  period: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (role?.role !== "owner" && role?.role !== "admin") {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { start, end } = getDateRange(period);

  const { data: orders, error } = await supabase
    .from("orders")
    .select("amount_cents, platform_fee_cents, vendor_id, status, paid_at")
    .eq("status", "paid")
    .gte("paid_at", start.toISOString())
    .lte("paid_at", end.toISOString());

  if (error) {
    log.error("Financial analytics error", error);
    throw error;
  }

  const data = orders || [];
  const totalPlatformFees = data.reduce((sum, o) => sum + (o.platform_fee_cents || 0), 0);
  const totalGMV = data.reduce((sum, o) => sum + (o.amount_cents || 0), 0);
  const totalPaidOrders = data.length;
  const averageTicket = totalPaidOrders > 0 ? totalGMV / totalPaidOrders : 0;
  const uniqueVendors = new Set(data.map((o) => o.vendor_id));

  return jsonResponse({
    totalPlatformFees,
    totalGMV,
    totalPaidOrders,
    averageTicket,
    activeSellers: uniqueVendors.size,
    orders: data,
  }, corsHeaders);
}

// ==========================================
// TRAFFIC ANALYTICS
// ==========================================

export async function getAdminAnalyticsTraffic(
  supabase: SupabaseClient,
  producerId: string,
  period: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (role?.role !== "owner" && role?.role !== "admin") {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { start, end } = getDateRange(period);

  const [visitsResult, ordersResult] = await Promise.all([
    supabase.from("checkout_visits").select("id, ip_address, checkout_id, visited_at, utm_source").gte("visited_at", start.toISOString()).lte("visited_at", end.toISOString()),
    supabase.from("orders").select("id").eq("status", "paid").gte("paid_at", start.toISOString()).lte("paid_at", end.toISOString()),
  ]);

  if (visitsResult.error) {
    log.error("Traffic analytics error", visitsResult.error);
    throw visitsResult.error;
  }

  const visits = visitsResult.data || [];
  const uniqueIPs = new Set(visits.map((v) => v.ip_address).filter(Boolean));
  const uniqueCheckouts = new Set(visits.map((v) => v.checkout_id));
  const paidOrders = (ordersResult.data || []).length;
  const conversionRate = visits.length > 0 ? (paidOrders / visits.length) * 100 : 0;

  return jsonResponse({
    totalVisits: visits.length,
    uniqueVisitors: uniqueIPs.size,
    activeCheckouts: uniqueCheckouts.size,
    globalConversionRate: Math.round(conversionRate * 100) / 100,
    visits,
  }, corsHeaders);
}

// ==========================================
// TOP SELLERS ANALYTICS
// ==========================================

export async function getAdminAnalyticsTopSellers(
  supabase: SupabaseClient,
  producerId: string,
  period: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (role?.role !== "owner" && role?.role !== "admin") {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { start, end } = getDateRange(period);

  const { data: orders, error } = await supabase
    .from("orders")
    .select("vendor_id, amount_cents, platform_fee_cents")
    .eq("status", "paid")
    .gte("paid_at", start.toISOString())
    .lte("paid_at", end.toISOString());

  if (error) {
    log.error("Top sellers analytics error", error);
    throw error;
  }

  const vendorMap = new Map<string, { gmv: number; fees: number; count: number }>();
  (orders || []).forEach((order) => {
    const current = vendorMap.get(order.vendor_id) || { gmv: 0, fees: 0, count: 0 };
    vendorMap.set(order.vendor_id, {
      gmv: current.gmv + (order.amount_cents || 0),
      fees: current.fees + (order.platform_fee_cents || 0),
      count: current.count + 1,
    });
  });

  const vendorIds = Array.from(vendorMap.keys());
  if (vendorIds.length === 0) {
    return jsonResponse({ topSellers: [] }, corsHeaders);
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", vendorIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p.name || "Sem nome"]));

  const topSellers = Array.from(vendorMap.entries())
    .map(([vendorId, stats]) => ({
      vendorId,
      vendorName: profileMap.get(vendorId) || "Sem nome",
      totalGMV: stats.gmv,
      totalFees: stats.fees,
      ordersCount: stats.count,
    }))
    .sort((a, b) => b.totalGMV - a.totalGMV)
    .slice(0, 10);

  return jsonResponse({ topSellers }, corsHeaders);
}
