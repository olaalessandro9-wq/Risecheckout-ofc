/**
 * order-bump-crud Reorder Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module order-bump-crud/handlers/reorder-handler
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { captureException } from "../../_shared/sentry.ts";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "../../_shared/rate-limiting/index.ts";
import { jsonResponse, errorResponse, verifyProductForOrderBump, resolveParentProductId } from "../helpers.ts";

export async function handleReorder(
  supabase: SupabaseClient,
  producerId: string,
  checkoutId: string | undefined,
  orderedIds: string[] | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Rate limiting
  const rateCheck = await checkRateLimit(
    supabase, 
    `producer:${producerId}`, 
    RATE_LIMIT_CONFIGS.PRODUCER_ACTION
  );
  if (!rateCheck.allowed) {
    return jsonResponse(
      { success: false, error: "Muitas requisições.", retryAfter: rateCheck.retryAfter ? 300 : undefined }, 
      corsHeaders, 
      429
    );
  }

  if (!checkoutId) {
    return errorResponse("ID do checkout é obrigatório", corsHeaders, 400);
  }
  if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
    return errorResponse("orderedIds é obrigatório", corsHeaders, 400);
  }

  // RISE V3: Resolve parent_product_id from checkoutId
  const parentProductId = await resolveParentProductId(supabase, undefined, checkoutId);
  
  if (!parentProductId) {
    return errorResponse("Checkout ou produto não encontrado", corsHeaders, 400);
  }

  const isOwner = await verifyProductForOrderBump(supabase, parentProductId, producerId);
  if (!isOwner) {
    return errorResponse("Você não tem permissão para reordenar order bumps deste produto", corsHeaders, 403);
  }

  try {
    const updates = orderedIds.map((id, index) =>
      supabase
        .from("order_bumps")
        .update({ position: index })
        .eq("id", id)
        .eq("parent_product_id", parentProductId)
    );

    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) {
      return errorResponse("Erro ao reordenar order bumps", corsHeaders, 500);
    }

    return jsonResponse({ success: true }, corsHeaders);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await captureException(err, { 
      functionName: "order-bump-crud", 
      extra: { action: "reorder", checkoutId } 
    });
    return errorResponse(`Erro ao reordenar: ${err.message}`, corsHeaders, 500);
  }
}
