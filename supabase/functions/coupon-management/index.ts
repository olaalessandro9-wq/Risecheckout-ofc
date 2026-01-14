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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { withSentry } from "../_shared/sentry.ts";

// Handlers
import {
  handleCreateCoupon,
  handleUpdateCoupon,
  handleDeleteCoupon,
  handleListCoupons,
} from "../_shared/coupon-handlers.ts";

// Shared helpers
import {
  errorResponse,
  validateProducerSession,
} from "../_shared/edge-helpers.ts";

// ============================================
// MAIN HANDLER
// ============================================
serve(withSentry("coupon-management", async (req) => {
  const corsResult = handleCors(req);
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

    console.log(`[coupon-management] Action: ${action} (from ${bodyAction ? "body" : "url"}), Method: ${req.method}`);

    // Authentication
    const sessionToken = (body.sessionToken as string) || req.headers.get("x-producer-session-token");
    const sessionValidation = await validateProducerSession(supabase, sessionToken || "");

    if (!sessionValidation.valid) {
      console.warn(`[coupon-management] Auth failed: ${sessionValidation.error}`);
      return errorResponse(sessionValidation.error || "Não autorizado", corsHeaders, 401);
    }

    const producerId = sessionValidation.producerId!;
    console.log(`[coupon-management] Authenticated producer: ${producerId}`);

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
    console.error("[coupon-management] Unexpected error:", errorMessage);
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
