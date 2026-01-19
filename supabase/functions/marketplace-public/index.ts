/**
 * Marketplace Public Edge Function
 * 
 * RISE Protocol V3 - Endpoints públicos do marketplace separados
 * Responsabilidade única: Servir dados públicos do marketplace
 * 
 * Actions:
 * - get-products: Lista produtos do marketplace com filtros
 * - get-product: Detalhes de um produto específico
 * - get-categories: Categorias ativas do marketplace
 * 
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("marketplace-public");

// ==========================================
// TYPES
// ==========================================

type Action = "get-products" | "get-product" | "get-categories";

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

async function getMarketplaceProducts(
  supabase: SupabaseClient,
  filters: MarketplaceFilters,
  corsHeaders: Record<string, string>
): Promise<Response> {
  let query = supabase.from("marketplace_products").select("*");

  // Category filter
  if (filters.category) {
    query = query.eq("marketplace_category", filters.category);
  }

  // Search filter
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,marketplace_description.ilike.%${filters.search}%`
    );
  }

  // Commission filters
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
    log.error("Products error:", error);
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
    log.error("Product error:", error);
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
    log.error("Categories error:", error);
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
    const { action, productId, filters } = body;

    log.info(`Action: ${action}`);

    switch (action) {
      case "get-products":
        return getMarketplaceProducts(supabase, filters || {}, corsHeaders);

      case "get-product":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getMarketplaceProduct(supabase, productId, corsHeaders);

      case "get-categories":
        return getMarketplaceCategories(supabase, corsHeaders);

      default:
        return errorResponse(`Ação desconhecida: ${action}`, "INVALID_ACTION", corsHeaders, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log.error("Error:", errorMessage);
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", corsHeaders, 500);
  }
});
