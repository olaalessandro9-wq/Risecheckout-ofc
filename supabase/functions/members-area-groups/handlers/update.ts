/**
 * Handler: Update an existing group
 * RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";
import type { GroupData, GroupRecord } from "../types.ts";

export async function handleUpdateGroup(
  supabase: SupabaseClient,
  groupId: string | undefined,
  data: GroupData | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!groupId || !data) {
    return errorResponse("group_id and data required", corsHeaders, 400);
  }

  // Se estiver definindo como padrão, desativar outros grupos primeiro
  if (data.is_default === true) {
    const { data: currentGroup } = await supabase
      .from("product_member_groups")
      .select("product_id")
      .eq("id", groupId)
      .single() as { data: { product_id: string } | null };

    if (currentGroup?.product_id) {
      await supabase
        .from("product_member_groups")
        .update({ is_default: false })
        .eq("product_id", currentGroup.product_id)
        .neq("id", groupId);
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.is_default !== undefined) updateData.is_default = data.is_default;

  const { data: group, error } = await supabase
    .from("product_member_groups")
    .update(updateData)
    .eq("id", groupId)
    .select()
    .single() as { data: GroupRecord | null; error: Error | null };

  if (error) throw error;

  return jsonResponse({ success: true, group }, corsHeaders);
}
