/**
 * Product Entities Edge Function
 * 
 * Retorna entidades relacionadas a produtos:
 * - offers: Ofertas do produto
 * - orderBumps: Order bumps dos checkouts do produto
 * - coupons: Cupons (global)
 * - checkouts: Checkouts do produto
 * - paymentLinks: Links de pagamento do produto
 * 
 * @version 1.0.0 - RISE Protocol V2
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

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

async function getOffers(
  supabase: SupabaseClient,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[product-entities] Offers error:", error);
    return errorResponse("Erro ao buscar ofertas", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ offers: data || [] }, corsHeaders);
}

async function getOrderBumps(
  supabase: SupabaseClient,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // First get checkout IDs for this product
  const { data: checkouts, error: checkoutsError } = await supabase
    .from("checkouts")
    .select("id")
    .eq("product_id", productId);

  if (checkoutsError) {
    console.error("[product-entities] Checkouts error:", checkoutsError);
    return errorResponse("Erro ao buscar checkouts", "DB_ERROR", corsHeaders, 500);
  }

  const checkoutIds = (checkouts || []).map((c) => c.id);

  if (checkoutIds.length === 0) {
    return jsonResponse({ orderBumps: [] }, corsHeaders);
  }

  const { data, error } = await supabase
    .from("order_bumps")
    .select("*")
    .in("checkout_id", checkoutIds);

  if (error) {
    console.error("[product-entities] Order bumps error:", error);
    return errorResponse("Erro ao buscar order bumps", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ orderBumps: data || [] }, corsHeaders);
}

async function getCoupons(
  supabase: SupabaseClient,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("coupons")
    .select(`
      *,
      coupon_products (
        product_id
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[product-entities] Coupons error:", error);
    return errorResponse("Erro ao buscar cupons", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ coupons: data || [] }, corsHeaders);
}

async function getCheckouts(
  supabase: SupabaseClient,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("checkouts")
    .select(`
      *,
      products (
        name,
        price
      ),
      checkout_links (
        link_id,
        payment_links (
          offers (
            name,
            price
          )
        )
      )
    `)
    .eq("product_id", productId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[product-entities] Checkouts error:", error);
    return errorResponse("Erro ao buscar checkouts", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ checkouts: data || [] }, corsHeaders);
}

async function getPaymentLinks(
  supabase: SupabaseClient,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Get offer IDs for this product
  const { data: offers, error: offersError } = await supabase
    .from("offers")
    .select("id")
    .eq("product_id", productId);

  if (offersError) {
    console.error("[product-entities] Offers error:", offersError);
    return errorResponse("Erro ao buscar ofertas", "DB_ERROR", corsHeaders, 500);
  }

  const offerIds = (offers || []).map((o) => o.id);

  if (offerIds.length === 0) {
    return jsonResponse({ paymentLinks: [] }, corsHeaders);
  }

  // Get payment links for these offers
  const { data: links, error: linksError } = await supabase
    .from("payment_links")
    .select(`
      id,
      slug,
      url,
      status,
      offers (
        id,
        name,
        price,
        is_default,
        product_id
      )
    `)
    .in("offer_id", offerIds);

  if (linksError) {
    console.error("[product-entities] Links error:", linksError);
    return errorResponse("Erro ao buscar links", "DB_ERROR", corsHeaders, 500);
  }

  // Get checkouts for each link
  const linksWithCheckouts = await Promise.all(
    (links || []).map(async (link) => {
      const { data: checkoutLinks } = await supabase
        .from("checkout_links")
        .select("checkout_id")
        .eq("link_id", link.id);

      const checkoutIds = (checkoutLinks || []).map((cl) => cl.checkout_id);
      
      let checkouts: Array<{ id: string; name: string }> = [];
      if (checkoutIds.length > 0) {
        const { data: checkoutsData } = await supabase
          .from("checkouts")
          .select("id, name")
          .in("id", checkoutIds);
        checkouts = checkoutsData || [];
      }

      return { ...link, checkouts };
    })
  );

  return jsonResponse({ paymentLinks: linksWithCheckouts }, corsHeaders);
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

    // Authenticate using producer_session_token
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
      console.warn(`[product-entities] Producer ${producer.id} tried to access product ${productId}`);
      return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
    }

    console.log(`[product-entities] Action: ${action}, Product: ${productId}`);

    switch (action) {
      case "offers":
        return getOffers(supabase, productId, corsHeaders);
      
      case "order-bumps":
        return getOrderBumps(supabase, productId, corsHeaders);
      
      case "coupons":
        return getCoupons(supabase, corsHeaders);
      
      case "checkouts":
        return getCheckouts(supabase, productId, corsHeaders);
      
      case "payment-links":
        return getPaymentLinks(supabase, productId, corsHeaders);
      
      case "all": {
        // Get all entities in parallel
        const [offersRes, orderBumpsRes, couponsRes, checkoutsRes, paymentLinksRes] = await Promise.all([
          getOffers(supabase, productId, corsHeaders).then(r => r.json()),
          getOrderBumps(supabase, productId, corsHeaders).then(r => r.json()),
          getCoupons(supabase, corsHeaders).then(r => r.json()),
          getCheckouts(supabase, productId, corsHeaders).then(r => r.json()),
          getPaymentLinks(supabase, productId, corsHeaders).then(r => r.json()),
        ]);

        return jsonResponse({
          offers: offersRes.offers || [],
          orderBumps: orderBumpsRes.orderBumps || [],
          coupons: couponsRes.coupons || [],
          checkouts: checkoutsRes.checkouts || [],
          paymentLinks: paymentLinksRes.paymentLinks || [],
        }, corsHeaders);
      }
      
      default:
        return errorResponse(`Ação desconhecida: ${action}`, "INVALID_ACTION", corsHeaders, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[product-entities] Error:", errorMessage);
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", corsHeaders, 500);
  }
});
