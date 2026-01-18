/**
 * Coupon Read Edge Function
 * 
 * RISE Protocol V3 - Single Responsibility
 * Handles coupon reading operations
 * 
 * Actions:
 * - get-coupon: Retorna um cupom específico para edição
 * 
 * @version 1.0.0 - Extracted from products-crud
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// ==========================================
// TYPES
// ==========================================

type Action = "get-coupon";

interface RequestBody {
  action: Action;
  couponId?: string;
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
    console.error("[coupon-read] Get coupon error:", error);
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
      console.warn(`[coupon-read] Producer ${producerId} tried to access coupon ${couponId}`);
      return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
    }
  }

  return jsonResponse({ coupon }, corsHeaders);
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
    const { action, couponId } = body;

    console.log(`[coupon-read] Action: ${action}`);

    // All actions require authentication
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    console.log(`[coupon-read] Producer: ${producer.id}`);

    switch (action) {
      case "get-coupon":
        if (!couponId) {
          return errorResponse("couponId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getCoupon(supabase, couponId, producer.id, corsHeaders);

      default:
        return errorResponse(`Ação desconhecida: ${action}`, "INVALID_ACTION", corsHeaders, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[coupon-read] Error:", errorMessage);
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", corsHeaders, 500);
  }
});
