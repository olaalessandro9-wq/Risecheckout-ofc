/**
 * Handler: Update group permissions for modules
 * RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";
import type { GroupData, PermissionToInsert } from "../types.ts";

export async function handleUpdatePermissions(
  supabase: SupabaseClient,
  groupId: string | undefined,
  data: GroupData | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!groupId || !data?.permissions) {
    return errorResponse("group_id and permissions required", corsHeaders, 400);
  }

  // Deletar permissões existentes
  await supabase
    .from("product_member_group_permissions")
    .delete()
    .eq("group_id", groupId);

  // Inserir novas permissões
  const permissionsToInsert: PermissionToInsert[] = data.permissions.map((p) => ({
    group_id: groupId,
    module_id: p.module_id,
    has_access: p.can_access,
  }));

  const { error } = await supabase
    .from("product_member_group_permissions")
    .insert(permissionsToInsert);

  if (error) throw error;

  return jsonResponse({ success: true }, corsHeaders);
}
