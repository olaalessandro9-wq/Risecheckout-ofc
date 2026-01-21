/**
 * User Handlers for admin-data
 * 
 * Handles: users-with-metrics, user-profile, user-products, user-gateway-status,
 *          role-stats, user-profile-name, user-products-simple
 * 
 * @see RISE Protocol V3 - Limite 300 linhas por arquivo
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../types.ts";
import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("admin-data/users");

// ==========================================
// USERS WITH METRICS
// ==========================================

export async function getUsersWithMetrics(
  supabase: SupabaseClient,
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

  const { data: rolesData, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id, role");

  if (rolesError) throw rolesError;

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, name, registration_source, status");

  if (profilesError) throw profilesError;

  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select("vendor_id, amount_cents, platform_fee_cents, status");

  if (ordersError) throw ordersError;

  const metricsMap = new Map<string, { gmv: number; fees: number; count: number }>();
  ordersData?.forEach((order: Record<string, unknown>) => {
    if (order.status === "paid") {
      const vendorId = order.vendor_id as string;
      const current = metricsMap.get(vendorId) || { gmv: 0, fees: 0, count: 0 };
      metricsMap.set(vendorId, {
        gmv: current.gmv + ((order.amount_cents as number) || 0),
        fees: current.fees + ((order.platform_fee_cents as number) || 0),
        count: current.count + 1,
      });
    }
  });

  const usersWithRoles = rolesData.map((roleRow: Record<string, unknown>) => {
    const profile = profilesData.find((p: Record<string, unknown>) => p.id === roleRow.user_id);
    const metrics = metricsMap.get(roleRow.user_id as string) || { gmv: 0, fees: 0, count: 0 };
    return {
      user_id: roleRow.user_id,
      role: roleRow.role,
      profile: profile ? { name: profile.name || "Sem nome" } : null,
      status: profile?.status || "active",
      total_gmv: metrics.gmv,
      total_fees: metrics.fees,
      orders_count: metrics.count,
      registration_source: profile?.registration_source || "producer",
    };
  });

  return jsonResponse({ users: usersWithRoles }, corsHeaders);
}

// ==========================================
// USER PROFILE
// ==========================================

export async function getUserProfile(
  supabase: SupabaseClient,
  targetUserId: string,
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

  const { data, error } = await supabase
    .from("profiles")
    .select("status, custom_fee_percent, status_reason, status_changed_at, created_at")
    .eq("id", targetUserId)
    .single();

  if (error) {
    log.error("Profile error", error);
    return errorResponse("Perfil não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  return jsonResponse({ profile: data }, corsHeaders);
}

// ==========================================
// USER PRODUCTS
// ==========================================

export async function getUserProducts(
  supabase: SupabaseClient,
  targetUserId: string,
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

  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select("id, name, status, price")
    .eq("user_id", targetUserId);

  if (productsError) {
    log.error("Products error", productsError);
    return errorResponse("Erro ao buscar produtos", "DB_ERROR", corsHeaders, 500);
  }

  const productIds = productsData.map((p: Record<string, unknown>) => p.id);
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select("product_id, amount_cents, status")
    .in("product_id", productIds);

  if (ordersError) {
    log.error("Orders error", ordersError);
    return errorResponse("Erro ao buscar pedidos", "DB_ERROR", corsHeaders, 500);
  }

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

  const products = productsData.map((product: Record<string, unknown>) => {
    const metrics = metricsMap.get(product.id as string) || { gmv: 0, count: 0 };
    return {
      ...product,
      total_gmv: metrics.gmv,
      orders_count: metrics.count,
    };
  });

  return jsonResponse({ products }, corsHeaders);
}

// ==========================================
// USER GATEWAY STATUS
// ==========================================

export async function getUserGatewayStatus(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")
    .eq("id", producerId)
    .maybeSingle();

  const hasMercadoPago = !!profile?.mercadopago_collector_id;
  const hasStripe = !!profile?.stripe_account_id;
  const hasAsaas = !!profile?.asaas_wallet_id;

  return jsonResponse({
    hasPaymentAccount: hasMercadoPago || hasStripe || hasAsaas,
    hasMercadoPago,
    hasStripe,
    hasAsaas,
  }, corsHeaders);
}

// ==========================================
// ROLE STATS
// ==========================================

export async function getRoleStats(
  supabase: SupabaseClient,
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

  const { data, error } = await supabase
    .from("user_roles")
    .select("role");

  if (error) {
    log.error("Role stats error", error);
    return errorResponse("Erro ao buscar estatísticas", "DB_ERROR", corsHeaders, 500);
  }

  const counts: Record<string, number> = {};
  data?.forEach((row) => {
    const r = row.role as string;
    counts[r] = (counts[r] || 0) + 1;
  });

  const roleStats = Object.entries(counts).map(([role, count]) => ({
    role,
    count,
  }));

  return jsonResponse({ roleStats }, corsHeaders);
}

// ==========================================
// USER PROFILE NAME
// ==========================================

export async function getUserProfileName(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", producerId)
    .single();

  return jsonResponse({ name: data?.name || null }, corsHeaders);
}

// ==========================================
// USER PRODUCTS SIMPLE
// ==========================================

export async function getUserProductsSimple(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .eq("user_id", producerId)
    .eq("status", "active")
    .order("name");

  if (error) {
    log.error("User products simple error", error);
    return errorResponse("Erro ao buscar produtos", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ products: data || [] }, corsHeaders);
}
