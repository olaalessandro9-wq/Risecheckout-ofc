/**
 * admin-data Edge Function
 * 
 * RISE Protocol V2 - Admin data access via Edge Function
 * 
 * Actions:
 * - security-logs: Get security audit logs (owner only)
 * - members-area-data: Get members area sections and settings
 * - members-area-modules: Get members area modules
 * - users-with-metrics: Get all users with roles, profiles and metrics
 * - admin-orders: Get orders for admin dashboard
 * - user-profile: Get user profile data for detail sheet
 * - user-products: Get products for a specific user
 * - check-unique-name: Check if product name is unique
 * - user-gateway-status: Check if user has payment gateway configured
 * 
 * @version 1.1.0
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// ==========================================
// TYPES
// ==========================================

type Action = 
  | "security-logs" 
  | "members-area-data" 
  | "members-area-modules"
  | "users-with-metrics"
  | "admin-orders"
  | "user-profile"
  | "user-products"
  | "check-unique-name"
  | "user-gateway-status";

interface RequestBody {
  action: Action;
  productId?: string;
  userId?: string;
  limit?: number;
  productName?: string;
  period?: string;
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

function errorResponse(message: string, code: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ error: message, code }, corsHeaders, status);
}

function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  const subDays = (d: Date, days: number) => new Date(d.getTime() - days * 24 * 60 * 60 * 1000);
  
  switch (period) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday":
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case "7days":
      return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
    case "30days":
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    case "all":
    default:
      return { start: new Date("2020-01-01"), end: endOfDay(now) };
  }
}

// ==========================================
// HANDLERS
// ==========================================

async function getSecurityLogs(
  supabase: SupabaseClient,
  producerId: string,
  limit: number,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (roleError || role?.role !== "owner") {
    console.warn(`[admin-data] User ${producerId} tried to access security logs without owner role`);
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data, error } = await supabase
    .from("security_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[admin-data] Security logs error:", error);
    return errorResponse("Erro ao buscar logs", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ logs: data || [] }, corsHeaders);
}

async function getMembersAreaData(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("user_id, members_area_settings")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  if (product.user_id !== producerId) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("product_members_sections")
    .select("*")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (sectionsError) {
    console.error("[admin-data] Sections error:", sectionsError);
    return errorResponse("Erro ao buscar seções", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({
    sections: sections || [],
    settings: product.members_area_settings || {},
  }, corsHeaders);
}

async function getMembersAreaModules(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("user_id")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  if (product.user_id !== producerId) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data, error } = await supabase
    .from("product_member_modules")
    .select("*")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) {
    console.error("[admin-data] Modules error:", error);
    return errorResponse("Erro ao buscar módulos", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ modules: data || [] }, corsHeaders);
}

async function getUsersWithMetrics(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Check if user is admin or owner
  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (roleError || !role || (role.role !== "owner" && role.role !== "admin")) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  // Fetch roles
  const { data: rolesData, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id, role");

  if (rolesError) throw rolesError;

  // Fetch profiles
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, name, registration_source");

  if (profilesError) throw profilesError;

  // Fetch order metrics
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select("vendor_id, amount_cents, platform_fee_cents, status");

  if (ordersError) throw ordersError;

  // Aggregate metrics per user
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

  // Combine data
  const usersWithRoles = rolesData.map((roleRow: Record<string, unknown>) => {
    const profile = profilesData.find((p: Record<string, unknown>) => p.id === roleRow.user_id);
    const metrics = metricsMap.get(roleRow.user_id as string) || { gmv: 0, fees: 0, count: 0 };
    return {
      user_id: roleRow.user_id,
      role: roleRow.role,
      profile: profile ? { name: profile.name || "Sem nome" } : null,
      total_gmv: metrics.gmv,
      total_fees: metrics.fees,
      orders_count: metrics.count,
      registration_source: profile?.registration_source || "producer",
    };
  });

  return jsonResponse({ users: usersWithRoles }, corsHeaders);
}

async function getAdminOrders(
  supabase: SupabaseClient,
  producerId: string,
  period: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Check if user is admin or owner
  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (roleError || !role || (role.role !== "owner" && role.role !== "admin")) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { start, end } = getDateRange(period);

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      customer_name,
      customer_email,
      customer_phone,
      customer_document,
      amount_cents,
      status,
      payment_method,
      vendor_id,
      created_at,
      product:product_id (
        id,
        name,
        image_url,
        user_id
      )
    `)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[admin-data] Orders error:", error);
    return errorResponse("Erro ao buscar pedidos", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ orders: orders || [] }, corsHeaders);
}

async function getUserProfile(
  supabase: SupabaseClient,
  targetUserId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Check if user is admin or owner
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
    console.error("[admin-data] Profile error:", error);
    return errorResponse("Perfil não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  return jsonResponse({ profile: data }, corsHeaders);
}

async function getUserProducts(
  supabase: SupabaseClient,
  targetUserId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Check if user is admin or owner
  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (roleError || !role || (role.role !== "owner" && role.role !== "admin")) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  // Fetch products
  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select("id, name, status, price")
    .eq("user_id", targetUserId);

  if (productsError) {
    console.error("[admin-data] Products error:", productsError);
    return errorResponse("Erro ao buscar produtos", "DB_ERROR", corsHeaders, 500);
  }

  // Fetch order metrics
  const productIds = productsData.map((p: Record<string, unknown>) => p.id);
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select("product_id, amount_cents, status")
    .in("product_id", productIds);

  if (ordersError) {
    console.error("[admin-data] Orders error:", ordersError);
    return errorResponse("Erro ao buscar pedidos", "DB_ERROR", corsHeaders, 500);
  }

  // Aggregate metrics per product
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

async function checkUniqueName(
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

async function getUserGatewayStatus(
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
// MAIN HANDLER
// ==========================================

serve(async (req) => {
  const corsResult = handleCors(req);
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

    const body = await req.json() as RequestBody;
    const { action, productId, userId, limit = 100, productName, period = "all" } = body;

    console.log(`[admin-data] Action: ${action}, Producer: ${producer.id}`);

    switch (action) {
      case "security-logs":
        return getSecurityLogs(supabase, producer.id, limit, corsHeaders);

      case "members-area-data":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getMembersAreaData(supabase, productId, producer.id, corsHeaders);

      case "members-area-modules":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getMembersAreaModules(supabase, productId, producer.id, corsHeaders);

      case "users-with-metrics":
        return getUsersWithMetrics(supabase, producer.id, corsHeaders);

      case "admin-orders":
        return getAdminOrders(supabase, producer.id, period, corsHeaders);

      case "user-profile":
        if (!userId) {
          return errorResponse("userId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getUserProfile(supabase, userId, producer.id, corsHeaders);

      case "user-products":
        if (!userId) {
          return errorResponse("userId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getUserProducts(supabase, userId, producer.id, corsHeaders);

      case "check-unique-name":
        if (!productName) {
          return errorResponse("productName é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return checkUniqueName(supabase, productName, corsHeaders);

      case "user-gateway-status":
        return getUserGatewayStatus(supabase, producer.id, corsHeaders);

      default:
        return errorResponse(`Ação desconhecida: ${action}`, "INVALID_ACTION", corsHeaders, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[admin-data] Error:", errorMessage);
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", corsHeaders, 500);
  }
});
