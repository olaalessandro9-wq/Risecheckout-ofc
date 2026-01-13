/**
 * Members Area Sections Handlers
 * 
 * Section and builder settings handlers for members-area-modules.
 * 
 * RISE Protocol Compliant
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse, verifyProductOwnership } from "./members-area-handlers.ts";

// ============================================
// SAVE SECTIONS
// ============================================

export async function handleSaveSections(
  supabase: any,
  productId: string,
  sections: any[],
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
      console.error("[members-area-modules] Delete sections error:", deleteError);
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
      console.error("[members-area-modules] Insert section error:", insertError);
      return errorResponse("Erro ao criar seção", corsHeaders, 500);
    }

    if (inserted) {
      insertedIdMap[section.id] = inserted.id;
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
      console.error("[members-area-modules] Update section error:", updateError);
      return errorResponse("Erro ao atualizar seção", corsHeaders, 500);
    }
  }

  console.log(`[members-area-modules] Sections saved by ${producerId}`);
  return jsonResponse({ success: true, insertedIdMap }, corsHeaders);
}

// ============================================
// SAVE BUILDER SETTINGS
// ============================================

export async function handleSaveBuilderSettings(
  supabase: any,
  productId: string,
  settings: Record<string, any>,
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

  // Check if settings exist
  const { data: existingSettings } = await supabase
    .from("product_members_settings")
    .select("id")
    .eq("product_id", productId)
    .single();

  if (existingSettings) {
    // Update
    const { error } = await supabase
      .from("product_members_settings")
      .update({
        settings,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", productId);

    if (error) {
      console.error("[members-area-modules] Update settings error:", error);
      return errorResponse("Erro ao atualizar configurações", corsHeaders, 500);
    }
  } else {
    // Insert
    const { error } = await supabase
      .from("product_members_settings")
      .insert({
        product_id: productId,
        settings,
      });

    if (error) {
      console.error("[members-area-modules] Insert settings error:", error);
      return errorResponse("Erro ao salvar configurações", corsHeaders, 500);
    }
  }

  console.log(`[members-area-modules] Builder settings saved by ${producerId}`);
  return jsonResponse({ success: true }, corsHeaders);
}
