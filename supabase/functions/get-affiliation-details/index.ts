/**
 * get-affiliation-details Edge Function
 * 
 * @version 5.0.0 - RISE Protocol V3 Compliant
 * - Uses Shared Kernel for queries and types
 * - Parallel queries for optimal performance
 * - Under 150 lines
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { maskId } from "../_shared/kernel/security/pii-masking.ts";
import {
  fetchAffiliationWithValidation,
  fetchProductData,
  fetchOffers,
  fetchCheckouts,
  fetchPixels,
  fetchProducerProfile,
  fetchOtherProducts,
  mapOffersWithPaymentSlug,
  mapCheckoutsWithPaymentSlug,
  extractGatewaySettings,
  type ProducerRecord,
  type MarketplaceProduct,
} from "../_shared/affiliation-queries/index.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

interface RequestBody {
  affiliation_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authentication
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = producer.id;
    console.log(`[get-affiliation-details] User: ${maskId(producer.id)}`);

    // Get affiliation_id from body
    const body = await req.json() as RequestBody;
    const { affiliation_id } = body;

    if (!affiliation_id) {
      return new Response(
        JSON.stringify({ error: "affiliation_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // BATCH 1: Fetch affiliation with ownership validation
    const { affiliation, error: affiliationError } = await fetchAffiliationWithValidation(
      supabase, affiliation_id, userId
    );

    if (affiliationError || !affiliation) {
      const status = affiliationError?.includes("permissão") ? 403 : 
                     affiliationError?.includes("encontrada") ? 404 : 500;
      return new Response(
        JSON.stringify({ error: affiliationError || "Erro ao buscar afiliação" }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const productId = affiliation.product_id;

    // BATCH 2: Parallel queries for product-related data
    const [product, offers, checkouts, pixels] = await Promise.all([
      fetchProductData(supabase, productId),
      fetchOffers(supabase, productId),
      fetchCheckouts(supabase, productId),
      fetchPixels(supabase, affiliation_id),
    ]);

    // BATCH 3: Producer data (if product exists)
    let producerProfile: ProducerRecord | null = null;
    let otherProducts: MarketplaceProduct[] = [];

    if (product?.user_id) {
      [producerProfile, otherProducts] = await Promise.all([
        fetchProducerProfile(supabase, product.user_id),
        fetchOtherProducts(supabase, product.user_id, productId),
      ]);
    }

    // Calculate effective commission rate
    const effectiveCommissionRate = 
      affiliation.commission_rate ?? 
      (product?.affiliate_settings?.defaultRate || 0);

    // Build response
    const affiliationResponse = {
      id: affiliation.id,
      affiliate_code: affiliation.affiliate_code,
      commission_rate: effectiveCommissionRate,
      status: affiliation.status,
      total_sales_count: affiliation.total_sales_count || 0,
      total_sales_amount: affiliation.total_sales_amount || 0,
      created_at: affiliation.created_at,
      product: product ? {
        id: product.id,
        name: product.name,
        description: product.description,
        image_url: product.image_url,
        price: product.price,
        marketplace_description: product.marketplace_description,
        marketplace_rules: product.marketplace_rules,
        marketplace_category: product.marketplace_category,
        user_id: product.user_id,
        affiliate_settings: product.affiliate_settings,
      } : null,
      offers: mapOffersWithPaymentSlug(offers),
      checkouts: mapCheckoutsWithPaymentSlug(checkouts),
      producer: producerProfile,
      pixels,
      pix_gateway: affiliation.pix_gateway || null,
      credit_card_gateway: affiliation.credit_card_gateway || null,
      // gateway_credentials REMOVED - RISE V3 Solution D
      // Affiliates inherit credentials from their own profile
      allowed_gateways: extractGatewaySettings(product),
    };

    console.log(`[get-affiliation-details] Success for ${maskId(affiliation_id)}`);

    return new Response(
      JSON.stringify({ affiliation: affiliationResponse, otherProducts }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[get-affiliation-details] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
