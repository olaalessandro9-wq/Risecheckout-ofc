/**
 * Product Full Loader BFF - Edge Function
 * 
 * Carrega todos os dados de um produto em uma única chamada HTTP.
 * Reduz 6 chamadas paralelas para 1 chamada BFF.
 * 
 * @module product-full-loader
 * @version RISE V3 Compliant
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";
import { fetchProduct } from "./handlers/productHandler.ts";
import { fetchOffers } from "./handlers/offersHandler.ts";
import { fetchCheckoutsAndLinks } from "./handlers/checkoutsHandler.ts";
import { fetchEntities } from "./handlers/entitiesHandler.ts";
import type { ProductFullRequest, ProductFullResponse } from "./types.ts";

const logger = createLogger("product-full-loader");

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  
  const corsHeaders = corsResult.headers;

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    // Fetch all data in parallel (3 parallel queries instead of 6 sequential)
    const [
      productResult,
      offers,
      checkoutsResult,
      entitiesResult,
    ] = await Promise.all([
      fetchProduct(supabase, productId, vendorId),
      fetchOffers(supabase, productId),
      fetchCheckoutsAndLinks(supabase, productId),
      fetchEntities(supabase, productId),
    ]);

    const response: ProductFullResponse = {
      product: productResult.product,
      upsellSettings: productResult.upsellSettings,
      affiliateSettings: productResult.affiliateSettings,
      offers,
      orderBumps: entitiesResult.orderBumps,
      checkouts: checkoutsResult.checkouts,
      paymentLinks: checkoutsResult.paymentLinks,
      coupons: entitiesResult.coupons,
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
