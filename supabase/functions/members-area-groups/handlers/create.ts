/**
 * Handler: Create a new group
 * RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";
import { createLogger } from "../../_shared/logger.ts";
import type { GroupData, GroupRecord } from "../types.ts";

const log = createLogger("members-area-groups:create");

export async function handleCreateGroup(
  supabase: SupabaseClient,
  productId: string | undefined,
  data: GroupData | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!productId || !data?.name) {
    return errorResponse("product_id and name required", corsHeaders, 400);
  }

  // Se criando como padrão, desativar outros grupos primeiro
  if (data.is_default === true) {
    await supabase
      .from("product_member_groups")
      .update({ is_default: false })
      .eq("product_id", productId);
  }

  const { data: group, error } = await supabase
    .from("product_member_groups")
    .insert({
      product_id: productId,
      name: data.name,
      description: data.description || null,
      is_default: data.is_default || false,
    })
    .select()
    .single() as { data: GroupRecord | null; error: Error | null };

  if (error) throw error;

  log.info(`Created group: ${group?.id}`);

  return jsonResponse({ success: true, group }, corsHeaders);
}
