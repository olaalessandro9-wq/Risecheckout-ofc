/**
 * Products CRUD Edge Function (Core)
 * 
 * RISE Protocol V3 - Single Responsibility
 * Core product operations only
 * 
 * Actions:
 * - list: Lista produtos do produtor autenticado
 * - get: Retorna um produto específico
 * - get-settings: Retorna configurações de um produto
 * - get-offers: Retorna ofertas de um produto
 * - get-checkouts: Retorna checkouts de um produto
 * 
 * Other endpoints moved to specialized functions:
 * - producer-profile: get-profile, check-credentials, get-gateway-connections
 * - coupon-read: get-coupon
 * - content-library: get-video-library, get-webhook-logs
 * - marketplace-public: marketplace endpoints (public)
 * 
 * @version 3.0.0 - RISE V3 Single Responsibility
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("products-crud");

// ==========================================
// TYPES
// ==========================================

type Action = "list" | "get" | "get-settings" | "get-offers" | "get-checkouts";

interface RequestBody {
  action: Action;
  productId?: string;
  excludeDeleted?: boolean;
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
    log.error("List error:", error);
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
    log.error("Get error:", error);
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  // Verify ownership
  if (data.user_id !== producerId) {
    log.warn(`Producer ${producerId} tried to access product ${productId}`);
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
    log.error("Get settings error:", error);
    return errorResponse("Erro ao buscar configurações", "DB_ERROR", corsHeaders, 500);
  }

  if (!data) {
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  // Verify ownership
  if (data.user_id !== producerId) {
    log.warn(`Producer ${producerId} tried to access product ${productId}`);
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  return jsonResponse({ settings: data }, corsHeaders);
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
    log.error("Get offers error:", error);
    return errorResponse("Erro ao buscar ofertas", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ offers: data || [] }, corsHeaders);
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
    log.error("Get checkouts - product error:", productError);
    return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  if (product.user_id !== producerId) {
    log.warn(`Producer ${producerId} tried to access checkouts for product ${productId}`);
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  // Get checkouts for this product
  const { data: checkouts, error } = await supabase
    .from("checkouts")
    .select("id, name, slug, is_default, status, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (error) {
    log.error("Get checkouts error:", error);
    return errorResponse("Erro ao buscar checkouts", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ checkouts: checkouts || [] }, corsHeaders);
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

    const body = await req.json() as RequestBody;
    const { action, productId, excludeDeleted = true } = body;

    log.info(`Action: ${action}`);

    // All actions require authentication
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    log.info(`Producer: ${producer.id}`);

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

      case "get-offers":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getOffers(supabase, productId, producer.id, corsHeaders);

      case "get-checkouts":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getCheckouts(supabase, productId, producer.id, corsHeaders);

      default:
        return errorResponse(`Ação desconhecida: ${action}`, "INVALID_ACTION", corsHeaders, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log.error("Error:", errorMessage);
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", corsHeaders, 500);
  }
});
