/**
 * order-bump-crud Create Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module order-bump-crud/handlers/create-handler
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { captureException } from "../../_shared/sentry.ts";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "../../_shared/rate-limiting/index.ts";
import { jsonResponse, errorResponse, verifyProductForOrderBump, resolveParentProductId } from "../helpers.ts";
import type { OrderBumpPayload, OrderBumpRecord } from "../types.ts";

export async function handleCreate(
  supabase: SupabaseClient,
  producerId: string,
  payload: OrderBumpPayload,
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

  // RISE V3: Resolve parent_product_id
  const parentProductId = await resolveParentProductId(
    supabase, 
    payload.parent_product_id, 
    payload.checkout_id
  );
  
  if (!parentProductId) {
    return errorResponse("parent_product_id ou checkout_id é obrigatório", corsHeaders, 400);
  }
  if (!payload.product_id) {
    return errorResponse("ID do produto do bump é obrigatório", corsHeaders, 400);
  }
  if (!payload.offer_id) {
    return errorResponse("ID da oferta é obrigatório", corsHeaders, 400);
  }

  // RISE V3: Verify ownership via parent product
  const isOwner = await verifyProductForOrderBump(supabase, parentProductId, producerId);
  if (!isOwner) {
    return errorResponse("Você não tem permissão para criar order bumps neste produto", corsHeaders, 403);
  }

  // Support both field names for backwards compatibility
  const originalPriceValue = payload.original_price ?? payload.discount_price;
  
  if (payload.discount_enabled && originalPriceValue !== undefined) {
    if (typeof originalPriceValue !== "number" || originalPriceValue <= 0) {
      return errorResponse("Preço de origem (marketing) deve ser um valor positivo", corsHeaders, 400);
    }
  }

  const { data: newOrderBump, error: insertError } = await supabase
    .from("order_bumps")
    .insert({
      parent_product_id: parentProductId,
      checkout_id: payload.checkout_id || null, // Deprecated, kept for compatibility
      product_id: payload.product_id,
      offer_id: payload.offer_id,
      active: payload.active !== false,
      discount_enabled: !!payload.discount_enabled,
      // original_price is MARKETING ONLY - strikethrough display
      original_price: payload.discount_enabled ? originalPriceValue : null,
      call_to_action: payload.call_to_action?.trim() || null,
      custom_title: payload.custom_title?.trim() || null,
      custom_description: payload.custom_description?.trim() || null,
      show_image: payload.show_image !== false,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return errorResponse("Este produto já está configurado como order bump", corsHeaders, 400);
    }
    await captureException(new Error(insertError.message), { 
      functionName: "order-bump-crud", 
      extra: { action: "create", payload } 
    });
    return errorResponse("Erro ao criar order bump", corsHeaders, 500);
  }

  return jsonResponse({ success: true, orderBump: newOrderBump as OrderBumpRecord }, corsHeaders);
}
