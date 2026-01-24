/**
 * Handler: Link offers to a group
 * RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";
import { createLogger } from "../../_shared/logger.ts";
import type { GroupData } from "../types.ts";

const log = createLogger("members-area-groups:link_offers");

export async function handleLinkOffers(
  supabase: SupabaseClient,
  groupId: string | undefined,
  data: GroupData | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!groupId) {
    return errorResponse("group_id required", corsHeaders, 400);
  }

  const offerIds = data?.offer_ids || [];

  // Buscar o product_id do grupo para validar ownership das ofertas
  const { data: groupData, error: groupError } = await supabase
    .from("product_member_groups")
    .select("product_id")
    .eq("id", groupId)
    .single() as { data: { product_id: string } | null; error: Error | null };

  if (groupError || !groupData) {
    return errorResponse("Group not found", corsHeaders, 404);
  }

  // Remover vínculo deste grupo de todas as ofertas do produto
  await supabase
    .from("offers")
    .update({ member_group_id: null })
    .eq("product_id", groupData.product_id)
    .eq("member_group_id", groupId);

  // Vincular as ofertas selecionadas a este grupo
  if (offerIds.length > 0) {
    const { error: updateError } = await supabase
      .from("offers")
      .update({ member_group_id: groupId })
      .eq("product_id", groupData.product_id)
      .in("id", offerIds);

    if (updateError) throw updateError;
  }

  log.info(`Linked ${offerIds.length} offers to group ${groupId}`);

  return jsonResponse({ success: true }, corsHeaders);
}
