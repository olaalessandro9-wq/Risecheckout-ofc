/**
 * Members Area Module Handlers
 * 
 * Extracted handlers for members-area-modules edge function.
 * 
 * RISE Protocol Compliant - Zero `any`
 */

import { 
  SupabaseClient,
  ProductModule 
} from "./supabase-types.ts";
import { captureException } from "./sentry.ts";
import {
  jsonResponse,
  errorResponse,
  validateProducerSession as validateSession,
  verifyProductOwnership as verifyOwnership,
  verifyModuleOwnership as verifyModule,
} from "./edge-helpers.ts";

// ============================================
// TYPES
// ============================================

export interface ModuleRequest {
  action: "create" | "update" | "delete" | "reorder" | "list" | "save-sections" | "save-builder-settings";
  productId?: string;
  moduleId?: string;
  data?: {
    title?: string;
    description?: string;
    cover_image_url?: string | null;
  };
  orderedIds?: string[];
  sessionToken?: string;
  sections?: MemberSection[];
  deletedIds?: string[];
  settings?: Record<string, unknown>;
}

export interface MemberSection {
  id: string;
  type: string;
  title?: string | null;
  position: number;
  settings?: Record<string, unknown>;
  is_active?: boolean;
}

// ============================================
// RE-EXPORT HELPERS FROM EDGE-HELPERS
// ============================================

export { jsonResponse, errorResponse } from "./edge-helpers.ts";

// ============================================
// SESSION VALIDATION (wrapper for backwards compatibility)
// ============================================

export async function validateProducerSession(
  supabase: SupabaseClient,
  sessionToken: string
): Promise<{ valid: boolean; producerId?: string; error?: string }> {
  return validateSession(supabase, sessionToken);
}

// ============================================
// OWNERSHIP VERIFICATION (wrapper for backwards compatibility)
// ============================================

export async function verifyProductOwnership(
  supabase: SupabaseClient,
  productId: string,
  producerId: string
): Promise<{ valid: boolean; error?: string }> {
  return verifyOwnership(supabase, productId, producerId);
}

export async function verifyModuleOwnership(
  supabase: SupabaseClient,
  moduleId: string,
  producerId: string
): Promise<{ valid: boolean; productId?: string; error?: string }> {
  return verifyModule(supabase, moduleId, producerId);
}

// ============================================
// LIST MODULES
// ============================================

interface ModuleWithContents extends ProductModule {
  contents: Array<{
    id: string;
    position: number;
    [key: string]: unknown;
  }>;
}

export async function handleListModules(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const ownership = await verifyProductOwnership(supabase, productId, producerId);
  if (!ownership.valid) {
    return errorResponse(ownership.error!, corsHeaders, 403);
  }

  const { data: modules, error } = await supabase
    .from("product_member_modules")
    .select(`*, contents:product_member_content(*)`)
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) {
    console.error("[members-area-modules] List error:", error);
    return errorResponse("Erro ao listar módulos", corsHeaders, 500);
  }

  const sortedModules = (modules as ModuleWithContents[]).map((m) => ({
    ...m,
    contents: m.contents.sort((a, b) => a.position - b.position),
  }));

  return jsonResponse({ success: true, modules: sortedModules }, corsHeaders);
}

// ============================================
// CREATE MODULE
// ============================================

