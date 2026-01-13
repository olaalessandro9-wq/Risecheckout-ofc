/**
 * Members Area Module Handlers
 * 
 * Extracted handlers for members-area-modules edge function.
 * 
 * RISE Protocol Compliant
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { captureException } from "./sentry.ts";

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
  sections?: any[];
  deletedIds?: string[];
  settings?: Record<string, any>;
}

// ============================================
// HELPERS
// ============================================

export function jsonResponse(data: any, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}

// ============================================
// SESSION VALIDATION
// ============================================

export async function validateProducerSession(
  supabase: any,
  sessionToken: string
): Promise<{ valid: boolean; producerId?: string; error?: string }> {
  if (!sessionToken) {
    return { valid: false, error: "Token de sessão não fornecido" };
  }

  const { data: session, error } = await supabase
    .from("producer_sessions")
    .select("producer_id, expires_at, is_valid")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session) {
    return { valid: false, error: "Sessão inválida" };
  }

  if (!session.is_valid) {
    return { valid: false, error: "Sessão expirada ou invalidada" };
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("producer_sessions").update({ is_valid: false }).eq("session_token", sessionToken);
    return { valid: false, error: "Sessão expirada" };
  }

  await supabase.from("producer_sessions").update({ last_activity_at: new Date().toISOString() }).eq("session_token", sessionToken);

  return { valid: true, producerId: session.producer_id };
}

// ============================================
// OWNERSHIP VERIFICATION
// ============================================

export async function verifyProductOwnership(
  supabase: any,
  productId: string,
  producerId: string
): Promise<{ valid: boolean; error?: string }> {
  const { data: product, error } = await supabase
    .from("products")
    .select("id, user_id, members_area_enabled")
    .eq("id", productId)
    .single();

  if (error || !product) {
    return { valid: false, error: "Produto não encontrado" };
  }

  if (product.user_id !== producerId) {
    return { valid: false, error: "Você não tem permissão para acessar este produto" };
  }

  return { valid: true };
}

export async function verifyModuleOwnership(
  supabase: any,
  moduleId: string,
  producerId: string
): Promise<{ valid: boolean; productId?: string; error?: string }> {
  const { data: module, error } = await supabase
    .from("product_member_modules")
    .select(`id, product_id, products!inner(user_id)`)
    .eq("id", moduleId)
    .single();

  if (error || !module) {
    return { valid: false, error: "Módulo não encontrado" };
  }

  if (module.products.user_id !== producerId) {
    return { valid: false, error: "Você não tem permissão para acessar este módulo" };
  }

  return { valid: true, productId: module.product_id };
}

// ============================================
// LIST MODULES
// ============================================

export async function handleListModules(
  supabase: any,
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

  const sortedModules = modules.map((m: any) => ({
    ...m,
    contents: m.contents.sort((a: any, b: any) => a.position - b.position),
  }));

  return jsonResponse({ success: true, modules: sortedModules }, corsHeaders);
}

// ============================================
// CREATE MODULE
// ============================================

export async function handleCreateModule(
  supabase: any,
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

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

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
  supabase: any,
  moduleId: string,
  data: { title?: string; description?: string; cover_image_url?: string | null },
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const ownership = await verifyModuleOwnership(supabase, moduleId, producerId);
  if (!ownership.valid) {
    return errorResponse(ownership.error!, corsHeaders, 403);
  }

  const updates: Record<string, any> = {};

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
  supabase: any,
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
  supabase: any,
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
