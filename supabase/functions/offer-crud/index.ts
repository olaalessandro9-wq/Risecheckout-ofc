/**
 * offer-crud Edge Function
 * 
 * Pure Router - Delegates all logic to _shared handlers.
 * 
 * RISE Protocol Compliant:
 * - < 100 lines
 * - Zero business logic
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { validateProducerSession } from "../_shared/edge-helpers.ts";
import {
  validateCreateOffer,
  validateUpdateOffer,
  handleCreateOffer,
  handleUpdateOffer,
  handleDeleteOffer,
} from "../_shared/offer-crud-handlers.ts";

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
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    console.log(`[offer-crud] Action: ${action}, Method: ${req.method}`);

    let body: Record<string, unknown> = {};
    if (req.method !== "GET") {
      try { body = await req.json(); } catch { return errorResponse("Corpo da requisição inválido", corsHeaders, 400); }
    }

    // Auth
    const sessionToken = (body.sessionToken as string) || req.headers.get("x-producer-session-token") || "";
    const sessionResult = await validateProducerSession(supabase, sessionToken);
    if (!sessionResult.valid) {
      console.warn(`[offer-crud] Auth failed: ${sessionResult.error}`);
      return errorResponse(sessionResult.error || "Não autorizado", corsHeaders, 401);
    }
    const producerId = sessionResult.producerId!;

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

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[offer-crud] Unexpected error:", err.message);
    await captureException(err, { functionName: "offer-crud", url: req.url, method: req.method });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