export async function handleCreateModule(
  supabase: SupabaseClient,
  productId: string,
  data: { title?: string; description?: string; cover_image_url?: string | null },
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!data?.title || typeof data.title !== "string" || !data.title.trim()) {
    return errorResponse("Título é obrigatório", corsHeaders, 400);
  }

  const ownership = await verifyProductOwnership(supabase, productId, producerId);
  if (!ownership.valid) {
    return errorResponse(ownership.error!, corsHeaders, 403);
  }

  const { data: existing } = await supabase
    .from("product_member_modules")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1);

  const existingArray = existing as Array<{ position: number }> | null;
  const nextPosition = existingArray && existingArray.length > 0 ? existingArray[0].position + 1 : 0;

  const { data: newModule, error: insertError } = await supabase
    .from("product_member_modules")
    .insert({
      product_id: productId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      cover_image_url: data.cover_image_url || null,
      position: nextPosition,
    })
    .select()
    .single();

  if (insertError) {
    console.error("[members-area-modules] Create error:", insertError);
    await captureException(new Error(insertError.message), {
      functionName: "members-area-modules",
      extra: { action: "create", producerId, productId },
    });
    return errorResponse("Erro ao criar módulo", corsHeaders, 500);
  }

  console.log(`[members-area-modules] Module created: ${newModule.id} by ${producerId}`);
  return jsonResponse({ success: true, module: { ...newModule, contents: [] } }, corsHeaders);
}

// ============================================
// UPDATE MODULE
// ============================================

export async function handleUpdateModule(
  supabase: SupabaseClient,
  moduleId: string,
  data: { title?: string; description?: string; cover_image_url?: string | null },
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const ownership = await verifyModuleOwnership(supabase, moduleId, producerId);
  if (!ownership.valid) {
    return errorResponse(ownership.error!, corsHeaders, 403);
  }

  const updates: Record<string, unknown> = {};

  if (data?.title !== undefined) {
    if (typeof data.title !== "string" || !data.title.trim()) {
      return errorResponse("Título não pode ser vazio", corsHeaders, 400);
    }
    updates.title = data.title.trim();
  }

  if (data?.description !== undefined) {
    updates.description = data.description?.trim() || null;
  }

  if (data?.cover_image_url !== undefined) {
    updates.cover_image_url = data.cover_image_url || null;
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse("Nenhum campo para atualizar", corsHeaders, 400);
  }

  const { data: updatedModule, error: updateError } = await supabase
    .from("product_member_modules")
    .update(updates)
    .eq("id", moduleId)
    .select()
    .single();

  if (updateError) {
    console.error("[members-area-modules] Update error:", updateError);
    return errorResponse("Erro ao atualizar módulo", corsHeaders, 500);
  }

  console.log(`[members-area-modules] Module updated: ${moduleId} by ${producerId}`);
  return jsonResponse({ success: true, module: updatedModule }, corsHeaders);
}

// ============================================
// DELETE MODULE
// ============================================

export async function handleDeleteModule(
  supabase: SupabaseClient,
  moduleId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const ownership = await verifyModuleOwnership(supabase, moduleId, producerId);
  if (!ownership.valid) {
    return errorResponse(ownership.error!, corsHeaders, 403);
  }

  const { error: deleteError } = await supabase
    .from("product_member_modules")
    .delete()
    .eq("id", moduleId);

  if (deleteError) {
    console.error("[members-area-modules] Delete error:", deleteError);
    return errorResponse("Erro ao excluir módulo", corsHeaders, 500);
  }

  console.log(`[members-area-modules] Module deleted: ${moduleId} by ${producerId}`);
  return jsonResponse({ success: true, deletedId: moduleId }, corsHeaders);
}

// ============================================
// REORDER MODULES
// ============================================

export async function handleReorderModules(
  supabase: SupabaseClient,
  productId: string,
  orderedIds: string[],
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const ownership = await verifyProductOwnership(supabase, productId, producerId);
  if (!ownership.valid) {
    return errorResponse(ownership.error!, corsHeaders, 403);
  }

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("product_member_modules")
      .update({ position: index })
      .eq("id", id)
      .eq("product_id", productId)
  );

  const results = await Promise.all(updates);
  const hasError = results.some((r) => r.error);

  if (hasError) {
    console.error("[members-area-modules] Reorder error");
    return errorResponse("Erro ao reordenar módulos", corsHeaders, 500);
  }

  console.log(`[members-area-modules] Modules reordered by ${producerId}`);
  return jsonResponse({ success: true }, corsHeaders);
}
