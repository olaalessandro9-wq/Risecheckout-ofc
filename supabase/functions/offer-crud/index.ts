/**
 * offer-crud Edge Function
 * 
 * Pure Router - Delegates all logic to _shared handlers.
 * 
 * RISE Protocol Compliant:
 * - < 120 lines
 * - Zero business logic
 * 
 * Actions:
 * - list: List offers with pagination
 * - get: Get single offer by ID
 * - create: Create new offer
 * - update: Update existing offer
 * - delete: Delete offer (soft delete)
 * 
 * @version 2.0.0 - Added list/get actions
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import {
  validateCreateOffer,
  validateUpdateOffer,
  handleCreateOffer,
  handleUpdateOffer,
  handleDeleteOffer,
  handleListOffers,
  handleGetOffer,
} from "../_shared/offer-crud-handlers.ts";
import type { OfferListParams } from "../_shared/offer-crud-handlers.ts";

// ============================================
// HELPERS
// ============================================

function jsonResponse(data: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function errorResponse(message: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}

// ============================================
// MAIN ROUTER
// ============================================

serve(withSentry("offer-crud", async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const url = new URL(req.url);
    const urlAction = url.pathname.split("/").pop();

    // Parse body first (needed for action detection)
    let body: Record<string, unknown> = {};
    if (req.method !== "GET") {
      try { body = await req.json(); } catch { return errorResponse("Corpo da requisição inválido", corsHeaders, 400); }
    }

    // Prioridade: body.action > URL path (exceto nome da função)
    const bodyAction = typeof body.action === "string" ? body.action : null;
    const action = bodyAction ?? (urlAction && urlAction !== "offer-crud" ? urlAction : null);

    if (!action) {
      return errorResponse("Ação não informada (use body.action ou path)", corsHeaders, 400);
    }

    console.log(`[offer-crud] Action: ${action} (from ${bodyAction ? "body" : "url"}), Method: ${req.method}`);

    // Auth via unified-auth
    let producerId: string;
    try {
      const producer = await requireAuthenticatedProducer(supabase, req);
      producerId = producer.id;
    } catch {
      console.warn("[offer-crud] Auth failed");
      return unauthorizedResponse(corsHeaders);
    }

    // LIST
    if (action === "list") {
      const params: OfferListParams = {
        productId: typeof body.productId === "string" ? body.productId : undefined,
        page: typeof body.page === "number" ? body.page : 1,
        pageSize: typeof body.pageSize === "number" ? body.pageSize : 20,
        status: typeof body.status === "string" ? body.status : undefined,
      };
      return await handleListOffers(supabase, producerId, params, corsHeaders);
    }

    // GET
    if (action === "get") {
      const offerId = (body.offer_id as string) || (body.offerId as string);
      if (!offerId) return errorResponse("ID da oferta é obrigatório", corsHeaders, 400);
      return await handleGetOffer(supabase, producerId, offerId, corsHeaders);
    }

    // CREATE
    if (action === "create" && req.method === "POST") {
      const validation = validateCreateOffer((body.offer as Record<string, unknown>) || body);
      if (!validation.valid) return errorResponse(validation.error!, corsHeaders, 400);
      return await handleCreateOffer(supabase, producerId, validation.sanitized!, corsHeaders);
    }

    // UPDATE
    if (action === "update" && (req.method === "PUT" || req.method === "POST")) {
      const validation = validateUpdateOffer((body.offer as Record<string, unknown>) || body);
      if (!validation.valid) return errorResponse(validation.error!, corsHeaders, 400);
      return await handleUpdateOffer(supabase, producerId, validation.offer_id!, validation.updates!, corsHeaders);
    }

    // DELETE
    if (action === "delete" && (req.method === "DELETE" || req.method === "POST")) {
      const offerId = (body.offer_id as string) || (body.offerId as string);
      if (!offerId || typeof offerId !== "string") return errorResponse("ID da oferta é obrigatório", corsHeaders, 400);
      return await handleDeleteOffer(supabase, producerId, offerId, corsHeaders);
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[offer-crud] Unexpected error:", errorMessage);
    await captureException(error instanceof Error ? error : new Error(errorMessage), { functionName: "offer-crud", url: req.url, method: req.method });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
