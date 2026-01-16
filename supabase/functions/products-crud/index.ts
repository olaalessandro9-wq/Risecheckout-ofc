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
 * 
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// ==========================================
// TYPES
// ==========================================

type Action = "list" | "get" | "get-settings" | "check-credentials";

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
    const { action, productId, excludeDeleted = true } = body;

    console.log(`[products-crud] Action: ${action}, Producer: ${producer.id}`);

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

      default:
        return errorResponse(`Ação desconhecida: ${action}`, "INVALID_ACTION", corsHeaders, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[products-crud] Error:", errorMessage);
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", corsHeaders, 500);
  }
});
