/**
 * Handler: Delete a group
 * RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";

export async function handleDeleteGroup(
  supabase: SupabaseClient,
  groupId: string | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!groupId) {
    return errorResponse("group_id required", corsHeaders, 400);
  }

  // Verificar se não é o grupo default e obter product_id
  const { data: group, error: fetchError } = await supabase
    .from("product_member_groups")
    .select("is_default, product_id")
    .eq("id", groupId)
    .single() as { data: { is_default: boolean; product_id: string } | null; error: Error | null };

  if (fetchError) {
    return errorResponse(fetchError.message, corsHeaders, 400);
  }

  if (group?.is_default) {
    return errorResponse("Não é possível excluir o grupo padrão", corsHeaders, 400);
  }

  // Verificar se é o último grupo (não permitir exclusão)
  const { count, error: countError } = await supabase
    .from("product_member_groups")
    .select("id", { count: 'exact', head: true })
    .eq("product_id", group!.product_id);

  if (countError) {
    return errorResponse(countError.message, corsHeaders, 400);
  }

  if (count !== null && count <= 1) {
    return errorResponse(
      "Não é possível excluir o único grupo. Produtos devem ter pelo menos 1 grupo.",
      corsHeaders,
      400
    );
  }

  const { error } = await supabase
    .from("product_member_groups")
    .delete()
    .eq("id", groupId);

  if (error) throw error;

  return jsonResponse({ success: true }, corsHeaders);
}
