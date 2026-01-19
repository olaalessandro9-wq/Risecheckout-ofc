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
import { handleCorsV2 } from "../_shared/cors-v2.ts";
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
  | "user-gateway-status"
  | "role-stats"
  | "security-alerts"
  | "security-blocked-ips"
  | "security-stats"
  | "gateway-connections"
  | "product-offers"
  | "order-bumps"
  | "content-editor-data"
  | "admin-products"
  | "admin-analytics-financial"
  | "admin-analytics-traffic"
  | "admin-analytics-top-sellers"
  | "vendor-integration"
  | "payment-link-info"
  | "content-drip-settings"
  | "content-access-check"
  | "order-bump-detail"
  | "product-detail-admin"
  | "admin-products-global"
  | "marketplace-categories"
  | "marketplace-stats"
  | "user-profile-name"
  | "check-unique-checkout-name"
  | "user-products-simple"
  | "members-area-settings"
  | "members-area-modules-with-contents";

interface RequestBody {
  action: Action;
  productId?: string;
  userId?: string;
  limit?: number;
  productName?: string;
  checkoutName?: string;
  period?: string;
  affiliationProductId?: string;
  contentId?: string;
  moduleId?: string;
  isNew?: boolean;
  integrationType?: string;
  slug?: string;
  buyerId?: string;
  purchaseDate?: string;
  orderBumpId?: string;
  filters?: {
    type?: string;
    severity?: string;
    acknowledged?: boolean;
  };
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

// Role stats for admin dashboard
async function getRoleStats(
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

  const { data, error } = await supabase
    .from("user_roles")
    .select("role");

  if (error) {
    console.error("[admin-data] Role stats error:", error);
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

// Security alerts with filters
async function getSecurityAlerts(
  supabase: SupabaseClient,
  producerId: string,
  filters: { type?: string; severity?: string; acknowledged?: boolean } | undefined,
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

  let query = supabase
    .from("security_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters?.type) query = query.eq("alert_type", filters.type);
  if (filters?.severity) query = query.eq("severity", filters.severity);
  if (filters?.acknowledged !== undefined) query = query.eq("acknowledged", filters.acknowledged);

  const { data, error } = await query;

  if (error) {
    console.error("[admin-data] Security alerts error:", error);
    return errorResponse("Erro ao buscar alertas", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ alerts: data || [] }, corsHeaders);
}

// Security blocked IPs
async function getSecurityBlockedIPs(
  supabase: SupabaseClient,
  producerId: string,
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

  const { data, error } = await supabase
    .from("ip_blocklist")
    .select("*")
    .eq("is_active", true)
    .order("blocked_at", { ascending: false });

  if (error) {
    console.error("[admin-data] Blocked IPs error:", error);
    return errorResponse("Erro ao buscar IPs bloqueados", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ blockedIPs: data || [] }, corsHeaders);
}

// Security stats
async function getSecurityStats(
  supabase: SupabaseClient,
  producerId: string,
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

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [criticalResult, blockedResult, bruteForceResult, rateLimitResult, unackResult] = await Promise.all([
    supabase.from("security_alerts").select("*", { count: "exact", head: true }).eq("severity", "critical").gte("created_at", last24h),
    supabase.from("ip_blocklist").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("security_alerts").select("*", { count: "exact", head: true }).eq("alert_type", "brute_force").gte("created_at", last24h),
    supabase.from("buyer_rate_limits").select("*", { count: "exact", head: true }).not("blocked_until", "is", null).gte("last_attempt_at", last24h),
    supabase.from("security_alerts").select("*", { count: "exact", head: true }).eq("acknowledged", false),
  ]);

  return jsonResponse({
    stats: {
      criticalAlerts24h: criticalResult.count || 0,
      blockedIPsActive: blockedResult.count || 0,
      bruteForceAttempts: bruteForceResult.count || 0,
      rateLimitExceeded: rateLimitResult.count || 0,
      unacknowledgedAlerts: unackResult.count || 0,
    }
  }, corsHeaders);
}

// Gateway connections for affiliate
async function getGatewayConnections(
  supabase: SupabaseClient,
  producerId: string,
  affiliationProductId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Fetch product gateway settings
  const { data: productData } = await supabase
    .from("products")
    .select("affiliate_gateway_settings")
    .eq("id", affiliationProductId)
    .single();

  // Fetch user connections
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

// Product offers for marketplace
async function getProductOffers(
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

// Order bumps for a product
async function getOrderBumps(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Verify ownership
  const { data: product } = await supabase
    .from("products")
    .select("user_id")
    .eq("id", productId)
    .single();

  if (product?.user_id !== producerId) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  // Get checkouts
  const { data: checkouts } = await supabase
    .from("checkouts")
    .select("id")
    .eq("product_id", productId);

  if (!checkouts || checkouts.length === 0) {
    return jsonResponse({ orderBumps: [] }, corsHeaders);
  }

  const checkoutIds = checkouts.map(c => c.id);

  // Get order bumps
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

// Content editor data
async function getContentEditorData(
  supabase: SupabaseClient,
  contentId: string | undefined,
  moduleId: string | undefined,
  isNew: boolean,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const result: Record<string, unknown> = {
    content: null,
    attachments: [],
    release: null,
    moduleContents: [],
  };

  // Always fetch module contents for after_content selection
  if (moduleId) {
    const { data: contentsData } = await supabase
      .from("product_member_content")
      .select("id, title")
      .eq("module_id", moduleId)
      .eq("is_active", true)
      .order("position", { ascending: true });

    result.moduleContents = contentsData || [];
  }

  if (isNew || !contentId) {
    return jsonResponse(result, corsHeaders);
  }

  // Fetch content data
  const { data: contentData, error: contentError } = await supabase
    .from("product_member_content")
    .select("*")
    .eq("id", contentId)
    .single();

  if (contentError) {
    console.error("[admin-data] Content error:", contentError);
    return errorResponse("Conteúdo não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  result.content = contentData;

  // Fetch attachments
  const { data: attachmentsData } = await supabase
    .from("content_attachments")
    .select("*")
    .eq("content_id", contentId)
    .order("position", { ascending: true });

  result.attachments = attachmentsData || [];

  // Fetch release settings
  const { data: releaseData } = await supabase
    .from("content_release_settings")
    .select("*")
    .eq("content_id", contentId)
    .maybeSingle();

  result.release = releaseData;

  return jsonResponse(result, corsHeaders);
}

// Admin products list with metrics
async function getAdminProducts(
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

// Admin product detail
async function getAdminProductDetail(
  supabase: SupabaseClient,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, description, price, image_url, status, support_name, support_email, created_at, user_id")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  const [vendorResult, offersResult] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", product.user_id).single(),
    supabase.from("offers").select("id, name, price, status, is_default").eq("product_id", productId).eq("status", "active").order("is_default", { ascending: false }),
  ]);

  return jsonResponse({
    product,
    vendor: vendorResult.data,
    offers: offersResult.data || [],
  }, corsHeaders);
}

// Admin financial analytics
async function getAdminAnalyticsFinancial(
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

  if (error) throw error;

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

// Admin traffic analytics
async function getAdminAnalyticsTraffic(
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

  if (visitsResult.error) throw visitsResult.error;

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

// Admin top sellers
async function getAdminAnalyticsTopSellers(
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

  if (error) throw error;

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

// Vendor integration config
async function getVendorIntegration(
  supabase: SupabaseClient,
  producerId: string,
  integrationType: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("vendor_integrations")
    .select("*")
    .eq("vendor_id", producerId)
    .eq("integration_type", integrationType)
    .maybeSingle();

  if (error) throw error;

  return jsonResponse({ integration: data }, corsHeaders);
}

// Content drip settings
async function getContentDripSettings(
  supabase: SupabaseClient,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: modules } = await supabase
    .from("product_member_modules")
    .select("id")
    .eq("product_id", productId);

  if (!modules?.length) {
    return jsonResponse({ settings: [] }, corsHeaders);
  }

  const moduleIds = modules.map(m => m.id);

  const { data: contents } = await supabase
    .from("product_member_content")
    .select("id")
    .in("module_id", moduleIds);

  if (!contents?.length) {
    return jsonResponse({ settings: [] }, corsHeaders);
  }

  const contentIds = contents.map(c => c.id);

  const { data: settings } = await supabase
    .from("content_release_settings")
    .select("*")
    .in("content_id", contentIds);

  return jsonResponse({ settings: settings || [] }, corsHeaders);
}

// Content access check
async function checkContentAccess(
  supabase: SupabaseClient,
  contentId: string,
  buyerId: string,
  purchaseDate: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: settings } = await supabase
    .from("content_release_settings")
    .select("*")
    .eq("content_id", contentId)
    .maybeSingle();

  if (!settings) {
    return jsonResponse({
      content_id: contentId,
      is_accessible: true,
      unlock_date: null,
      reason: "available",
    }, corsHeaders);
  }

  const now = new Date();
  const purchase = new Date(purchaseDate);

  if (settings.release_type === "after_content" && settings.after_content_id) {
    const { data: progress } = await supabase
      .from("buyer_content_progress")
      .select("completed_at")
      .eq("buyer_id", buyerId)
      .eq("content_id", settings.after_content_id)
      .maybeSingle();

    if (!progress?.completed_at) {
      return jsonResponse({
        content_id: contentId,
        is_accessible: false,
        unlock_date: null,
        reason: "drip_locked",
      }, corsHeaders);
    }

    return jsonResponse({
      content_id: contentId,
      is_accessible: true,
      unlock_date: null,
      reason: "available",
    }, corsHeaders);
  }

  let unlockDate: Date | null = null;

  if (settings.release_type === "days_after_purchase" && settings.days_after_purchase) {
    unlockDate = new Date(purchase);
    unlockDate.setDate(unlockDate.getDate() + settings.days_after_purchase);
  } else if (settings.release_type === "fixed_date" && settings.fixed_date) {
    unlockDate = new Date(settings.fixed_date);
  }

  if (!unlockDate || now >= unlockDate) {
    return jsonResponse({
      content_id: contentId,
      is_accessible: true,
      unlock_date: unlockDate?.toISOString() || null,
      reason: "available",
    }, corsHeaders);
  }

  return jsonResponse({
    content_id: contentId,
    is_accessible: false,
    unlock_date: unlockDate.toISOString(),
    reason: "drip_locked",
  }, corsHeaders);
}

// Order bump detail
async function getOrderBumpDetail(
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

// Product detail for admin (read-only view)
async function getProductDetailAdmin(
  supabase: SupabaseClient,
  productId: string,
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

  // Fetch product
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, description, price, image_url, status, support_name, support_email, created_at, user_id")
    .eq("id", productId)
    .single();

  if (productError) {
    console.error("[admin-data] Product detail error:", productError);
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  // Fetch vendor name
  let vendorName = "Desconhecido";
  if (product.user_id) {
    const { data: vendor } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", product.user_id)
      .maybeSingle();
    vendorName = vendor?.name || "Desconhecido";
  }

  // Fetch offers
  const { data: offers, error: offersError } = await supabase
    .from("offers")
    .select("id, name, price, status, is_default")
    .eq("product_id", productId)
    .eq("status", "active")
    .order("is_default", { ascending: false });

  if (offersError) {
    console.error("[admin-data] Offers error:", offersError);
  }

  return jsonResponse({
    product,
    vendorName,
    offers: offers || [],
  }, corsHeaders);
}

// Admin products global with metrics
async function getAdminProductsGlobal(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Check if user is owner
  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerId)
    .maybeSingle();

  if (roleError || !role || role.role !== "owner") {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  // Fetch products
  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, status, created_at, user_id");

  if (productsError) {
    console.error("[admin-data] Products error:", productsError);
    return errorResponse("Erro ao buscar produtos", "DB_ERROR", corsHeaders, 500);
  }

  // Fetch profiles for vendor names
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, name");

  if (profilesError) {
    console.error("[admin-data] Profiles error:", profilesError);
  }

  // Fetch order metrics
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select("product_id, amount_cents, status");

  if (ordersError) {
    console.error("[admin-data] Orders error:", ordersError);
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

  // Combine data
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

// Marketplace categories (public data)
async function getMarketplaceCategories(
  supabase: SupabaseClient,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("marketplace_categories")
    .select("*")
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[admin-data] Marketplace categories error:", error);
    return errorResponse("Erro ao buscar categorias", "DB_ERROR", corsHeaders, 500);
  }

  // Return in standardized format expected by frontend
  return jsonResponse({ success: true, data: data || [] }, corsHeaders);
}

// Marketplace stats for a product
async function getMarketplaceStats(
  supabase: SupabaseClient,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("products")
    .select("marketplace_views, marketplace_clicks, marketplace_enabled_at")
    .eq("id", productId)
    .single();

  if (error) {
    console.error("[admin-data] Marketplace stats error:", error);
    return errorResponse("Erro ao buscar estatísticas", "DB_ERROR", corsHeaders, 500);
  }

  // Return in standardized format expected by frontend
  return jsonResponse({
    success: true,
    data: {
      views: data?.marketplace_views || 0,
      clicks: data?.marketplace_clicks || 0,
      enabledAt: data?.marketplace_enabled_at,
    }
  }, corsHeaders);
}

// User profile name (for preview)
async function getUserProfileName(
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

// Check unique checkout name
async function checkUniqueCheckoutName(
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

// Simple user products list
async function getUserProductsSimple(
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
    console.error("[admin-data] User products simple error:", error);
    return errorResponse("Erro ao buscar produtos", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ products: data || [] }, corsHeaders);
}

// Members area settings for a product
async function getMembersAreaSettings(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: product, error } = await supabase
    .from("products")
    .select("user_id, members_area_enabled, members_area_settings")
    .eq("id", productId)
    .single();

  if (error || !product) {
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  if (product.user_id !== producerId) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  return jsonResponse({
    enabled: product.members_area_enabled || false,
    settings: product.members_area_settings || null,
  }, corsHeaders);
}

// Members area modules with contents
async function getMembersAreaModulesWithContents(
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

  const { data, error } = await supabase
    .from("product_member_modules")
    .select(`*, contents:product_member_content (*)`)
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) {
    console.error("[admin-data] Modules with contents error:", error);
    return errorResponse("Erro ao buscar módulos", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ modules: data || [] }, corsHeaders);
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

      case "role-stats":
        return getRoleStats(supabase, producer.id, corsHeaders);

      case "security-alerts":
        return getSecurityAlerts(supabase, producer.id, body.filters, corsHeaders);

      case "security-blocked-ips":
        return getSecurityBlockedIPs(supabase, producer.id, corsHeaders);

      case "security-stats":
        return getSecurityStats(supabase, producer.id, corsHeaders);

      case "gateway-connections":
        if (!body.affiliationProductId) {
          return errorResponse("affiliationProductId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getGatewayConnections(supabase, producer.id, body.affiliationProductId, corsHeaders);

      case "product-offers":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getProductOffers(supabase, productId, corsHeaders);

      case "order-bumps":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getOrderBumps(supabase, productId, producer.id, corsHeaders);

      case "content-editor-data":
        return getContentEditorData(supabase, body.contentId, body.moduleId, body.isNew || false, producer.id, corsHeaders);

      case "admin-products":
        return getAdminProducts(supabase, producer.id, corsHeaders);

      case "admin-analytics-financial":
        return getAdminAnalyticsFinancial(supabase, producer.id, period, corsHeaders);

      case "admin-analytics-traffic":
        return getAdminAnalyticsTraffic(supabase, producer.id, period, corsHeaders);

      case "admin-analytics-top-sellers":
        return getAdminAnalyticsTopSellers(supabase, producer.id, period, corsHeaders);

      case "vendor-integration":
        if (!body.integrationType) {
          return errorResponse("integrationType é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getVendorIntegration(supabase, producer.id, body.integrationType, corsHeaders);

      case "content-drip-settings":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getContentDripSettings(supabase, productId, corsHeaders);

      case "content-access-check":
        if (!body.contentId || !body.buyerId || !body.purchaseDate) {
          return errorResponse("contentId, buyerId e purchaseDate são obrigatórios", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return checkContentAccess(supabase, body.contentId, body.buyerId, body.purchaseDate, corsHeaders);

      case "order-bump-detail":
        if (!body.orderBumpId) {
          return errorResponse("orderBumpId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getOrderBumpDetail(supabase, body.orderBumpId, corsHeaders);

      case "product-detail-admin":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getProductDetailAdmin(supabase, productId, producer.id, corsHeaders);

      case "admin-products-global":
        return getAdminProductsGlobal(supabase, producer.id, corsHeaders);

      case "marketplace-categories":
        return getMarketplaceCategories(supabase, corsHeaders);

      case "marketplace-stats":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getMarketplaceStats(supabase, productId, corsHeaders);

      case "user-profile-name":
        return getUserProfileName(supabase, producer.id, corsHeaders);

      case "check-unique-checkout-name":
        if (!productId || !body.checkoutName) {
          return errorResponse("productId e checkoutName são obrigatórios", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return checkUniqueCheckoutName(supabase, productId, body.checkoutName, corsHeaders);

      case "user-products-simple":
        return getUserProductsSimple(supabase, producer.id, corsHeaders);

      case "members-area-settings":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getMembersAreaSettings(supabase, productId, producer.id, corsHeaders);

      case "members-area-modules-with-contents":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getMembersAreaModulesWithContents(supabase, productId, producer.id, corsHeaders);

      default:
        return errorResponse(`Ação desconhecida: ${action}`, "INVALID_ACTION", corsHeaders, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[admin-data] Error:", errorMessage);
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", corsHeaders, 500);
  }
});
