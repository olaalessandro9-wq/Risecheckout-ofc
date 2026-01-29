/**
 * Product Handlers for admin-data - Part 1
 * 
 * RISE Protocol V3 - 10.0/10 Compliant
 * Uses 'users' table as SSOT for vendor name queries
 * 
 * Handles: check-unique-name, admin-products, admin-products-global,
 *          product-offers, order-bumps
 * 
 * @version 2.0.0 - Migrated from profiles to users (SSOT)
 * @see products-detail.ts for remaining handlers
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../types.ts";
import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("admin-data/products");

// ==========================================
// CHECK UNIQUE NAME
// ==========================================

export async function checkUniqueName(
  supabase: SupabaseClient,
  baseName: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let candidate = baseName;
  let suffix = 2;
  
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("name", candidate)
      .limit(1);
    
    if (error) {
      log.error("Check unique name error", error);
      return errorResponse("Erro ao verificar nome", "DB_ERROR", corsHeaders, 500);
    }
    
    if (!data || data.length === 0) {
      return jsonResponse({ uniqueName: candidate }, corsHeaders);
    }
    
    candidate = baseName.includes('(Cópia)') 
      ? `${baseName.replace(/\s*\(Cópia.*?\)/, '')} (Cópia ${suffix})` 
      : `${baseName} (${suffix})`;
    suffix++;
  }
}

// ==========================================
// ADMIN PRODUCTS
// ==========================================

export async function getAdminProducts(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (role?.role !== "owner") {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  // RISE V3: Use 'users' table as SSOT for vendor names
  const [productsResult, usersResult, ordersResult] = await Promise.all([
    supabase.from("products").select("id, name, price, status, created_at, user_id"),
    supabase.from("users").select("id, name"),
    supabase.from("orders").select("product_id, amount_cents, status"),
  ]);

  if (productsResult.error) throw productsResult.error;
  if (usersResult.error) throw usersResult.error;
  if (ordersResult.error) throw ordersResult.error;

  const metricsMap = new Map<string, { gmv: number; count: number }>();
  ordersResult.data?.forEach((order) => {
    if (order.status === "paid") {
      const current = metricsMap.get(order.product_id) || { gmv: 0, count: 0 };
      metricsMap.set(order.product_id, {
        gmv: current.gmv + (order.amount_cents || 0),
        count: current.count + 1,
      });
    }
  });

  const products = productsResult.data.map((product) => {
    const vendor = usersResult.data.find((u) => u.id === product.user_id);
    const metrics = metricsMap.get(product.id) || { gmv: 0, count: 0 };
    return {
      ...product,
      vendor_name: vendor?.name || "Desconhecido",
      total_gmv: metrics.gmv,
      orders_count: metrics.count,
    };
  });

  return jsonResponse({ products }, corsHeaders);
}

// ==========================================
// ADMIN PRODUCTS GLOBAL
// ==========================================

export async function getAdminProductsGlobal(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (roleError || !role || role.role !== "owner") {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, status, created_at, user_id");

  if (productsError) {
    log.error("Products error", productsError);
    return errorResponse("Erro ao buscar produtos", "DB_ERROR", corsHeaders, 500);
  }

  // RISE V3: Use 'users' table as SSOT
  const { data: usersData } = await supabase.from("users").select("id, name");
  const { data: ordersData } = await supabase.from("orders").select("product_id, amount_cents, status");

  const metricsMap = new Map<string, { gmv: number; count: number }>();
  ordersData?.forEach((order: Record<string, unknown>) => {
    if (order.status === "paid") {
      const productId = order.product_id as string;
      const current = metricsMap.get(productId) || { gmv: 0, count: 0 };
      metricsMap.set(productId, {
        gmv: current.gmv + ((order.amount_cents as number) || 0),
        count: current.count + 1,
      });
    }
  });

  const productsWithMetrics = productsData.map((product: Record<string, unknown>) => {
    const vendor = usersData?.find((u: Record<string, unknown>) => u.id === product.user_id);
    const metrics = metricsMap.get(product.id as string) || { gmv: 0, count: 0 };
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      status: product.status || "active",
      created_at: product.created_at,
      user_id: product.user_id,
      vendor_name: vendor?.name || "Desconhecido",
      total_gmv: metrics.gmv,
      orders_count: metrics.count,
    };
  });

  return jsonResponse({ products: productsWithMetrics }, corsHeaders);
}

// ==========================================
// PRODUCT OFFERS
// ==========================================

export async function getProductOffers(
  supabase: SupabaseClient,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "active")
    .order("price", { ascending: false });

  if (error) {
    log.error("Product offers error", error);
    return errorResponse("Erro ao buscar ofertas", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ offers: data || [] }, corsHeaders);
}

// ==========================================
// ORDER BUMPS
// ==========================================

export async function getOrderBumps(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: product } = await supabase
    .from("products")
    .select("user_id")
    .eq("id", productId)
    .single();

  if (product?.user_id !== producerId) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data: checkouts } = await supabase
    .from("checkouts")
    .select("id")
    .eq("product_id", productId);

  if (!checkouts || checkouts.length === 0) {
    return jsonResponse({ orderBumps: [] }, corsHeaders);
  }

  const checkoutIds = checkouts.map(c => c.id);

  const { data, error } = await supabase
    .from("order_bumps")
    .select(`
      *,
      products!order_bumps_product_id_fkey (
        id, name, price, image_url
      ),
      offers (
        id, name, price
      )
    `)
    .in("checkout_id", checkoutIds)
    .order("position", { ascending: true });

  if (error) {
    log.error("Order bumps error", error);
    return errorResponse("Erro ao buscar order bumps", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ orderBumps: data || [] }, corsHeaders);
}
