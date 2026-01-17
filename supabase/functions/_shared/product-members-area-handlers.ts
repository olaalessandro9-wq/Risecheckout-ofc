/**
 * Members Area Settings Handler
 * Extracted from product-settings-handlers for RISE Protocol compliance (< 300 lines per file)
 * 
 * @version 2.0.0
 */

import { SupabaseClient, MembersAreaSettings, JsonResponseData } from "./supabase-types.ts";

// ============================================
// TYPES
// ============================================

type CorsHeaders = Record<string, string>;

// ============================================
// RESPONSE HELPERS
// ============================================

function jsonResponse(data: JsonResponseData, headers: CorsHeaders, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, headers: CorsHeaders, status = 400): Response {
  return jsonResponse({ success: false, error: message }, headers, status);
}

// ============================================
// UPDATE MEMBERS AREA SETTINGS HANDLER
// ============================================

export async function handleUpdateMembersAreaSettings(
  supabase: SupabaseClient,
  productId: string,
  enabled: boolean | undefined,
  settings: MembersAreaSettings | undefined,
  corsHeaders: CorsHeaders
): Promise<Response> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (enabled !== undefined) {
    updates.members_area_enabled = !!enabled;
  }

  if (settings !== undefined) {
    updates.members_area_settings = settings;
  }

  const { error: updateError } = await supabase.from("products").update(updates).eq("id", productId) as { error: { message: string } | null };

  if (updateError) {
    console.error("[product-settings] Update members area settings error:", updateError);
    return errorResponse("Erro ao atualizar configurações da área de membros", corsHeaders, 500);
  }

  console.log(`[product-settings] Members area settings updated for: ${productId}`);
  return jsonResponse({ success: true, enabled, settings }, corsHeaders);
}
