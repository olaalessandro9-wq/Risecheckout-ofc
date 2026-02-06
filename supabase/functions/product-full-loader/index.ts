/**
 * Product Full Loader BFF - Edge Function
 * 
 * Carrega todos os dados de um produto em uma única chamada HTTP.
 * Reduz 6 chamadas paralelas para 1 chamada BFF.
 * 
 * @module product-full-loader
 * @version 2.0.0 - RISE V3 Compliant (uses _shared/entities)
 */

import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";
import {
  fetchProduct,
  fetchProductOffers,
  fetchProductOrderBumpsWithRelations,
  fetchProductCheckoutsWithRelations,
  fetchProductPaymentLinksWithRelations,
  fetchProductCoupons,
} from "../_shared/entities/index.ts";

const logger = createLogger("product-full-loader");

interface ProductFullRequest {
  action: string;
  productId: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  
  const corsHeaders = corsResult.headers;

  try {
    // Create Supabase client
    const supabase = getSupabaseClient('general');

    // Authenticate producer
    let vendorId: string;
    try {
      const authResult = await requireAuthenticatedProducer(supabase, req);
      vendorId = authResult.id;
    } catch (_authError) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autenticado" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse request body
    const body = await req.json() as ProductFullRequest;
    const { action, productId } = body;

    if (action !== "load-full") {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid action" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!productId) {
      return new Response(
        JSON.stringify({ success: false, error: "productId is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch all data in parallel using shared handlers WITH RELATIONS
    const [
      productResult,
      offers,
      orderBumps,
      checkouts,
      paymentLinks,
      coupons,
    ] = await Promise.all([
      fetchProduct(supabase, productId, vendorId),
      fetchProductOffers(supabase, productId),
      fetchProductOrderBumpsWithRelations(supabase, productId),
      fetchProductCheckoutsWithRelations(supabase, productId),
      fetchProductPaymentLinksWithRelations(supabase, productId),
      fetchProductCoupons(supabase, productId),
    ]);

    const response = {
      product: productResult.product,
      upsellSettings: productResult.upsellSettings,
      affiliateSettings: productResult.affiliateSettings,
      offers,
      orderBumps,
      checkouts,
      paymentLinks,
      coupons,
    };

    logger.info("Product full data loaded", { productId, vendorId });

    return new Response(
      JSON.stringify({ success: true, data: response }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to load product full data", { error: message });

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
