/**
 * product-duplicate Edge Function
 * 
 * RISE PROTOCOL COMPLIANT - Pure Router
 * 
 * All business logic is in _shared/product-duplicate-handlers.ts
 * 
 * @version 3.0.0
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

import { jsonResponse, errorResponse, ensureUniqueName } from "../_shared/edge-helpers.ts";
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "../_shared/rate-limiting/index.ts";

import {
  verifyProductOwnership,
  duplicateProduct,
} from "../_shared/product-duplicate-handlers.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("product-duplicate");

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("product-duplicate", async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (req.method !== "POST") {
      return errorResponse("Método não permitido", corsHeaders, 405);
    }

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      return errorResponse("Corpo da requisição inválido", corsHeaders, 400);
    }

    // Auth via unified-auth
    let producerId: string;
    try {
      const producer = await requireAuthenticatedProducer(supabase, req);
      producerId = producer.id;
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    // Rate limiting (strict for expensive operation)
    const rateLimitResult = await rateLimitMiddleware(
      supabase,
      req,
      { ...RATE_LIMIT_CONFIGS.ADMIN_ACTION, action: "product_duplicate" },
      corsHeaders,
      producerId
    );
    if (rateLimitResult) {
      log.warn(`Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    const productId = (body.product_id as string) || (body.productId as string);
    if (!productId || typeof productId !== "string") {
      return errorResponse("ID do produto é obrigatório", corsHeaders, 400);
    }

    const ownershipCheck = await verifyProductOwnership(supabase, productId, producerId);
    if (!ownershipCheck.valid || !ownershipCheck.product) {
      return errorResponse("Produto não encontrado ou você não tem permissão", corsHeaders, 403);
    }

    const srcProduct = ownershipCheck.product;
    log.info(`Duplicating: ${srcProduct.name} (${productId})`);

    const result = await duplicateProduct(supabase, productId, srcProduct, producerId, ensureUniqueName);

    if (!result.success) {
      await captureException(new Error(result.error || "Unknown error"), { 
        functionName: "product-duplicate", 
        extra: { producerId, productId } 
      });
      return errorResponse(`Erro ao duplicar produto: ${result.error}`, corsHeaders, 500);
    }

    return jsonResponse({
      success: true,
      newProductId: result.newProductId,
      editUrl: `/dashboard/produtos/editar?id=${result.newProductId}`,
    }, corsHeaders);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Unexpected error:", errorMessage);
    await captureException(error instanceof Error ? error : new Error(errorMessage), { functionName: "product-duplicate" });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
