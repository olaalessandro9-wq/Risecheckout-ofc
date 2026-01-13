/**
 * members-area-modules Edge Function
 * 
 * Centralizes all module CRUD operations for members area:
 * - create: Create new module
 * - update: Update module (title, description, cover)
 * - delete: Delete module (cascade contents)
 * - reorder: Reorder modules
 * - list: List modules for a product
 * 
 * RISE Protocol Compliant:
 * - Producer session authentication
 * - Ownership verification
 * - Rate limiting
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";

// ============================================
// TYPES
// ============================================

interface ModuleRequest {
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
  // For save-sections action
  sections?: any[];
  deletedIds?: string[];
  // For save-builder-settings action
  settings?: Record<string, any>;
}

// ============================================
// RATE LIMITING
// ============================================

async function checkRateLimit(
  supabase: any,
  producerId: string,
  action: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const MAX_ATTEMPTS = 30;
  const WINDOW_MS = 5 * 60 * 1000;

  const windowStart = new Date(Date.now() - WINDOW_MS);

  const { data: attempts, error } = await supabase
    .from("rate_limit_attempts")
    .select("id")
    .eq("identifier", `producer:${producerId}`)
    .eq("action", action)
    .gte("created_at", windowStart.toISOString());

  if (error) {
    console.error("[members-area-modules] Rate limit check error:", error);
    return { allowed: true };
  }

  const count = attempts?.length || 0;
  if (count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: 300 };
  }

  return { allowed: true };
}

async function recordRateLimitAttempt(
  supabase: any,
  producerId: string,
  action: string
): Promise<void> {
  await supabase.from("rate_limit_attempts").insert({
    identifier: `producer:${producerId}`,
    action,
    success: true,
    created_at: new Date().toISOString(),
  });
}

// ============================================
// HELPERS
// ============================================

function jsonResponse(data: any, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}

// ============================================
// SESSION VALIDATION
// ============================================

async function validateProducerSession(
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
    await supabase
      .from("producer_sessions")
      .update({ is_valid: false })
      .eq("session_token", sessionToken);
    return { valid: false, error: "Sessão expirada" };
  }

  await supabase
    .from("producer_sessions")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("session_token", sessionToken);

  return { valid: true, producerId: session.producer_id };
}

// ============================================
// OWNERSHIP VERIFICATION
// ============================================

async function verifyProductOwnership(
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

async function verifyModuleOwnership(
  supabase: any,
  moduleId: string,
  producerId: string
): Promise<{ valid: boolean; productId?: string; error?: string }> {
  const { data: module, error } = await supabase
    .from("product_member_modules")
    .select(`
      id,
      product_id,
      products!inner(user_id)
    `)
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
// MAIN HANDLER
// ============================================

serve(withSentry("members-area-modules", async (req) => {
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: ModuleRequest;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Corpo da requisição inválido", corsHeaders, 400);
    }

    const { action, productId, moduleId, data, orderedIds } = body;
    const sessionToken = body.sessionToken || req.headers.get("x-producer-session-token");

    console.log(`[members-area-modules] Action: ${action}`);

    // Validate session
    const sessionValidation = await validateProducerSession(supabase, sessionToken || "");
    if (!sessionValidation.valid) {
      return errorResponse(sessionValidation.error || "Não autorizado", corsHeaders, 401);
    }
    const producerId = sessionValidation.producerId!;

    // ============================================
    // LIST MODULES
    // ============================================
    if (action === "list") {
      if (!productId) {
        return errorResponse("productId é obrigatório", corsHeaders, 400);
      }

      const ownership = await verifyProductOwnership(supabase, productId, producerId);
      if (!ownership.valid) {
        return errorResponse(ownership.error!, corsHeaders, 403);
      }

      const { data: modules, error } = await supabase
        .from("product_member_modules")
        .select(`
          *,
          contents:product_member_content(*)
        `)
        .eq("product_id", productId)
        .order("position", { ascending: true });

      if (error) {
        console.error("[members-area-modules] List error:", error);
        return errorResponse("Erro ao listar módulos", corsHeaders, 500);
      }

      // Sort contents by position
      const sortedModules = modules.map((m: any) => ({
        ...m,
        contents: m.contents.sort((a: any, b: any) => a.position - b.position),
      }));

      return jsonResponse({ success: true, modules: sortedModules }, corsHeaders);
    }

    // ============================================
    // CREATE MODULE
    // ============================================
    if (action === "create") {
      if (!productId) {
        return errorResponse("productId é obrigatório", corsHeaders, 400);
      }

      if (!data?.title || typeof data.title !== "string" || !data.title.trim()) {
        return errorResponse("Título é obrigatório", corsHeaders, 400);
      }

      const ownership = await verifyProductOwnership(supabase, productId, producerId);
      if (!ownership.valid) {
        return errorResponse(ownership.error!, corsHeaders, 403);
      }

      // Get max position
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
    if (action === "update") {
      if (!moduleId) {
        return errorResponse("moduleId é obrigatório", corsHeaders, 400);
      }

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
    if (action === "delete") {
      if (!moduleId) {
        return errorResponse("moduleId é obrigatório", corsHeaders, 400);
      }

      const ownership = await verifyModuleOwnership(supabase, moduleId, producerId);
      if (!ownership.valid) {
        return errorResponse(ownership.error!, corsHeaders, 403);
      }

      // Delete module (cascade will handle contents)
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
    if (action === "reorder") {
      if (!productId) {
        return errorResponse("productId é obrigatório", corsHeaders, 400);
      }

      if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
        return errorResponse("orderedIds é obrigatório", corsHeaders, 400);
      }

      const ownership = await verifyProductOwnership(supabase, productId, producerId);
      if (!ownership.valid) {
        return errorResponse(ownership.error!, corsHeaders, 403);
      }

      // Update positions
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

    // ============================================
    // SAVE BUILDER SECTIONS (batch save for builder)
    // ============================================
    if (action === "save-sections") {
      if (!productId) {
        return errorResponse("productId é obrigatório", corsHeaders, 400);
      }

      const { sections, deletedIds } = body;

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
            title: section.title || null,
            position: section.position,
            settings: section.settings || {},
            is_active: section.is_active ?? true,
          })
          .eq("id", section.id)
          .eq("product_id", productId);

        if (updateError) {
          console.error("[members-area-modules] Update section error:", updateError);
          // Continue, don't fail all
        }
      }

      console.log(`[members-area-modules] Sections saved by ${producerId}: ${sections.length} sections, ${deletedIds?.length || 0} deleted`);
      return jsonResponse({ success: true, insertedIdMap }, corsHeaders);
    }

    // ============================================
    // SAVE BUILDER SETTINGS (product.members_area_settings)
    // ============================================
    if (action === "save-builder-settings") {
      if (!productId) {
        return errorResponse("productId é obrigatório", corsHeaders, 400);
      }

      const settings = body.settings;

      if (!settings || typeof settings !== "object") {
        return errorResponse("settings é obrigatório", corsHeaders, 400);
      }

      const ownership = await verifyProductOwnership(supabase, productId, producerId);
      if (!ownership.valid) {
        return errorResponse(ownership.error!, corsHeaders, 403);
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({ members_area_settings: settings })
        .eq("id", productId);

      if (updateError) {
        console.error("[members-area-modules] Save builder settings error:", updateError);
        return errorResponse("Erro ao salvar configurações", corsHeaders, 500);
      }

      console.log(`[members-area-modules] Builder settings saved for ${productId} by ${producerId}`);
      return jsonResponse({ success: true }, corsHeaders);
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 400);
  } catch (error) {
    console.error("[members-area-modules] Unexpected error:", error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      functionName: "members-area-modules",
      url: req.url,
      method: req.method,
    });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
