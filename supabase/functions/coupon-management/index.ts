/**
 * coupon-management Edge Function (ROUTER)
 * 
 * RISE Protocol Compliant - Refactored to Router Pattern
 * All logic delegated to _shared handlers
 * 
 * Endpoints:
 * - POST /create - Create coupon and link to product
 * - POST /update - Update coupon
 * - POST /delete - Delete coupon and links
 * - POST /list - List coupons for a product
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { withSentry } from "../_shared/sentry.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("coupon-management");

// Handlers
import {
  handleCreateCoupon,
  handleUpdateCoupon,
  handleDeleteCoupon,
  handleListCoupons,
} from "../_shared/coupon-handlers.ts";

// Shared helpers
import { errorResponse } from "../_shared/edge-helpers.ts";

// ============================================
// MAIN HANDLER
// ============================================
serve(withSentry("coupon-management", async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const urlAction = url.pathname.split("/").pop();

    // Parse body first (needed for action detection)
    let body: Record<string, unknown> = {};
    if (req.method !== "GET") {
      try {
        body = await req.json();
      } catch {
        return errorResponse("Corpo da requisição inválido", corsHeaders, 400);
      }
    }

    // Prioridade: body.action > URL path (exceto nome da função)
    const bodyAction = typeof body.action === "string" ? body.action : null;
    const action = bodyAction ?? (urlAction && urlAction !== "coupon-management" ? urlAction : null);

    if (!action) {
      return errorResponse("Ação não informada (use body.action ou path)", corsHeaders, 400);
    }

    log.info(`Action: ${action} (from ${bodyAction ? "body" : "url"}), Method: ${req.method}`);

    // Auth via unified-auth
    let producerId: string;
    try {
      const producer = await requireAuthenticatedProducer(supabase, req);
      producerId = producer.id;
      log.info(`Authenticated producer: ${producerId}`);
    } catch {
      log.warn("Auth failed");
      return unauthorizedResponse(corsHeaders);
    }

    // ============================================
    // ROUTE TO HANDLERS
    // ============================================
    const productId = (body.productId as string) || url.searchParams.get("productId") || "";
    const couponId = body.couponId as string;
    const coupon = body.coupon as Record<string, unknown>;

    switch (action) {
      case "create":
        if (req.method !== "POST") {
          return errorResponse("Método não permitido", corsHeaders, 405);
        }
        return handleCreateCoupon(supabase, productId, coupon, producerId, corsHeaders);

      case "update":
        if (req.method !== "POST" && req.method !== "PUT") {
          return errorResponse("Método não permitido", corsHeaders, 405);
        }
        return handleUpdateCoupon(supabase, couponId, productId, coupon, producerId, corsHeaders);

      case "delete":
        if (req.method !== "POST" && req.method !== "DELETE") {
          return errorResponse("Método não permitido", corsHeaders, 405);
        }
        return handleDeleteCoupon(supabase, couponId, productId, producerId, corsHeaders);

      case "list":
        return handleListCoupons(supabase, productId, producerId, corsHeaders);

      default:
        return errorResponse(`Ação não encontrada: ${action}`, corsHeaders, 404);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Unexpected error:", errorMessage);
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
