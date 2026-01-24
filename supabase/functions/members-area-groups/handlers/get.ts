/**
 * Handler: Get a single group with permissions
 * RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";
import type { GroupWithPermissions } from "../types.ts";

export async function handleGetGroup(
  supabase: SupabaseClient,
  groupId: string | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!groupId) {
    return errorResponse("group_id required", corsHeaders, 400);
  }

  const { data: group, error } = await supabase
    .from("product_member_groups")
    .select(`
      *,
      permissions:product_member_group_permissions(
        module_id,
        has_access
      )
    `)
    .eq("id", groupId)
    .single() as { data: GroupWithPermissions | null; error: Error | null };

  if (error) throw error;

  return jsonResponse({ success: true, group }, corsHeaders);
}
