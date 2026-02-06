/**
 * content-crud Edge Function
 * 
 * Handles CRUD operations for members area content:
 * - create: Create new content
 * - update: Update content
 * - delete: Delete content
 * - reorder: Reorder contents within a module
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10 - Zero `any`
 * Version: 2.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS } from "../_shared/rate-limiting/index.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("content-crud");

// ============================================
// INTERFACES
// ============================================

interface ContentData {
  title?: string;
  content_type?: string;
  content_url?: string | null;
  body?: string | null;
  description?: string | null;
  is_active?: boolean;
}

interface JsonResponseData {
  success?: boolean;
  error?: string;
  data?: ContentRecord;
  deletedId?: string;
}

interface ContentRecord {
  id: string;
  module_id: string;
  title: string;
  content_type: string;
  content_url: string | null;
  body: string | null;
  description: string | null;
  is_active: boolean;
  position: number;
}

interface ModuleWithProduct {
  id: string;
  product_id: string;
  products: { user_id: string };
}

interface ContentWithModule {
  id: string;
  module_id: string;
  product_member_modules: {
    id: string;
    product_id: string;
    products: { user_id: string };
  };
}

interface ContentPosition {
  position: number;
}

interface ContentUpdates {
  title?: string;
  content_type?: string;
  content_url?: string | null;
  body?: string | null;
  description?: string | null;
  is_active?: boolean;
}

// ============================================
// HELPERS - defined after corsHeaders is available
// ============================================

// ============================================
// OWNERSHIP VERIFICATION
// ============================================

async function verifyModuleOwnership(
  supabase: SupabaseClient,
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

  const typedModule = module as unknown as ModuleWithProduct;

  if (typedModule.products.user_id !== producerId) {
    return { valid: false, error: "Você não tem permissão para acessar este módulo" };
  }

  return { valid: true, productId: typedModule.product_id };
}

async function verifyContentOwnership(
  supabase: SupabaseClient,
  contentId: string,
  producerId: string
): Promise<{ valid: boolean; moduleId?: string; productId?: string; error?: string }> {
  const { data: content, error } = await supabase
    .from("product_member_content")
    .select(`
      id,
      module_id,
      product_member_modules!inner(
        id,
        product_id,
        products!inner(user_id)
      )
    `)
    .eq("id", contentId)
    .single();

  if (error || !content) {
    return { valid: false, error: "Conteúdo não encontrado" };
  }

  const typedContent = content as unknown as ContentWithModule;

  if (typedContent.product_member_modules.products.user_id !== producerId) {
    return { valid: false, error: "Você não tem permissão para acessar este conteúdo" };
  }

  return {
    valid: true,
    moduleId: typedContent.module_id,
    productId: typedContent.product_member_modules.product_id,
  };
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  // Handle CORS with dynamic origin validation
  const corsResult = handleCorsV2(req);
  
  if (corsResult instanceof Response) {
    return corsResult; // Preflight or blocked origin
  }
  
  const corsHeaders = corsResult.headers;
  
  // Helper inside handler to capture corsHeaders
  function jsonResponse(data: JsonResponseData, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = getSupabaseClient('general');

    const rateLimitResult = await rateLimitMiddleware(supabase, req, RATE_LIMIT_CONFIGS.MEMBERS_AREA, corsHeaders);
    if (rateLimitResult) return rateLimitResult;

    const body = await req.json();
    const { action, moduleId, contentId, data, orderedIds } = body;

    log.info(`Action: ${action}`);

    // Require authentication
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return jsonResponse({ error: "Authorization required" }, 401);
    }

    // ========== CREATE CONTENT ==========
    if (action === "create") {
      if (!moduleId) {
        return jsonResponse({ success: false, error: "moduleId é obrigatório" }, 400);
      }

      if (!data?.title || typeof data.title !== "string" || !data.title.trim()) {
        return jsonResponse({ success: false, error: "Título é obrigatório" }, 400);
      }

      const ownership = await verifyModuleOwnership(supabase, moduleId, producer.id);
      if (!ownership.valid) {
        return jsonResponse({ success: false, error: ownership.error }, 403);
      }

      // Get max position
      const { data: existing } = await supabase
        .from("product_member_content")
        .select("position")
        .eq("module_id", moduleId)
        .order("position", { ascending: false })
        .limit(1);

      const typedExisting = existing as ContentPosition[] | null;
      const nextPosition = typedExisting && typedExisting.length > 0 ? typedExisting[0].position + 1 : 0;

      const contentData = data as ContentData;

      const { data: newContent, error: insertError } = await supabase
        .from("product_member_content")
        .insert({
          module_id: moduleId,
          title: contentData.title!.trim(),
          content_type: contentData.content_type || "text",
          content_url: contentData.content_url || null,
          body: contentData.body || null,
          description: contentData.description || null,
          is_active: contentData.is_active !== false,
          position: nextPosition,
        })
        .select()
        .single();

      if (insertError) {
        log.error("Create error:", insertError);
        return jsonResponse({ success: false, error: "Erro ao criar conteúdo" }, 500);
      }

      log.info(`Content created: ${(newContent as ContentRecord).id} by ${producer.id}`);
      return jsonResponse({ success: true, data: newContent as ContentRecord });
    }

    // ========== UPDATE CONTENT ==========
    if (action === "update") {
      if (!contentId) {
        return jsonResponse({ success: false, error: "contentId é obrigatório" }, 400);
      }

      const ownership = await verifyContentOwnership(supabase, contentId, producer.id);
      if (!ownership.valid) {
        return jsonResponse({ success: false, error: ownership.error }, 403);
      }

      const updates: ContentUpdates = {};
      const contentData = data as ContentData;

      if (contentData?.title !== undefined) {
        if (typeof contentData.title !== "string" || !contentData.title.trim()) {
          return jsonResponse({ success: false, error: "Título não pode ser vazio" }, 400);
        }
        updates.title = contentData.title.trim();
      }

      if (contentData?.content_type !== undefined) updates.content_type = contentData.content_type;
      if (contentData?.content_url !== undefined) updates.content_url = contentData.content_url;
      if (contentData?.body !== undefined) updates.body = contentData.body;
      if (contentData?.description !== undefined) updates.description = contentData.description;
      if (contentData?.is_active !== undefined) updates.is_active = contentData.is_active;

      if (Object.keys(updates).length === 0) {
        return jsonResponse({ success: false, error: "Nenhum campo para atualizar" }, 400);
      }

      const { data: updatedContent, error: updateError } = await supabase
        .from("product_member_content")
        .update(updates)
        .eq("id", contentId)
        .select()
        .single();

      if (updateError) {
        log.error("Update error:", updateError);
        return jsonResponse({ success: false, error: "Erro ao atualizar conteúdo" }, 500);
      }

      log.info(`Content updated: ${contentId} by ${producer.id}`);
      return jsonResponse({ success: true, data: updatedContent as ContentRecord });
    }

    // ========== DELETE CONTENT ==========
    if (action === "delete") {
      if (!contentId) {
        return jsonResponse({ success: false, error: "contentId é obrigatório" }, 400);
      }

      const ownership = await verifyContentOwnership(supabase, contentId, producer.id);
      if (!ownership.valid) {
        return jsonResponse({ success: false, error: ownership.error }, 403);
      }

      const { error: deleteError } = await supabase
        .from("product_member_content")
        .delete()
        .eq("id", contentId);

      if (deleteError) {
        log.error("Delete error:", deleteError);
        return jsonResponse({ success: false, error: "Erro ao excluir conteúdo" }, 500);
      }

      log.info(`Content deleted: ${contentId} by ${producer.id}`);
      return jsonResponse({ success: true, deletedId: contentId });
    }

    // ========== REORDER CONTENTS ==========
    if (action === "reorder") {
      if (!moduleId) {
        return jsonResponse({ success: false, error: "moduleId é obrigatório" }, 400);
      }

      if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
        return jsonResponse({ success: false, error: "orderedIds é obrigatório" }, 400);
      }

      const ownership = await verifyModuleOwnership(supabase, moduleId, producer.id);
      if (!ownership.valid) {
        return jsonResponse({ success: false, error: ownership.error }, 403);
      }

      const updates = orderedIds.map((id: string, index: number) =>
        supabase
          .from("product_member_content")
          .update({ position: index })
          .eq("id", id)
          .eq("module_id", moduleId)
      );

      const results = await Promise.all(updates);
      const hasError = results.some((r) => r.error);

      if (hasError) {
        log.error("Reorder error");
        return jsonResponse({ success: false, error: "Erro ao reordenar conteúdos" }, 500);
      }

      log.info(`Contents reordered by ${producer.id}`);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ success: false, error: `Ação desconhecida: ${action}` }, 400);

  } catch (error: unknown) {
    log.error("Error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
