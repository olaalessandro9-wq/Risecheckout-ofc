/**
 * Products CRUD Edge Function
 * 
 * RISE Protocol V2 - Zero direct database access from frontend
 * 
 * Actions:
 * - list: Lista produtos do produtor autenticado
 * - get: Retorna um produto específico
 * - get-settings: Retorna configurações de um produto
 * - check-credentials: Verifica credenciais de gateway configuradas
 * - get-coupon: Retorna um cupom específico para edição
 * - get-checkouts: Retorna checkouts de um produto
 * - get-profile: Retorna perfil do produtor
 * - get-offers: Retorna ofertas de um produto
 * - get-gateway-connections: Retorna conexões de gateway do produtor
 * - get-webhook-logs: Retorna logs de webhook
 * - get-video-library: Retorna biblioteca de vídeos
 * - get-marketplace: Busca produtos do marketplace (público)
 * - get-marketplace-product: Detalhes de produto do marketplace (público)
 * - get-marketplace-categories: Categorias do marketplace (público)
 * 
 * @version 1.2.0
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// ==========================================
// TYPES
// ==========================================

type Action = 
  | "list" 
  | "get" 
  | "get-settings" 
  | "check-credentials" 
  | "get-coupon" 
  | "get-checkouts"
  | "get-profile"
  | "get-offers"
  | "get-gateway-connections"
  | "get-webhook-logs"
  | "get-video-library"
  | "get-marketplace"
  | "get-marketplace-product"
  | "get-marketplace-categories";

interface MarketplaceFilters {
  category?: string;
  search?: string;
  minCommission?: number;
  maxCommission?: number;
  sortBy?: "recent" | "popular" | "commission";
  limit?: number;
  offset?: number;
  approvalImmediate?: boolean;
  approvalModeration?: boolean;
  typeEbook?: boolean;
  typeService?: boolean;
  typeCourse?: boolean;
}

interface RequestBody {
  action: Action;
  productId?: string;
  couponId?: string;
  webhookId?: string;
  excludeDeleted?: boolean;
  excludeContentId?: string;
  filters?: MarketplaceFilters;
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

// ==========================================
// HANDLERS
// ==========================================

async function listProducts(
  supabase: SupabaseClient,
  producerId: string,
  excludeDeleted: boolean,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let query = supabase
    .from("products")
    .select(`
      *,
      offers!inner(price, is_default)
    `)
    .eq("user_id", producerId)
    .eq("offers.is_default", true)
    .order("created_at", { ascending: false });

  if (excludeDeleted) {
    query = query.neq("status", "deleted");
  }

  const { data, error } = await query;

  if (error) {
    console.error("[products-crud] List error:", error);
    return errorResponse("Erro ao listar produtos", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ products: data || [] }, corsHeaders);
}

async function getProduct(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error) {
    console.error("[products-crud] Get error:", error);
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  // Verify ownership
  if (data.user_id !== producerId) {
    console.warn(`[products-crud] Producer ${producerId} tried to access product ${productId}`);
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  return jsonResponse({ product: data }, corsHeaders);
}

async function getProductSettings(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("products")
    .select("required_fields, default_payment_method, user_id, pix_gateway, credit_card_gateway")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    console.error("[products-crud] Get settings error:", error);
    return errorResponse("Erro ao buscar configurações", "DB_ERROR", corsHeaders, 500);
  }

  if (!data) {
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  // Verify ownership
  if (data.user_id !== producerId) {
    console.warn(`[products-crud] Producer ${producerId} tried to access product ${productId}`);
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  return jsonResponse({ settings: data }, corsHeaders);
}

async function checkCredentials(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const [mpResult, ppResult, stripeResult, asaasResult] = await Promise.all([
      supabase
        .from("vendor_integrations")
        .select("id")
        .eq("vendor_id", producerId)
        .eq("integration_type", "MERCADOPAGO")
        .eq("active", true)
        .maybeSingle(),
      supabase
        .from("payment_gateway_settings")
        .select("user_id")
        .eq("user_id", producerId)
        .maybeSingle(),
      supabase
        .from("vendor_integrations")
        .select("id")
        .eq("vendor_id", producerId)
        .eq("integration_type", "STRIPE")
        .eq("active", true)
        .maybeSingle(),
      supabase
        .from("vendor_integrations")
        .select("id")
        .eq("vendor_id", producerId)
        .eq("integration_type", "ASAAS")
        .eq("active", true)
        .maybeSingle(),
    ]);

    return jsonResponse({
      credentials: {
        mercadopago: { configured: !!mpResult.data },
        pushinpay: { configured: !!ppResult.data },
        stripe: { configured: !!stripeResult.data },
        asaas: { configured: !!asaasResult.data },
      },
    }, corsHeaders);
  } catch (error: unknown) {
    console.error("[products-crud] Check credentials error:", error);
    return errorResponse("Erro ao verificar credenciais", "DB_ERROR", corsHeaders, 500);
  }
}

async function getCoupon(
  supabase: SupabaseClient,
  couponId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // First get the coupon
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", couponId)
    .single();

  if (error) {
    console.error("[products-crud] Get coupon error:", error);
    return errorResponse("Cupom não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  // Get the products associated with this coupon to verify ownership
  const { data: couponProducts } = await supabase
    .from("coupon_products")
    .select("product_id")
    .eq("coupon_id", couponId);

  if (couponProducts && couponProducts.length > 0) {
    // Verify that the producer owns at least one of the products
    const { data: products } = await supabase
      .from("products")
      .select("id")
      .eq("user_id", producerId)
      .in("id", couponProducts.map(cp => cp.product_id));

    if (!products || products.length === 0) {
      console.warn(`[products-crud] Producer ${producerId} tried to access coupon ${couponId}`);
      return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
    }
  }

  return jsonResponse({ coupon }, corsHeaders);
}

async function getCheckouts(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // First verify product ownership
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("user_id")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    console.error("[products-crud] Get checkouts - product error:", productError);
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  if (product.user_id !== producerId) {
    console.warn(`[products-crud] Producer ${producerId} tried to access checkouts for product ${productId}`);
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  // Get checkouts for this product
  const { data: checkouts, error } = await supabase
    .from("checkouts")
    .select("id, name, slug, is_default, status, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[products-crud] Get checkouts error:", error);
    return errorResponse("Erro ao buscar checkouts", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ checkouts: checkouts || [] }, corsHeaders);
}

async function getProfile(
  supabase: SupabaseClient,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("profiles")
    .select("name, cpf_cnpj, phone")
    .eq("id", producerId)
    .single();

  if (error) {
    console.error("[products-crud] Get profile error:", error);
    return errorResponse("Perfil não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  return jsonResponse({ profile: data }, corsHeaders);
}

async function getOffers(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Verify ownership
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
    .from("offers")
    .select("id, product_id, price, name, updated_at")
    .eq("product_id", productId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[products-crud] Get offers error:", error);
    return errorResponse("Erro ao buscar ofertas", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ offers: data || [] }, corsHeaders);
}

async function getGatewayConnections(
  supabase: SupabaseClient,
  producerId: string,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Get product gateway settings
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("affiliate_gateway_settings, user_id")
      .eq("id", productId)
      .single();

    if (productError || !productData) {
      return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
    }

    // Get user connections
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

    return jsonResponse({
      productSettings: productData.affiliate_gateway_settings,
      connections: {
        asaas: !!profileData?.asaas_wallet_id,
        mercadopago: !!profileData?.mercadopago_collector_id,
        stripe: !!profileData?.stripe_account_id,
        pushinpay: !!(pushinpayData?.pushinpay_token && pushinpayData?.pushinpay_account_id),
      },
      credentials: {
        asaas_wallet_id: profileData?.asaas_wallet_id,
        mercadopago_collector_id: profileData?.mercadopago_collector_id,
        stripe_account_id: profileData?.stripe_account_id,
        pushinpay_account_id: pushinpayData?.pushinpay_account_id,
      },
    }, corsHeaders);
  } catch (error: unknown) {
    console.error("[products-crud] Get gateway connections error:", error);
    return errorResponse("Erro ao buscar conexões", "DB_ERROR", corsHeaders, 500);
  }
}

async function getWebhookLogs(
  supabase: SupabaseClient,
  webhookId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // First verify webhook ownership via product
  const { data: webhook, error: webhookError } = await supabase
    .from("product_webhooks")
    .select("product_id")
    .eq("id", webhookId)
    .single();

  if (webhookError || !webhook) {
    return errorResponse("Webhook não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  // Verify product ownership
  const { data: product } = await supabase
    .from("products")
    .select("user_id")
    .eq("id", webhook.product_id)
    .single();

  if (!product || product.user_id !== producerId) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data, error } = await supabase
    .from("webhook_deliveries")
    .select("*")
    .eq("webhook_id", webhookId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[products-crud] Get webhook logs error:", error);
    return errorResponse("Erro ao buscar logs", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ logs: data || [] }, corsHeaders);
}

async function getVideoLibrary(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  excludeContentId: string | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Verify ownership
  const { data: product } = await supabase
    .from("products")
    .select("user_id")
    .eq("id", productId)
    .single();

  if (!product || product.user_id !== producerId) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data, error } = await supabase
    .from("product_member_content")
    .select(`
      id,
      title,
      content_url,
      module:module_id (
        id,
        title,
        product_id
      )
    `)
    .not("content_url", "is", null)
    .eq("is_active", true);

  if (error) {
    console.error("[products-crud] Get video library error:", error);
    return errorResponse("Erro ao buscar vídeos", "DB_ERROR", corsHeaders, 500);
  }

  // Filter by product and map
  const videos = [];
  const seenUrls = new Set<string>();

  for (const item of data || []) {
    const module = item.module as { id: string; title: string; product_id: string } | null;
    if (!module || module.product_id !== productId) continue;
    if (excludeContentId && item.id === excludeContentId) continue;
    if (!item.content_url) continue;

    // Avoid duplicates
    if (seenUrls.has(item.content_url)) continue;
    seenUrls.add(item.content_url);

    videos.push({
      id: item.id,
      url: item.content_url,
      title: item.title,
      moduleTitle: module.title,
    });
  }

  return jsonResponse({ videos }, corsHeaders);
}

// Marketplace functions (public - no auth required)
async function getMarketplaceProducts(
  supabase: SupabaseClient,
  filters: MarketplaceFilters,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let query = supabase
    .from("marketplace_products")
    .select("*");

  if (filters.category) {
    query = query.eq("marketplace_category", filters.category);
  }

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,marketplace_description.ilike.%${filters.search}%`
    );
  }

  if (filters.minCommission) {
    query = query.gte("commission_percentage", filters.minCommission);
  }

  if (filters.maxCommission) {
    query = query.lte("commission_percentage", filters.maxCommission);
  }

  // Approval filters
  const approvalFilters: string[] = [];
  if (filters.approvalImmediate) {
    approvalFilters.push("requires_manual_approval.eq.false");
  }
  if (filters.approvalModeration) {
    approvalFilters.push("requires_manual_approval.eq.true");
  }
  if (approvalFilters.length === 1) {
    query = query.or(approvalFilters[0]);
  }

  // Type filters
  const typeFilters: string[] = [];
  if (filters.typeEbook) typeFilters.push("marketplace_tags.cs.{ebook}");
  if (filters.typeService) typeFilters.push("marketplace_tags.cs.{servico}");
  if (filters.typeCourse) typeFilters.push("marketplace_tags.cs.{curso}");
  if (typeFilters.length > 0 && typeFilters.length < 3) {
    query = query.or(typeFilters.join(","));
  }

  // Sorting
  switch (filters.sortBy) {
    case "recent":
      query = query.order("marketplace_enabled_at", { ascending: false });
      break;
    case "popular":
      query = query.order("popularity_score", { ascending: false });
      break;
    case "commission":
      query = query.order("commission_percentage", { ascending: false });
      break;
    default:
      query = query.order("marketplace_enabled_at", { ascending: false });
  }

  // Pagination
  if (filters.limit) query = query.limit(filters.limit);
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[products-crud] Marketplace error:", error);
    return errorResponse("Erro ao buscar produtos", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ products: data || [] }, corsHeaders);
}

async function getMarketplaceProduct(
  supabase: SupabaseClient,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("marketplace_products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error) {
    console.error("[products-crud] Marketplace product error:", error);
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  return jsonResponse({ product: data }, corsHeaders);
}

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
    console.error("[products-crud] Categories error:", error);
    return errorResponse("Erro ao buscar categorias", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ categories: data || [] }, corsHeaders);
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

    const body = await req.json() as RequestBody;
    const { action, productId, couponId, webhookId, excludeDeleted = true, excludeContentId, filters } = body;

    console.log(`[products-crud] Action: ${action}`);

    // Public actions (no auth required)
    if (action === "get-marketplace") {
      return getMarketplaceProducts(supabase, filters || {}, corsHeaders);
    }
    if (action === "get-marketplace-product") {
      if (!productId) {
        return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
      }
      return getMarketplaceProduct(supabase, productId, corsHeaders);
    }
    if (action === "get-marketplace-categories") {
      return getMarketplaceCategories(supabase, corsHeaders);
    }

    // Authenticated actions
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    console.log(`[products-crud] Producer: ${producer.id}`);

    switch (action) {
      case "list":
        return listProducts(supabase, producer.id, excludeDeleted, corsHeaders);

      case "get":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getProduct(supabase, productId, producer.id, corsHeaders);

      case "get-settings":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getProductSettings(supabase, productId, producer.id, corsHeaders);

      case "check-credentials":
        return checkCredentials(supabase, producer.id, corsHeaders);

      case "get-coupon":
        if (!couponId) {
          return errorResponse("couponId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getCoupon(supabase, couponId, producer.id, corsHeaders);

      case "get-checkouts":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getCheckouts(supabase, productId, producer.id, corsHeaders);

      case "get-profile":
        return getProfile(supabase, producer.id, corsHeaders);

      case "get-offers":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getOffers(supabase, productId, producer.id, corsHeaders);

      case "get-gateway-connections":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getGatewayConnections(supabase, producer.id, productId, corsHeaders);

      case "get-webhook-logs":
        if (!webhookId) {
          return errorResponse("webhookId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getWebhookLogs(supabase, webhookId, producer.id, corsHeaders);

      case "get-video-library":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getVideoLibrary(supabase, productId, producer.id, excludeContentId, corsHeaders);

      default:
        return errorResponse(`Ação desconhecida: ${action}`, "INVALID_ACTION", corsHeaders, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[products-crud] Error:", errorMessage);
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", corsHeaders, 500);
  }
});
