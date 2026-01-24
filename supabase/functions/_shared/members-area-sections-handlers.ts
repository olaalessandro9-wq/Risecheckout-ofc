/**
 * Members Area Sections Handlers
 * 
 * Section and builder settings handlers for members-area-modules.
 * 
 * RISE Protocol Compliant - Zero `any`
 */

import { SupabaseClient } from "./supabase-types.ts";
import { 
  jsonResponse, 
  errorResponse, 
  verifyProductOwnership 
} from "./edge-helpers.ts";
import { createLogger } from "./logger.ts";

const log = createLogger("MembersAreaSections");

// ============================================
// TYPES
// ============================================

interface MemberSection {
  id: string;
  type: string;
  title?: string | null;
  position: number;
  settings?: Record<string, unknown>;
  is_active?: boolean;
}

// ============================================
// SAVE SECTIONS
// ============================================

export async function handleSaveSections(
  supabase: SupabaseClient,
  productId: string,
  sections: MemberSection[],
  deletedIds: string[] | undefined,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!Array.isArray(sections)) {
    return errorResponse("sections deve ser um array", corsHeaders, 400);
  }

  const ownership = await verifyProductOwnership(supabase, productId, producerId);
  if (!ownership.valid) {
    return errorResponse(ownership.error!, corsHeaders, 403);
  }

  // 1. Delete removed sections
  if (deletedIds && deletedIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("product_members_sections")
      .delete()
      .in("id", deletedIds)
      .eq("product_id", productId);

    if (deleteError) {
      log.error("Delete sections error:", deleteError);
      return errorResponse("Erro ao excluir seções", corsHeaders, 500);
    }
  }

  // 2. Separate new (temp_) from existing sections
  const newSections = sections.filter(s => s.id?.startsWith("temp_"));
  const existingSections = sections.filter(s => !s.id?.startsWith("temp_"));
  const insertedIdMap: Record<string, string> = {};

  // 3. Insert new sections
  for (const section of newSections) {
    const { data: inserted, error: insertError } = await supabase
      .from("product_members_sections")
      .insert({
        product_id: productId,
        type: section.type,
        title: section.title || null,
        position: section.position,
        settings: section.settings || {},
        is_active: section.is_active ?? true,
      })
      .select("id")
      .single();

    if (insertError) {
      log.error("Insert section error:", insertError);
      return errorResponse("Erro ao criar seção", corsHeaders, 500);
    }

    if (inserted) {
      insertedIdMap[section.id] = (inserted as { id: string }).id;
    }
  }

  // 4. Update existing sections
  for (const section of existingSections) {
    const { error: updateError } = await supabase
      .from("product_members_sections")
      .update({
        type: section.type,
        title: section.title || null,
        position: section.position,
        settings: section.settings || {},
        is_active: section.is_active ?? true,
      })
      .eq("id", section.id)
      .eq("product_id", productId);

    if (updateError) {
      log.error("Update section error:", updateError);
      return errorResponse("Erro ao atualizar seção", corsHeaders, 500);
    }
  }

  log.info(`Sections saved by ${producerId}`);
  return jsonResponse({ success: true, insertedIdMap }, corsHeaders);
}

// ============================================
// SAVE BUILDER SETTINGS
// ============================================

export async function handleSaveBuilderSettings(
  supabase: SupabaseClient,
  productId: string,
  settings: Record<string, unknown>,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!settings || typeof settings !== "object") {
    return errorResponse("settings é obrigatório", corsHeaders, 400);
  }

  const ownership = await verifyProductOwnership(supabase, productId, producerId);
  if (!ownership.valid) {
    return errorResponse(ownership.error!, corsHeaders, 403);
  }

  // RISE V3: Save to products.members_area_settings (JSONB column)
  // NOT to a separate table (which doesn't exist)
  const { error } = await supabase
    .from("products")
    .update({
      members_area_settings: settings,
    })
    .eq("id", productId)
    .eq("user_id", producerId);

  if (error) {
    log.error("Update members_area_settings error:", error);
    return errorResponse("Erro ao salvar configurações", corsHeaders, 500);
  }

  log.info(`Builder settings saved by ${producerId} for product ${productId}`);
  return jsonResponse({ success: true }, corsHeaders);
}
