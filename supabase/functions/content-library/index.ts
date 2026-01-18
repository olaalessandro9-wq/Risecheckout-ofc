/**
 * Content Library Edge Function
 * 
 * RISE Protocol V3 - Single Responsibility
 * Handles video library and webhook logs
 * 
 * Actions:
 * - get-video-library: Retorna biblioteca de vídeos do produto
 * - get-webhook-logs: Retorna logs de webhook
 * 
 * @version 1.0.0 - Extracted from products-crud
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// ==========================================
// TYPES
// ==========================================

type Action = "get-video-library" | "get-webhook-logs";

interface RequestBody {
  action: Action;
  productId?: string;
  webhookId?: string;
  excludeContentId?: string;
}

// ==========================================
// HELPERS
// ==========================================

function jsonResponse(data: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, code: string, corsHeaders: Record<string, string>, status = 400): Response {
  return jsonResponse({ error: message, code }, corsHeaders, status);
}

// ==========================================
// HANDLERS
// ==========================================

async function getVideoLibrary(
  supabase: SupabaseClient,
  productId: string,
  producerId: string,
  excludeContentId: string | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Verify ownership
  const { data: product } = await supabase
    .from("products")
    .select("user_id")
    .eq("id", productId)
    .single();

  if (!product || product.user_id !== producerId) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data, error } = await supabase
    .from("product_member_content")
    .select(`
      id,
      title,
      content_url,
      module:module_id (
        id,
        title,
        product_id
      )
    `)
    .not("content_url", "is", null)
    .eq("is_active", true);

  if (error) {
    console.error("[content-library] Get video library error:", error);
    return errorResponse("Erro ao buscar vídeos", "DB_ERROR", corsHeaders, 500);
  }

  // Filter by product and map
  const videos = [];
  const seenUrls = new Set<string>();

  for (const item of data || []) {
    const moduleData = item.module;
    if (!moduleData || Array.isArray(moduleData)) continue;
    const module = moduleData as { id: string; title: string; product_id: string };
    if (module.product_id !== productId) continue;
    if (excludeContentId && item.id === excludeContentId) continue;
    if (!item.content_url) continue;

    // Avoid duplicates
    if (seenUrls.has(item.content_url)) continue;
    seenUrls.add(item.content_url);

    videos.push({
      id: item.id,
      url: item.content_url,
      title: item.title,
      moduleTitle: module.title,
    });
  }

  return jsonResponse({ videos }, corsHeaders);
}

async function getWebhookLogs(
  supabase: SupabaseClient,
  webhookId: string,
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // First verify webhook ownership via product
  const { data: webhook, error: webhookError } = await supabase
    .from("product_webhooks")
    .select("product_id")
    .eq("id", webhookId)
    .single();

  if (webhookError || !webhook) {
    return errorResponse("Webhook não encontrado", "NOT_FOUND", corsHeaders, 404);
  }

  // Verify product ownership
  const { data: product } = await supabase
    .from("products")
    .select("user_id")
    .eq("id", webhook.product_id)
    .single();

  if (!product || product.user_id !== producerId) {
    return errorResponse("Acesso negado", "FORBIDDEN", corsHeaders, 403);
  }

  const { data, error } = await supabase
    .from("webhook_deliveries")
    .select("*")
    .eq("webhook_id", webhookId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[content-library] Get webhook logs error:", error);
    return errorResponse("Erro ao buscar logs", "DB_ERROR", corsHeaders, 500);
  }

  return jsonResponse({ logs: data || [] }, corsHeaders);
}

// ==========================================
// MAIN HANDLER
// ==========================================

serve(async (req) => {
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase: SupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json() as RequestBody;
    const { action, productId, webhookId, excludeContentId } = body;

    console.log(`[content-library] Action: ${action}`);

    // All actions require authentication
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    console.log(`[content-library] Producer: ${producer.id}`);

    switch (action) {
      case "get-video-library":
        if (!productId) {
          return errorResponse("productId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getVideoLibrary(supabase, productId, producer.id, excludeContentId, corsHeaders);

      case "get-webhook-logs":
        if (!webhookId) {
          return errorResponse("webhookId é obrigatório", "VALIDATION_ERROR", corsHeaders, 400);
        }
        return getWebhookLogs(supabase, webhookId, producer.id, corsHeaders);

      default:
        return errorResponse(`Ação desconhecida: ${action}`, "INVALID_ACTION", corsHeaders, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[content-library] Error:", errorMessage);
    return errorResponse("Erro interno do servidor", "INTERNAL_ERROR", corsHeaders, 500);
  }
});
