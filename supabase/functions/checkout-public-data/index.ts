/**
 * Checkout Public Data Edge Function - Router
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * PUBLIC endpoint - no authentication required.
 * Pure router that delegates to specialized handlers.
 * 
 * Actions:
 * - product: Get product data by ID
 * - offer: Get offer data by checkout ID  
 * - order-bumps: Get active order bumps for a checkout
 * - affiliate: Get affiliate info
 * - resolve-and-load: BFF optimized single-call loader (RECOMMENDED)
 * - validate-coupon: Validate coupon code
 * - checkout: Get checkout data by ID
 * - product-pixels: Get tracking pixels
 * - order-by-token: Get order for success page
 * - payment-link-data: Get payment link info for redirect
 * - check-order-payment-status: Check order payment status
 * 
 * @see RISE Protocol V3 - Modular Edge Functions
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

// Handlers
import { handleProduct } from "./handlers/product-handler.ts";
import { handleOffer, handleGetCheckoutOffer } from "./handlers/offer-handler.ts";
import { handleOrderBumps } from "./handlers/order-bumps-handler.ts";
import { handleAffiliate } from "./handlers/affiliate-handler.ts";
import { handleCheckout } from "./handlers/checkout-handler.ts";
import { handleValidateCoupon } from "./handlers/coupon-handler.ts";
import { handleProductPixels } from "./handlers/pixels-handler.ts";
import { handleOrderByToken, handleCheckOrderPaymentStatus, handleGetCheckoutSlugByOrder } from "./handlers/order-handler.ts";
import { handlePaymentLinkData } from "./handlers/payment-link-handler.ts";
import { handleResolveAndLoad, handleAll } from "./handlers/resolve-and-load-handler.ts";

import type { RequestBody, HandlerContext } from "./types.ts";

const log = createLogger("checkout-public-data");

serve(async (req) => {
  // CORS handling - dynamic origin validation
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  // Helper to create JSON responses with CORS headers
  const jsonResponse = (data: unknown, status = 200): Response => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  };

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: RequestBody = await req.json();
    const { action } = body;

    log.info(`Action: ${action}`);

    // Build handler context
    const ctx: HandlerContext = { supabase, body, jsonResponse };

    // Route to appropriate handler
    switch (action) {
      case "product":
        return handleProduct(ctx);

      case "offer":
        return handleOffer(ctx);

      case "get-checkout-offer":
        return handleGetCheckoutOffer(ctx);

      case "order-bumps":
        return handleOrderBumps(ctx);

      case "affiliate":
        return handleAffiliate(ctx);

      case "checkout":
        return handleCheckout(ctx);

      case "validate-coupon":
        return handleValidateCoupon(ctx);

      case "product-pixels":
        return handleProductPixels(ctx);

      case "order-by-token":
        return handleOrderByToken(ctx);

      case "check-order-payment-status":
        return handleCheckOrderPaymentStatus(ctx);

      case "get-checkout-slug-by-order":
        return handleGetCheckoutSlugByOrder(ctx);

      case "payment-link-data":
        return handlePaymentLinkData(ctx);

      case "resolve-and-load":
        return handleResolveAndLoad(ctx);

      case "all":
        return handleAll(ctx);

      default:
        return jsonResponse({ error: "Ação desconhecida" }, 400);
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error("Error:", err.message);
    return jsonResponse({ error: "Erro interno" }, 500);
  }
});
