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

import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";

import {
  jsonResponse,
  errorResponse,
  checkRateLimit,
  recordRateLimitAttempt,
  validateProducerSession,
  ensureUniqueName,
  STRICT_RATE_LIMIT,
} from "../_shared/edge-helpers.ts";

import {
  verifyProductOwnership,
  duplicateProduct,
} from "../_shared/product-duplicate-handlers.ts";

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("product-duplicate", async (req) => {
  const corsResult = handleCors(req);
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

    // Authentication
    const sessionToken = (body.sessionToken as string) || req.headers.get("x-producer-session-token") || "";
    const sessionValidation = await validateProducerSession(supabase, sessionToken);

    if (!sessionValidation.valid) {
      return errorResponse(sessionValidation.error || "Não autorizado", corsHeaders, 401);
    }

    const producerId = sessionValidation.producerId!;

    // Rate limiting (strict for expensive operation)
    const rateCheck = await checkRateLimit(supabase, producerId, {
      ...STRICT_RATE_LIMIT,
      action: "product_duplicate",
    });
    if (!rateCheck.allowed) {
      return jsonResponse(
        { success: false, error: "Muitas duplicações. Tente novamente em alguns minutos.", retryAfter: rateCheck.retryAfter },
        corsHeaders,
        429
      );
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
    console.log(`[product-duplicate] Duplicating: ${srcProduct.name} (${productId})`);

    const result = await duplicateProduct(supabase, productId, srcProduct, producerId, ensureUniqueName);

    if (!result.success) {
      await captureException(new Error(result.error || "Unknown error"), { 
        functionName: "product-duplicate", 
        extra: { producerId, productId } 
      });
      return errorResponse(`Erro ao duplicar produto: ${result.error}`, corsHeaders, 500);
    }

    await recordRateLimitAttempt(supabase, producerId, "product_duplicate");

    return jsonResponse({
      success: true,
      newProductId: result.newProductId,
      editUrl: `/dashboard/produtos/editar?id=${result.newProductId}`,
    }, corsHeaders);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[product-duplicate] Unexpected error:", errorMessage);
    await captureException(error instanceof Error ? error : new Error(errorMessage), { functionName: "product-duplicate" });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
