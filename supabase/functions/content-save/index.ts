/**
 * content-save Edge Function
 * 
 * Handles atomic save for members area content:
 * - save-full: Atomic save (content + attachments + drip settings)
 * 
 * RISE Protocol Compliant
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS } from "../_shared/rate-limiter.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

interface ContentData {
  title: string;
  video_url?: string | null;
  body?: string | null;
}

interface ReleaseData {
  release_type: "immediate" | "days_after_purchase" | "fixed_date" | "after_content";
  days_after_purchase?: number | null;
  fixed_date?: string | null;
  after_content_id?: string | null;
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

async function saveDripSettings(
  supabase: any,
  contentId: string,
  release: ReleaseData
): Promise<boolean> {
  if (release.release_type === "immediate") {
    const { error } = await supabase
      .from("content_release_settings")
      .delete()
      .eq("content_id", contentId);
    return !error;
  }

  const upsertData = {
    content_id: contentId,
    release_type: release.release_type,
    days_after_purchase: release.release_type === "days_after_purchase" ? release.days_after_purchase : null,
    fixed_date: release.release_type === "fixed_date" ? release.fixed_date : null,
    after_content_id: release.release_type === "after_content" ? release.after_content_id : null,
  };

  const { error } = await supabase
    .from("content_release_settings")
    .upsert(upsertData, { onConflict: "content_id" });

  return !error;
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
    const { action, moduleId, contentId, content, release, attachments } = body;

    console.log(`[content-save] Action: ${action}`);

    // Require authentication
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return jsonResponse({ error: "Authorization required" }, 401);
    }

    // ========== SAVE-FULL ==========
    if (action === "save-full") {
      if (!moduleId) {
        return jsonResponse({ success: false, error: "moduleId é obrigatório" }, 400);
      }

      const contentData = content as ContentData;
      if (!contentData?.title || typeof contentData.title !== "string" || !contentData.title.trim()) {
        return jsonResponse({ success: false, error: "Título é obrigatório" }, 400);
      }

      const ownership = await verifyModuleOwnership(supabase, moduleId, producer.id);
      if (!ownership.valid) {
        return jsonResponse({ success: false, error: ownership.error }, 403);
      }

      let savedContentId = contentId;
      const isNew = !contentId;

      try {
        if (isNew) {
          // Create new content
          const { data: existing } = await supabase
            .from("product_member_content")
            .select("position")
            .eq("module_id", moduleId)
            .order("position", { ascending: false })
            .limit(1);

          const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

          const { data: newContent, error: createError } = await supabase
            .from("product_member_content")
            .insert({
              module_id: moduleId,
              title: contentData.title.trim(),
              content_type: "mixed",
              content_url: contentData.video_url || null,
              body: contentData.body || null,
              is_active: true,
              position: nextPosition,
            })
            .select("id")
            .single();

          if (createError) {
            console.error("[content-save] create error:", createError);
            return jsonResponse({ success: false, error: "Erro ao criar conteúdo" }, 500);
          }

          savedContentId = newContent.id;
        } else {
          // Verify content ownership
          const contentOwnership = await verifyContentOwnership(supabase, contentId!, producer.id);
          if (!contentOwnership.valid) {
            return jsonResponse({ success: false, error: contentOwnership.error }, 403);
          }

          // Update existing content
          const { error: updateError } = await supabase
            .from("product_member_content")
            .update({
              title: contentData.title.trim(),
              content_type: "mixed",
              content_url: contentData.video_url || null,
              body: contentData.body || null,
            })
            .eq("id", contentId);

          if (updateError) {
            console.error("[content-save] update error:", updateError);
            return jsonResponse({ success: false, error: "Erro ao atualizar conteúdo" }, 500);
          }
        }

        // Handle orphan attachments cleanup
        if (savedContentId && attachments !== undefined) {
          const attachmentIds = (attachments as any[])
            .map((a) => a.id)
            .filter((id: string) => !id.startsWith("temp-"));
          
          if (attachmentIds.length > 0) {
            await supabase
              .from("content_attachments")
              .delete()
              .eq("content_id", savedContentId)
              .not("id", "in", `(${attachmentIds.join(",")})`);
          } else {
            await supabase
              .from("content_attachments")
              .delete()
              .eq("content_id", savedContentId);
          }
        }

        // Save release settings
        if (savedContentId && release) {
          const dripSaved = await saveDripSettings(supabase, savedContentId, release as ReleaseData);
          if (!dripSaved) {
            console.warn("[content-save] Failed to save drip settings");
          }
        }

        console.log(`[content-save] Content save-full: ${savedContentId} by ${producer.id}`);
        return jsonResponse({ success: true, contentId: savedContentId, isNew });
      } catch (err) {
        console.error("[content-save] save-full exception:", err);
        return jsonResponse({ success: false, error: "Erro ao salvar conteúdo" }, 500);
      }
    }

    return jsonResponse({ success: false, error: `Ação desconhecida: ${action}` }, 400);

  } catch (error: unknown) {
    console.error("[content-save] Error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
