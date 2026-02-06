/**
 * Product Entities Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Retorna entidades relacionadas a produtos:
 * - offers: Ofertas do produto
 * - orderBumps: Order bumps dos checkouts do produto
 * - coupons: Cupons vinculados ao produto (via coupon_products)
 * - checkouts: Checkouts do produto
 * - paymentLinks: Links de pagamento do produto
 * 
 * @module product-entities
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";
import {
  fetchActiveProductOffers,
  fetchProductOrderBumps,
  fetchProductCheckoutsWithRelations,
  fetchProductPaymentLinksWithRelations,
  fetchProductCoupons,
} from "../_shared/entities/index.ts";

const log = createLogger("product-entities");

// ==========================================
// TYPES
// ==========================================

type Action = 
  | "offers" 
  | "order-bumps" 
  | "coupons" 
  | "checkouts" 
  | "payment-links"
  | "all";

interface RequestBody {
  action: Action;
  productId: string;
}

// ==========================================
// HELPERS
// ==========================================

function jsonResponse(
  data: unknown, 
  corsHeaders: Record<string, string>, 
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(
  message: string, 
  code: string, 
  corsHeaders: Record<string, string>, 
  status = 400
): Response {
  return jsonResponse({ error: message, code }, corsHeaders, status);
}

// ==========================================
// MAIN HANDLER
// ==========================================

serve(async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase: SupabaseClient = getSupabaseClient('general');

    // Authenticate using unified auth (__Secure-rise_access cookie)
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    const body = await req.json() as RequestBody;
    const { action, productId } = body;

    if (!productId) {
      return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
    }

    // Validate ownership
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, user_id")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return errorResponse("Produto não encontrado", "NOT_FOUND", corsHeaders, 404);
    }

    if (product.user_id !== producer.id) {
      log.warn(`Producer ${producer.id} tried to access product ${productId}`);
      return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
    }

    log.info(`Action: ${action}, Product: ${productId}`);

    switch (action) {
      case "offers": {
        const offers = await fetchActiveProductOffers(supabase, productId);
        return jsonResponse({ offers }, corsHeaders);
      }
      
      case "order-bumps": {
        const orderBumps = await fetchProductOrderBumps(supabase, productId);
        return jsonResponse({ orderBumps }, corsHeaders);
      }
      
      case "coupons": {
        const coupons = await fetchProductCoupons(supabase, productId);
        return jsonResponse({ coupons }, corsHeaders);
      }
      
      case "checkouts": {
        const checkouts = await fetchProductCheckoutsWithRelations(supabase, productId);
        return jsonResponse({ checkouts }, corsHeaders);
      }
      
      case "payment-links": {
        const paymentLinks = await fetchProductPaymentLinksWithRelations(supabase, productId);
        return jsonResponse({ paymentLinks }, corsHeaders);
      }
      
      case "all": {
        // Get all entities in parallel using shared handlers
        const [offers, orderBumps, coupons, checkouts, paymentLinks] = await Promise.all([
          fetchActiveProductOffers(supabase, productId),
          fetchProductOrderBumps(supabase, productId),
          fetchProductCoupons(supabase, productId),
          fetchProductCheckoutsWithRelations(supabase, productId),
          fetchProductPaymentLinksWithRelations(supabase, productId),
        ]);

        return jsonResponse({
          offers,
          orderBumps,
          coupons,
          checkouts,
          paymentLinks,
        }, corsHeaders);
      }
      
      default:
        return errorResponse(`Ação desconhecida: ${action}`, "INVALID_ACTION", corsHeaders, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log.error("Error:", errorMessage);
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", corsHeaders, 500);
  }
});
