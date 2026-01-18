/**
 * product-crud Edge Function
 * 
 * Pure Router - Delegates all logic to _shared handlers.
 * 
 * RISE Protocol Compliant:
 * - < 150 lines
 * - Zero business logic
 * 
 * Actions:
 * - list: List products with pagination
 * - get: Get single product by ID
 * - create: Create new product
 * - update: Update existing product
 * - delete: Delete product
 * 
 * @version 2.0.0 - Added list/get actions
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "../_shared/rate-limiting/index.ts";
import {
  validateCreateProduct,
  validateUpdateProduct,
  handleCreateProduct,
  handleUpdateProduct,
  handleDeleteProduct,
  handleListProducts,
  handleGetProduct,
} from "../_shared/product-crud-handlers.ts";
import type { ProductListParams } from "../_shared/product-crud-handlers.ts";

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

serve(withSentry("product-crud", async (req) => {
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let body: Record<string, unknown> = {};
    if (req.method !== "GET") {
      try { body = await req.json(); } catch { return errorResponse("Corpo da requisição inválido", corsHeaders, 400); }
    }

    const { action } = body;
    console.log(`[product-crud] Action: ${action}, Method: ${req.method}`);

    // Auth via unified-auth
    let producerId: string;
    try {
      const producer = await requireAuthenticatedProducer(supabase, req);
      producerId = producer.id;
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    // LIST
    if (action === "list") {
      const params: ProductListParams = {
        page: typeof body.page === "number" ? body.page : 1,
        pageSize: typeof body.pageSize === "number" ? body.pageSize : 20,
        search: typeof body.search === "string" ? body.search : undefined,
        status: typeof body.status === "string" ? body.status : undefined,
        sortBy: typeof body.sortBy === "string" ? body.sortBy : undefined,
        sortOrder: body.sortOrder === "asc" || body.sortOrder === "desc" ? body.sortOrder : undefined,
      };
      return await handleListProducts(supabase, producerId, params, corsHeaders);
    }

    // GET
    if (action === "get") {
      const productId = body.productId as string;
      if (!productId) return errorResponse("ID do produto é obrigatório", corsHeaders, 400);
      return await handleGetProduct(supabase, producerId, productId, corsHeaders);
    }

    // CREATE
    if (action === "create") {
      const rateCheck = await checkRateLimit(supabase, `producer:${producerId}`, RATE_LIMIT_CONFIGS.PRODUCER_ACTION);
      if (!rateCheck.allowed) return jsonResponse({ success: false, error: "Muitas requisições", retryAfter: rateCheck.retryAfter }, corsHeaders, 429);

      const validation = validateCreateProduct((body.product as Record<string, unknown>) || body);
      if (!validation.valid) return errorResponse(validation.error!, corsHeaders, 400);

      return await handleCreateProduct(supabase, producerId, validation.sanitized!, corsHeaders);
    }

    // UPDATE
    if (action === "update") {
      const rateCheck = await checkRateLimit(supabase, `producer:${producerId}`, RATE_LIMIT_CONFIGS.PRODUCER_ACTION);
      if (!rateCheck.allowed) return jsonResponse({ success: false, error: "Muitas requisições", retryAfter: rateCheck.retryAfter }, corsHeaders, 429);

      const validation = validateUpdateProduct((body.product as Record<string, unknown>) || body);
      if (!validation.valid) return errorResponse(validation.error!, corsHeaders, 400);

      return await handleUpdateProduct(supabase, producerId, validation.productId!, validation.updates!, corsHeaders);
    }

    // DELETE
    if (action === "delete") {
      const productId = body.productId as string;
      if (!productId) return errorResponse("ID do produto é obrigatório", corsHeaders, 400);
      return await handleDeleteProduct(supabase, producerId, productId, corsHeaders);
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[product-crud] Unexpected error:", errorMessage);
    await captureException(error instanceof Error ? error : new Error(errorMessage), { functionName: "product-crud" });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
