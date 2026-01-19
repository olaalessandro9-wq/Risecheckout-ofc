/**
 * content-save Edge Function
 * 
 * Handles atomic save for members area content:
 * - save-full: Atomic save (content + attachments + drip settings)
 * 
 * @version 2.0.0
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2, PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS } from "../_shared/rate-limiting/index.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("content-save");

const corsHeaders = PUBLIC_CORS_HEADERS;

// ============================================
// INTERFACES
// ============================================

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

interface AttachmentData {
  id: string;
  file_name?: string;
  file_url?: string;
}

interface RequestBody {
  action: string;
  moduleId?: string;
  contentId?: string;
  content?: ContentData;
  release?: ReleaseData;
  attachments?: AttachmentData[];
}

interface JsonResponseData {
  success?: boolean;
  error?: string;
  contentId?: string;
  isNew?: boolean;
}

interface ModuleWithProduct {
  id: string;
  product_id: string;
  products: {
    user_id: string;
  };
}

interface ContentWithModule {
  id: string;
  module_id: string;
  product_member_modules: {
    id: string;
    product_id: string;
    products: {
      user_id: string;
    };
  };
}

interface ContentPosition {
  position: number;
}

// ============================================
// HELPERS
// ============================================

function jsonResponse(data: JsonResponseData, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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

  const moduleData = module as unknown as ModuleWithProduct;
  if (moduleData.products.user_id !== producerId) {
    return { valid: false, error: "Você não tem permissão para acessar este módulo" };
  }

  return { valid: true, productId: moduleData.product_id };
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

  const contentData = content as unknown as ContentWithModule;
  if (contentData.product_member_modules.products.user_id !== producerId) {
    return { valid: false, error: "Você não tem permissão para acessar este conteúdo" };
  }

  return {
    valid: true,
    moduleId: contentData.module_id,
    productId: contentData.product_member_modules.product_id,
  };
}

async function saveDripSettings(
  supabase: SupabaseClient,
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

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rateLimitResult = await rateLimitMiddleware(supabase, req, RATE_LIMIT_CONFIGS.MEMBERS_AREA, corsHeaders);
    if (rateLimitResult) return rateLimitResult;

    const body = await req.json() as RequestBody;
    const { action, moduleId, contentId, content, release, attachments } = body;

    log.info(`Action: ${action}`);

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

      const contentData = content as ContentData | undefined;
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

          const existingPositions = existing as ContentPosition[] | null;
          const nextPosition = existingPositions && existingPositions.length > 0 ? existingPositions[0].position + 1 : 0;

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
            log.error("create error:", createError);
            return jsonResponse({ success: false, error: "Erro ao criar conteúdo" }, 500);
          }

          const newContentData = newContent as { id: string };
          savedContentId = newContentData.id;
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
            log.error("update error:", updateError);
            return jsonResponse({ success: false, error: "Erro ao atualizar conteúdo" }, 500);
          }
        }

        // Handle orphan attachments cleanup
        if (savedContentId && attachments !== undefined) {
          const attachmentIds = (attachments as AttachmentData[])
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
            log.warn("Failed to save drip settings");
          }
        }

        log.info(`Content save-full: ${savedContentId} by ${producer.id}`);
        return jsonResponse({ success: true, contentId: savedContentId, isNew });
      } catch (err: unknown) {
        log.error("save-full exception:", err);
        return jsonResponse({ success: false, error: "Erro ao salvar conteúdo" }, 500);
      }
    }

    return jsonResponse({ success: false, error: `Ação desconhecida: ${action}` }, 400);

  } catch (error: unknown) {
    log.error("Error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
