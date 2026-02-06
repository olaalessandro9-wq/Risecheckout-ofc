/**
 * order-bump-crud Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles order bump CRUD operations via modular handlers:
 * - create: Create new order bump
 * - update: Update order bump
 * - delete: Delete order bump
 * - reorder: Reorder order bumps
 * 
 * CRITICAL PRICE SEMANTICS:
 * - `original_price`: MARKETING price for strikethrough display only
 * - The REAL price charged comes from the linked offer/product
 * - `original_price` is NEVER used for billing calculations
 * 
 * @version 5.0.0 - Modularized following Clean Architecture
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

// Handlers
import { handleCreate } from "./handlers/create-handler.ts";
import { handleUpdate } from "./handlers/update-handler.ts";
import { handleDelete } from "./handlers/delete-handler.ts";
import { handleReorder } from "./handlers/reorder-handler.ts";

// Helpers
import { errorResponse } from "./helpers.ts";

import type { RequestBody, OrderBumpPayload } from "./types.ts";

const log = createLogger("order-bump-crud");

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("order-bump-crud", async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase = getSupabaseClient('general');

    // Parse body first to get action
    let body: RequestBody = {};
    if (req.method !== "GET") {
      try { 
        body = await req.json() as RequestBody; 
      } catch { 
        return errorResponse("Corpo da requisição inválido", corsHeaders, 400); 
      }
    }

    // Prioritize action from body, fallback to path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const pathAction = pathParts[pathParts.length - 1];
    const action = body.action || (pathAction !== "order-bump-crud" ? pathAction : null);

    if (!action) {
      return errorResponse("Ação não especificada", corsHeaders, 400);
    }

    // ============================================
    // AUTHENTICATION via unified-auth.ts
    // ============================================
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }
    const producerId = producer.id;

    log.info(`Action: ${action}, Producer: ${producerId}`);

    // ============================================
    // ROUTER
    // ============================================
    switch (action) {
      case "create":
        if (req.method !== "POST") {
          return errorResponse("Método não permitido", corsHeaders, 405);
        }
        return handleCreate(
          supabase, 
          producerId, 
          (body.orderBump || body) as OrderBumpPayload, 
          corsHeaders
        );

      case "update":
        if (req.method !== "PUT" && req.method !== "POST") {
          return errorResponse("Método não permitido", corsHeaders, 405);
        }
        return handleUpdate(
          supabase, 
          producerId, 
          (body.orderBump || body) as OrderBumpPayload, 
          corsHeaders
        );

      case "delete":
        if (req.method !== "DELETE" && req.method !== "POST") {
          return errorResponse("Método não permitido", corsHeaders, 405);
        }
        return handleDelete(
          supabase, 
          producerId, 
          body.order_bump_id || body.orderBumpId || body.id, 
          corsHeaders
        );

      case "reorder":
        if (req.method !== "PUT" && req.method !== "POST") {
          return errorResponse("Método não permitido", corsHeaders, 405);
        }
        return handleReorder(
          supabase, 
          producerId, 
          body.checkoutId, 
          body.orderedIds, 
          corsHeaders
        );

      default:
        return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await captureException(err, { functionName: "order-bump-crud", url: req.url, method: req.method });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
