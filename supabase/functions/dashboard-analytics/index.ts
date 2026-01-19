/**
 * Dashboard Analytics Edge Function
 * 
 * Retorna métricas e analytics para o dashboard do vendor
 * 
 * REFATORADO: Usa producer_session_token em vez de JWT
 * 
 * @version 2.0.0 - RISE Protocol V2 Compliant
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// ==========================================
// TYPES
// ==========================================

interface Order {
  id: string;
  amount_cents: number;
  status: string;
  payment_method: string;
  created_at: string;
  product_id: string;
}

interface Product {
  id: string;
  name: string;
}

interface DashboardAnalytics {
  period: string;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  pendingRevenue: number;
  paymentMethods: {
    pix: number;
    creditCard: number;
  };
  conversionRate: string | number;
  salesByDay?: { date: string; amount: number; count: number }[];
  topProducts?: { id: string; name: string; revenue: number; orders: number }[];
}

// ==========================================
// HELPERS
// ==========================================

function jsonResponse(data: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ error: message }, corsHeaders, status);
}

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "7d":
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

async function fetchSalesByDay(
  supabase: SupabaseClient,
  producerId: string,
  startDate: Date,
  productId?: string
): Promise<{ date: string; amount: number; count: number }[]> {
  let query = supabase
    .from("orders")
    .select("created_at, amount_cents")
    .eq("vendor_id", producerId)
    .eq("status", "paid")
    .gte("created_at", startDate.toISOString());

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data: orders } = await query;
  if (!orders || orders.length === 0) return [];

  const salesMap = new Map<string, { amount: number; count: number }>();

  for (const order of orders) {
    const date = new Date(order.created_at).toISOString().split("T")[0];
    const existing = salesMap.get(date) || { amount: 0, count: 0 };
    salesMap.set(date, {
      amount: existing.amount + (order.amount_cents || 0),
      count: existing.count + 1,
    });
  }

  return Array.from(salesMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchTopProducts(
  supabase: SupabaseClient,
  producerId: string,
  startDate: Date
): Promise<{ id: string; name: string; revenue: number; orders: number }[]> {
  const { data: orders } = await supabase
    .from("orders")
    .select("product_id, amount_cents")
    .eq("vendor_id", producerId)
    .eq("status", "paid")
    .gte("created_at", startDate.toISOString());

  if (!orders || orders.length === 0) return [];

  const productMap = new Map<string, { revenue: number; orders: number }>();

  for (const order of orders) {
    if (!order.product_id) continue;
    const existing = productMap.get(order.product_id) || { revenue: 0, orders: 0 };
    productMap.set(order.product_id, {
      revenue: existing.revenue + (order.amount_cents || 0),
      orders: existing.orders + 1,
    });
  }

  const productIds = Array.from(productMap.keys());
  if (productIds.length === 0) return [];

  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .in("id", productIds);

  const productsById = new Map<string, string>();
  if (products) {
    for (const p of products as Product[]) {
      productsById.set(p.id, p.name);
    }
  }

  return Array.from(productMap.entries())
    .map(([id, data]) => ({
      id,
      name: productsById.get(id) || "Produto desconhecido",
      ...data,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

// ==========================================
// MAIN HANDLER
// ==========================================

serve(async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase: SupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticate using producer_session_token
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    const producerId = producer.id;
    console.log(`[dashboard-analytics] Producer: ${producerId}`);

    // Parse parameters
    const url = new URL(req.url);
    let period = url.searchParams.get("period") || "7d";
    let productId = url.searchParams.get("productId") || undefined;
    let includeDetails = url.searchParams.get("includeDetails") === "true";

    // Also check body for POST requests
    if (req.method === "POST") {
      try {
        const body = await req.json();
        period = body.period || period;
        productId = body.productId || productId;
        includeDetails = body.includeDetails ?? includeDetails;
      } catch {
        // Ignore body parse errors for GET-style requests
      }
    }

    const startDate = getStartDate(period);
    console.log(`[dashboard-analytics] Period: ${period}, StartDate: ${startDate.toISOString()}`);

    // Build orders query
    let ordersQuery = supabase
      .from("orders")
      .select("id, amount_cents, status, payment_method, created_at, product_id")
      .eq("vendor_id", producerId)
      .gte("created_at", startDate.toISOString());

    if (productId) {
      ordersQuery = ordersQuery.eq("product_id", productId);
    }

    const { data: ordersData, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error("[dashboard-analytics] Orders query error:", ordersError);
      return errorResponse("Erro ao buscar dados de pedidos", corsHeaders, 500);
    }

    const orders = (ordersData || []) as Order[];

    // Calculate metrics
    const paidOrders = orders.filter((o) => o.status === "paid");
    const pendingOrders = orders.filter((o) => o.status === "pending");

    const analytics: DashboardAnalytics = {
      period,
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      pendingOrders: pendingOrders.length,
      totalRevenue: paidOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0),
      pendingRevenue: pendingOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0),
      paymentMethods: {
        pix: orders.filter((o) => o.payment_method === "pix").length,
        creditCard: orders.filter((o) => o.payment_method === "credit_card").length,
      },
      conversionRate: orders.length
        ? ((paidOrders.length / orders.length) * 100).toFixed(2)
        : 0,
    };

    // Add detailed data if requested
    if (includeDetails) {
      analytics.salesByDay = await fetchSalesByDay(supabase, producerId, startDate, productId);
      analytics.topProducts = await fetchTopProducts(supabase, producerId, startDate);
    }

    console.log(`[dashboard-analytics] Response: ${analytics.totalOrders} orders, ${analytics.totalRevenue} revenue`);

    return jsonResponse(analytics, corsHeaders);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[dashboard-analytics] Error:", errorMessage);
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
});
