/**
 * order-bump-crud Update Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module order-bump-crud/handlers/update-handler
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { captureException } from "../../_shared/sentry.ts";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "../../_shared/rate-limiting/index.ts";
import { jsonResponse, errorResponse, verifyOrderBumpOwnership } from "../helpers.ts";
import type { OrderBumpPayload, OrderBumpRecord, OrderBumpUpdates } from "../types.ts";

export async function handleUpdate(
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

  const orderBumpId = payload.id || payload.order_bump_id;
  if (!orderBumpId) {
    return errorResponse("ID do order bump é obrigatório", corsHeaders, 400);
  }

  const ownershipCheck = await verifyOrderBumpOwnership(supabase, orderBumpId, producerId);
  if (!ownershipCheck.valid) {
    return errorResponse("Você não tem permissão para editar este order bump", corsHeaders, 403);
  }

  const updates: OrderBumpUpdates = { updated_at: new Date().toISOString() };
  
  if (payload.product_id !== undefined) updates.product_id = payload.product_id;
  if (payload.offer_id !== undefined) updates.offer_id = payload.offer_id;
  if (payload.active !== undefined) updates.active = payload.active;
  
  if (payload.discount_enabled !== undefined) {
    updates.discount_enabled = payload.discount_enabled;
    // Support both field names - original_price is MARKETING ONLY
    const originalPriceValue = payload.original_price ?? payload.discount_price;
    updates.original_price = payload.discount_enabled ? originalPriceValue : null;
  }
  
  if (payload.call_to_action !== undefined) {
    updates.call_to_action = payload.call_to_action?.trim() || null;
  }
  if (payload.custom_title !== undefined) {
    updates.custom_title = payload.custom_title?.trim() || null;
  }
  if (payload.custom_description !== undefined) {
    updates.custom_description = payload.custom_description?.trim() || null;
  }
  if (payload.show_image !== undefined) updates.show_image = payload.show_image;

  const { data: updatedOrderBump, error: updateError } = await supabase
    .from("order_bumps")
    .update(updates)
    .eq("id", orderBumpId)
    .select()
    .single();

  if (updateError) {
    await captureException(new Error(updateError.message), { 
      functionName: "order-bump-crud", 
      extra: { action: "update", orderBumpId } 
    });
    return errorResponse("Erro ao atualizar order bump", corsHeaders, 500);
  }

  return jsonResponse({ success: true, orderBump: updatedOrderBump as OrderBumpRecord }, corsHeaders);
}
