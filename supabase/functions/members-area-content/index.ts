/**
 * members-area-content Edge Function
 * 
 * Centralizes all content CRUD operations for members area:
 * - create: Create new content
 * - update: Update content
 * - delete: Delete content
 * - reorder: Reorder contents within a module
 * - save-full: Atomic save (content + attachments + drip settings)
 * 
 * RISE Protocol Compliant:
 * - Producer session authentication
 * - Ownership verification
 * - Atomic transactions for save-full
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";

// ============================================
// TYPES
// ============================================

interface ContentRequest {
  action: "create" | "update" | "delete" | "reorder" | "save-full";
  moduleId?: string;
  contentId?: string;
  productId?: string;
  data?: ContentData;
  orderedIds?: string[];
  release?: ReleaseData;
  attachmentIds?: string[];
  sessionToken?: string;
}

interface ContentData {
  title?: string;
  content_type?: string;
  content_url?: string | null;
  body?: string | null;
  description?: string | null;
  is_active?: boolean;
}

interface ReleaseData {
  release_type: "immediate" | "days_after_purchase" | "fixed_date" | "after_content";
  days_after_purchase?: number | null;
  fixed_date?: string | null;
  after_content_id?: string | null;
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
    console.error("[members-area-content] Rate limit check error:", error);
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

// ============================================
// DRIP SETTINGS HELPERS
// ============================================

async function saveDripSettings(
  supabase: any,
  contentId: string,
  release: ReleaseData
): Promise<boolean> {
  // If immediate, delete any existing settings
  if (release.release_type === "immediate") {
    const { error } = await supabase
      .from("content_release_settings")
      .delete()
      .eq("content_id", contentId);
    return !error;
  }

  // Upsert settings
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

serve(withSentry("members-area-content", async (req) => {
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: ContentRequest;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Corpo da requisição inválido", corsHeaders, 400);
    }

    const { action, moduleId, contentId, productId, data, orderedIds, release, attachmentIds } = body;
    const sessionToken = body.sessionToken || req.headers.get("x-producer-session-token");

    console.log(`[members-area-content] Action: ${action}`);

    // Validate session
    const sessionValidation = await validateProducerSession(supabase, sessionToken || "");
    if (!sessionValidation.valid) {
      return errorResponse(sessionValidation.error || "Não autorizado", corsHeaders, 401);
    }
    const producerId = sessionValidation.producerId!;

    // ============================================
    // CREATE CONTENT
    // ============================================
    if (action === "create") {
      if (!moduleId) {
        return errorResponse("moduleId é obrigatório", corsHeaders, 400);
      }

      if (!data?.title || typeof data.title !== "string" || !data.title.trim()) {
        return errorResponse("Título é obrigatório", corsHeaders, 400);
      }

      const ownership = await verifyModuleOwnership(supabase, moduleId, producerId);
      if (!ownership.valid) {
        return errorResponse(ownership.error!, corsHeaders, 403);
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
          title: data.title.trim(),
          content_type: data.content_type || "text",
          content_url: data.content_url || null,
          body: data.body || null,
          description: data.description || null,
          is_active: data.is_active !== false,
          position: nextPosition,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[members-area-content] Create error:", insertError);
        await captureException(new Error(insertError.message), {
          functionName: "members-area-content",
          extra: { action: "create", producerId, moduleId },
        });
        return errorResponse("Erro ao criar conteúdo", corsHeaders, 500);
      }

      console.log(`[members-area-content] Content created: ${newContent.id} by ${producerId}`);
      return jsonResponse({ success: true, content: newContent }, corsHeaders);
    }

    // ============================================
    // UPDATE CONTENT
    // ============================================
    if (action === "update") {
      if (!contentId) {
        return errorResponse("contentId é obrigatório", corsHeaders, 400);
      }

      const ownership = await verifyContentOwnership(supabase, contentId, producerId);
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

      if (data?.content_type !== undefined) updates.content_type = data.content_type;
      if (data?.content_url !== undefined) updates.content_url = data.content_url;
      if (data?.body !== undefined) updates.body = data.body;
      if (data?.description !== undefined) updates.description = data.description;
      if (data?.is_active !== undefined) updates.is_active = data.is_active;

      if (Object.keys(updates).length === 0) {
        return errorResponse("Nenhum campo para atualizar", corsHeaders, 400);
      }

      const { data: updatedContent, error: updateError } = await supabase
        .from("product_member_content")
        .update(updates)
        .eq("id", contentId)
        .select()
        .single();

      if (updateError) {
        console.error("[members-area-content] Update error:", updateError);
        return errorResponse("Erro ao atualizar conteúdo", corsHeaders, 500);
      }

      console.log(`[members-area-content] Content updated: ${contentId} by ${producerId}`);
      return jsonResponse({ success: true, content: updatedContent }, corsHeaders);
    }

    // ============================================
    // DELETE CONTENT
    // ============================================
    if (action === "delete") {
      if (!contentId) {
        return errorResponse("contentId é obrigatório", corsHeaders, 400);
      }

      const ownership = await verifyContentOwnership(supabase, contentId, producerId);
      if (!ownership.valid) {
        return errorResponse(ownership.error!, corsHeaders, 403);
      }

      // Delete content (cascade handles attachments and release settings)
      const { error: deleteError } = await supabase
        .from("product_member_content")
        .delete()
        .eq("id", contentId);

      if (deleteError) {
        console.error("[members-area-content] Delete error:", deleteError);
        return errorResponse("Erro ao excluir conteúdo", corsHeaders, 500);
      }

      console.log(`[members-area-content] Content deleted: ${contentId} by ${producerId}`);
      return jsonResponse({ success: true, deletedId: contentId }, corsHeaders);
    }

    // ============================================
    // REORDER CONTENTS
    // ============================================
    if (action === "reorder") {
      if (!moduleId) {
        return errorResponse("moduleId é obrigatório", corsHeaders, 400);
      }

      if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
        return errorResponse("orderedIds é obrigatório", corsHeaders, 400);
      }

      const ownership = await verifyModuleOwnership(supabase, moduleId, producerId);
      if (!ownership.valid) {
        return errorResponse(ownership.error!, corsHeaders, 403);
      }

      // Update positions
      const updates = orderedIds.map((id, index) =>
        supabase
          .from("product_member_content")
          .update({ position: index })
          .eq("id", id)
          .eq("module_id", moduleId)
      );

      const results = await Promise.all(updates);
      const hasError = results.some((r) => r.error);

      if (hasError) {
        console.error("[members-area-content] Reorder error");
        return errorResponse("Erro ao reordenar conteúdos", corsHeaders, 500);
      }

      console.log(`[members-area-content] Contents reordered by ${producerId}`);
      return jsonResponse({ success: true }, corsHeaders);
    }

    // ============================================
    // SAVE FULL (atomic: content + attachments + drip)
    // ============================================
    if (action === "save-full") {
      if (!moduleId) {
        return errorResponse("moduleId é obrigatório", corsHeaders, 400);
      }

      if (!data?.title || typeof data.title !== "string" || !data.title.trim()) {
        return errorResponse("Título é obrigatório", corsHeaders, 400);
      }

      const ownership = await verifyModuleOwnership(supabase, moduleId, producerId);
      if (!ownership.valid) {
        return errorResponse(ownership.error!, corsHeaders, 403);
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
              title: data.title.trim(),
              content_type: data.content_type || "mixed",
              content_url: data.content_url || null,
              body: data.body || null,
              is_active: true,
              position: nextPosition,
            })
            .select("id")
            .single();

          if (createError) {
            console.error("[members-area-content] save-full create error:", createError);
            return errorResponse("Erro ao criar conteúdo", corsHeaders, 500);
          }

          savedContentId = newContent.id;
        } else {
          // Verify content ownership
          const contentOwnership = await verifyContentOwnership(supabase, contentId!, producerId);
          if (!contentOwnership.valid) {
            return errorResponse(contentOwnership.error!, corsHeaders, 403);
          }

          // Update existing content
          const { error: updateError } = await supabase
            .from("product_member_content")
            .update({
              title: data.title.trim(),
              content_type: data.content_type || "mixed",
              content_url: data.content_url || null,
              body: data.body || null,
            })
            .eq("id", contentId);

          if (updateError) {
            console.error("[members-area-content] save-full update error:", updateError);
            return errorResponse("Erro ao atualizar conteúdo", corsHeaders, 500);
          }
        }

        // Handle orphan attachments cleanup
        if (savedContentId && attachmentIds !== undefined) {
          const idsToKeep = attachmentIds.filter((id) => !id.startsWith("temp-"));
          if (idsToKeep.length > 0) {
            await supabase
              .from("content_attachments")
              .delete()
              .eq("content_id", savedContentId)
              .not("id", "in", `(${idsToKeep.join(",")})`);
          } else {
            // Delete all attachments for this content
            await supabase
              .from("content_attachments")
              .delete()
              .eq("content_id", savedContentId);
          }
        }

        // Save release settings
        if (savedContentId && release) {
          const dripSaved = await saveDripSettings(supabase, savedContentId, release);
          if (!dripSaved) {
            console.warn("[members-area-content] Failed to save drip settings");
          }
        }

        console.log(`[members-area-content] Content save-full: ${savedContentId} by ${producerId}`);
        return jsonResponse({ success: true, contentId: savedContentId, isNew }, corsHeaders);
      } catch (err) {
        console.error("[members-area-content] save-full exception:", err);
        await captureException(err instanceof Error ? err : new Error(String(err)), {
          functionName: "members-area-content",
          extra: { action: "save-full", producerId, moduleId, contentId },
        });
        return errorResponse("Erro ao salvar conteúdo", corsHeaders, 500);
      }
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 400);
  } catch (error) {
    console.error("[members-area-content] Unexpected error:", error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      functionName: "members-area-content",
      url: req.url,
      method: req.method,
    });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
