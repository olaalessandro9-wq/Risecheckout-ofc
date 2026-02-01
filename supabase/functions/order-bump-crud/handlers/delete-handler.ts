/**
 * order-bump-crud Delete Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module order-bump-crud/handlers/delete-handler
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { captureException } from "../../_shared/sentry.ts";
import { jsonResponse, errorResponse, verifyOrderBumpOwnership } from "../helpers.ts";

export async function handleDelete(
  supabase: SupabaseClient,
  producerId: string,
  orderBumpId: string | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!orderBumpId) {
    return errorResponse("ID do order bump é obrigatório", corsHeaders, 400);
  }

  const ownershipCheck = await verifyOrderBumpOwnership(supabase, orderBumpId, producerId);
  if (!ownershipCheck.valid) {
    return errorResponse("Você não tem permissão para excluir este order bump", corsHeaders, 403);
  }

  const { error: deleteError } = await supabase
    .from("order_bumps")
    .delete()
    .eq("id", orderBumpId);

  if (deleteError) {
    await captureException(new Error(deleteError.message), { 
      functionName: "order-bump-crud", 
      extra: { action: "delete", orderBumpId } 
    });
    return errorResponse("Erro ao excluir order bump", corsHeaders, 500);
  }

  return jsonResponse({ success: true }, corsHeaders);
}
