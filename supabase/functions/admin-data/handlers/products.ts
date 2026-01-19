/**
 * Product Handlers for admin-data
 * 
 * Handles: check-unique-name, admin-products, product-detail-admin, admin-products-global,
 *          product-offers, order-bumps, order-bump-detail, gateway-connections,
 *          check-unique-checkout-name
 * 
 * @see RISE Protocol V3 - Limite 300 linhas por arquivo
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../types.ts";

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
      console.error("[admin-data] Check unique name error:", error);
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

  const [productsResult, profilesResult, ordersResult] = await Promise.all([
    supabase.from("products").select("id, name, price, status, created_at, user_id"),
    supabase.from("profiles").select("id, name"),
    supabase.from("orders").select("product_id, amount_cents, status"),
  ]);

  if (productsResult.error) throw productsResult.error;
  if (profilesResult.error) throw profilesResult.error;
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
    const vendor = profilesResult.data.find((p) => p.id === product.user_id);
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
    console.error("[admin-data] Products error:", productsError);
    return errorResponse("Erro ao buscar produtos", "DB_ERROR", corsHeaders, 500);
  }

  const { data: profilesData } = await supabase.from("profiles").select("id, name");
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
    const vendor = profilesData?.find((p: Record<string, unknown>) => p.id === product.user_id);
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
    console.error("[admin-data] Product offers error:", error);
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
    console.error("[admin-data] Order bumps error:", error);
    return errorResponse("Erro ao buscar order bumps", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ orderBumps: data || [] }, corsHeaders);
}

// ==========================================
// ORDER BUMP DETAIL
// ==========================================

export async function getOrderBumpDetail(
  supabase: SupabaseClient,
  orderBumpId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("order_bumps")
    .select("*")
    .eq("id", orderBumpId)
    .single();

  if (error) throw error;

  return jsonResponse({ orderBump: data }, corsHeaders);
}

// ==========================================
// GATEWAY CONNECTIONS
// ==========================================

export async function getGatewayConnections(
  supabase: SupabaseClient,
  producerId: string,
  affiliationProductId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: productData } = await supabase
    .from("products")
    .select("affiliate_gateway_settings")
    .eq("id", affiliationProductId)
    .single();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")
    .eq("id", producerId)
    .single();

  const { data: pushinpayData } = await supabase
    .from("payment_gateway_settings")
    .select("pushinpay_account_id, pushinpay_token")
    .eq("user_id", producerId)
    .single();

  const connections: Record<string, boolean> = {
    asaas: !!profileData?.asaas_wallet_id,
    mercadopago: !!profileData?.mercadopago_collector_id,
    stripe: !!profileData?.stripe_account_id,
    pushinpay: !!(pushinpayData?.pushinpay_token && pushinpayData?.pushinpay_account_id),
  };

  const credentials = {
    asaas_wallet_id: profileData?.asaas_wallet_id,
    mercadopago_collector_id: profileData?.mercadopago_collector_id,
    stripe_account_id: profileData?.stripe_account_id,
    pushinpay_account_id: pushinpayData?.pushinpay_account_id,
  };

  return jsonResponse({
    productSettings: productData?.affiliate_gateway_settings || {},
    connections,
    credentials,
  }, corsHeaders);
}

// ==========================================
// CHECK UNIQUE CHECKOUT NAME
// ==========================================

export async function checkUniqueCheckoutName(
  supabase: SupabaseClient,
  productId: string,
  baseName: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let candidate = baseName;
  let suffix = 2;
  
  while (true) {
    const { data, error } = await supabase
      .from("checkouts")
      .select("id")
      .eq("product_id", productId)
      .eq("name", candidate)
      .limit(1);
    
    if (error) {
      console.error("[admin-data] Check unique checkout name error:", error);
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
// PRODUCT DETAIL ADMIN
// ==========================================

export async function getProductDetailAdmin(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (roleError || !role || (role.role !== "owner" && role.role !== "admin")) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, description, price, image_url, status, support_name, support_email, created_at, user_id")
    .eq("id", productId)
    .single();

  if (productError) {
    console.error("[admin-data] Product detail error:", productError);
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  let vendorName = "Desconhecido";
  if (product.user_id) {
    const { data: vendor } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", product.user_id)
      .maybeSingle();
    vendorName = vendor?.name || "Desconhecido";
  }

  const { data: offers } = await supabase
    .from("offers")
    .select("id, name, price, status, is_default")
    .eq("product_id", productId)
    .eq("status", "active")
    .order("is_default", { ascending: false });

  return jsonResponse({
    product,
    vendorName,
    offers: offers || [],
  }, corsHeaders);
}
