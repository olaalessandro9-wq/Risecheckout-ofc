/**
 * content-crud Edge Function
 * 
 * Handles CRUD operations for members area content:
 * - create: Create new content
 * - update: Update content
 * - delete: Delete content
 * - reorder: Reorder contents within a module
 * 
 * RISE Protocol Compliant
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS } from "../_shared/rate-limiter.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

interface ContentData {
  title?: string;
  content_type?: string;
  content_url?: string | null;
  body?: string | null;
  description?: string | null;
  is_active?: boolean;
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyModuleOwnership(
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

async function verifyContentOwnership(
  supabase: any,
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

  if (content.product_member_modules.products.user_id !== producerId) {
    return { valid: false, error: "Você não tem permissão para acessar este conteúdo" };
  }

  return {
    valid: true,
    moduleId: content.module_id,
    productId: content.product_member_modules.product_id,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rateLimitResult = await rateLimitMiddleware(supabase as any, req, RATE_LIMIT_CONFIGS.MEMBERS_AREA);
    if (rateLimitResult) return rateLimitResult;

    const body = await req.json();
    const { action, moduleId, contentId, data, orderedIds } = body;

    console.log(`[content-crud] Action: ${action}`);

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

      const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

      const { data: newContent, error: insertError } = await supabase
        .from("product_member_content")
        .insert({
          module_id: moduleId,
          title: (data as ContentData).title!.trim(),
          content_type: (data as ContentData).content_type || "text",
          content_url: (data as ContentData).content_url || null,
          body: (data as ContentData).body || null,
          description: (data as ContentData).description || null,
          is_active: (data as ContentData).is_active !== false,
          position: nextPosition,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[content-crud] Create error:", insertError);
        return jsonResponse({ success: false, error: "Erro ao criar conteúdo" }, 500);
      }

      console.log(`[content-crud] Content created: ${newContent.id} by ${producer.id}`);
      return jsonResponse({ success: true, data: newContent });
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

      const updates: Record<string, any> = {};
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
        console.error("[content-crud] Update error:", updateError);
        return jsonResponse({ success: false, error: "Erro ao atualizar conteúdo" }, 500);
      }

      console.log(`[content-crud] Content updated: ${contentId} by ${producer.id}`);
      return jsonResponse({ success: true, data: updatedContent });
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
        console.error("[content-crud] Delete error:", deleteError);
        return jsonResponse({ success: false, error: "Erro ao excluir conteúdo" }, 500);
      }

      console.log(`[content-crud] Content deleted: ${contentId} by ${producer.id}`);
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
        console.error("[content-crud] Reorder error");
        return jsonResponse({ success: false, error: "Erro ao reordenar conteúdos" }, 500);
      }

      console.log(`[content-crud] Contents reordered by ${producer.id}`);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ success: false, error: `Ação desconhecida: ${action}` }, 400);

  } catch (error: unknown) {
    console.error("[content-crud] Error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
