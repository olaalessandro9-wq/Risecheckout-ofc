/**
 * webhook-crud Edge Function
 * 
 * Centralizes all webhook CRUD operations:
 * - create: Create new webhook with products
 * - update: Update webhook and products
 * - delete: Delete webhook
 * 
 * RISE Protocol V2 Compliant - Zero `any`
 * Version: 2.0.0
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";

// ============================================
// INTERFACES
// ============================================

interface JsonResponseData {
  success?: boolean;
  error?: string;
  webhook?: WebhookRecord;
  deletedId?: string;
}

interface WebhookRecord {
  id: string;
  vendor_id: string;
  name: string;
  url: string;
  events: string[];
  product_id: string | null;
  secret: string;
  active: boolean;
}

interface WebhookData {
  name: string;
  url: string;
  events: string[];
  product_ids?: string[];
}

interface RequestBody {
  action: string;
  webhookId?: string;
  data?: WebhookData;
  sessionToken?: string;
}

interface SessionRecord {
  producer_id: string;
  expires_at: string;
  is_valid: boolean;
}

interface WebhookOwnership {
  id: string;
  vendor_id: string;
}

interface WebhookUpdates {
  updated_at: string;
  name?: string;
  url?: string;
  events?: string[];
  product_id?: string | null;
}

// ============================================
// HELPERS
// ============================================

function jsonResponse(data: JsonResponseData, corsHeaders: Record<string, string>, status = 200): Response {
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
  supabase: SupabaseClient,
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

  const typedSession = session as SessionRecord;

  if (!typedSession.is_valid) {
    return { valid: false, error: "Sessão expirada ou invalidada" };
  }

  if (new Date(typedSession.expires_at) < new Date()) {
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

  return { valid: true, producerId: typedSession.producer_id };
}

// ============================================
// WEBHOOK OWNERSHIP
// ============================================

async function verifyWebhookOwnership(
  supabase: SupabaseClient,
  webhookId: string,
  vendorId: string
): Promise<{ valid: boolean; error?: string }> {
  const { data, error } = await supabase
    .from("outbound_webhooks")
    .select("id, vendor_id")
    .eq("id", webhookId)
    .single();

  if (error || !data) {
    return { valid: false, error: "Webhook não encontrado" };
  }

  const typedData = data as WebhookOwnership;

  if (typedData.vendor_id !== vendorId) {
    return { valid: false, error: "Você não tem permissão para editar este webhook" };
  }

  return { valid: true };
}

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("webhook-crud", async (req) => {
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Corpo da requisição inválido", corsHeaders, 400);
    }

    const { action, webhookId, data } = body;
    const sessionToken = body.sessionToken || req.headers.get("x-producer-session-token");

    console.log(`[webhook-crud] Action: ${action}`);

    // Validate session
    const sessionValidation = await validateProducerSession(supabase, sessionToken || "");
    if (!sessionValidation.valid) {
      return errorResponse(sessionValidation.error || "Não autorizado", corsHeaders, 401);
    }
    const vendorId = sessionValidation.producerId!;

    // ============================================
    // CREATE WEBHOOK
    // ============================================
    if (action === "create") {
      if (!data?.name || !data?.url || !Array.isArray(data?.events)) {
        return errorResponse("name, url e events são obrigatórios", corsHeaders, 400);
      }

      // Gerar secret
      const secret = `whsec_${crypto.randomUUID().replace(/-/g, "")}`;

      const { data: newWebhook, error: insertError } = await supabase
        .from("outbound_webhooks")
        .insert({
          vendor_id: vendorId,
          name: data.name.trim(),
          url: data.url.trim(),
          events: data.events,
          product_id: data.product_ids?.[0] || null,
          secret,
          active: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[webhook-crud] Create error:", insertError);
        return errorResponse("Erro ao criar webhook", corsHeaders, 500);
      }

      // Insert product associations
      if (data.product_ids && data.product_ids.length > 0) {
        const { error: linkError } = await supabase
          .from("webhook_products")
          .insert(
            data.product_ids.map((productId: string) => ({
              webhook_id: (newWebhook as WebhookRecord).id,
              product_id: productId,
            }))
          );

        if (linkError) {
          console.warn("[webhook-crud] Link products error:", linkError);
        }
      }

      console.log(`[webhook-crud] Webhook created: ${(newWebhook as WebhookRecord).id} by ${vendorId}`);
      return jsonResponse({ success: true, webhook: newWebhook as WebhookRecord }, corsHeaders);
    }

    // ============================================
    // UPDATE WEBHOOK
    // ============================================
    if (action === "update") {
      if (!webhookId) {
        return errorResponse("webhookId é obrigatório", corsHeaders, 400);
      }

      const ownership = await verifyWebhookOwnership(supabase, webhookId, vendorId);
      if (!ownership.valid) {
        return errorResponse(ownership.error!, corsHeaders, 403);
      }

      const updates: WebhookUpdates = { updated_at: new Date().toISOString() };

      if (data?.name) updates.name = data.name.trim();
      if (data?.url) updates.url = data.url.trim();
      if (Array.isArray(data?.events)) updates.events = data.events;
      if (data?.product_ids?.[0] !== undefined) updates.product_id = data.product_ids[0] || null;

      const { error: updateError } = await supabase
        .from("outbound_webhooks")
        .update(updates)
        .eq("id", webhookId);

      if (updateError) {
        console.error("[webhook-crud] Update error:", updateError);
        return errorResponse("Erro ao atualizar webhook", corsHeaders, 500);
      }

      // Update product associations
      if (Array.isArray(data?.product_ids)) {
        // Remove old
        await supabase
          .from("webhook_products")
          .delete()
          .eq("webhook_id", webhookId);

        // Insert new
        if (data.product_ids.length > 0) {
          await supabase
            .from("webhook_products")
            .insert(
              data.product_ids.map((productId: string) => ({
                webhook_id: webhookId,
                product_id: productId,
              }))
            );
        }
      }

      console.log(`[webhook-crud] Webhook updated: ${webhookId} by ${vendorId}`);
      return jsonResponse({ success: true }, corsHeaders);
    }

    // ============================================
    // DELETE WEBHOOK
    // ============================================
    if (action === "delete") {
      if (!webhookId) {
        return errorResponse("webhookId é obrigatório", corsHeaders, 400);
      }

      const ownership = await verifyWebhookOwnership(supabase, webhookId, vendorId);
      if (!ownership.valid) {
        return errorResponse(ownership.error!, corsHeaders, 403);
      }

      const { error: deleteError } = await supabase
        .from("outbound_webhooks")
        .delete()
        .eq("id", webhookId);

      if (deleteError) {
        console.error("[webhook-crud] Delete error:", deleteError);
        return errorResponse("Erro ao excluir webhook", corsHeaders, 500);
      }

      console.log(`[webhook-crud] Webhook deleted: ${webhookId} by ${vendorId}`);
      return jsonResponse({ success: true, deletedId: webhookId }, corsHeaders);
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 400);

  } catch (error: unknown) {
    console.error("[webhook-crud] Unexpected error:", error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      functionName: "webhook-crud",
      url: req.url,
      method: req.method,
    });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
