/**
 * webhook-crud Edge Function
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * - Uses unified-auth.ts for authentication
 * - Removed local validateProducerSession
 *
 * Centralizes all webhook CRUD operations:
 * - create: Create new webhook with products
 * - update: Update webhook and products
 * - delete: Delete webhook
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("WebhookCrud");

// ============================================
// INTERFACES
// ============================================

interface JsonResponseData {
  success?: boolean;
  error?: string;
  webhook?: WebhookRecord;
  webhooks?: WebhookWithProduct[];
  products?: { id: string; name: string }[];
  productIds?: string[];
  deletedId?: string;
}

interface WebhookWithProduct {
  id: string;
  name: string;
  url: string;
  events: string[];
  product_id: string | null;
  created_at: string;
  product?: { name: string } | null;
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
// LIST HANDLERS
// ============================================

async function listWebhooksWithProducts(
  supabase: SupabaseClient,
  vendorId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: webhooksData, error: webhooksError } = await supabase
    .from("outbound_webhooks")
    .select("id, name, url, events, product_id, created_at")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  if (webhooksError) {
    log.error("List error:", webhooksError);
    return errorResponse("Erro ao listar webhooks", corsHeaders, 500);
  }

  const { data: productsData } = await supabase
    .from("products")
    .select("id, name")
    .eq("user_id", vendorId)
    .eq("status", "active");

  const productMap = new Map((productsData || []).map((p: { id: string; name: string }) => [p.id, p.name]));

  const webhooksWithProducts: WebhookWithProduct[] = (webhooksData || []).map((webhook: {
    id: string;
    name: string;
    url: string;
    events: string[];
    product_id: string | null;
    created_at: string;
  }) => ({
    ...webhook,
    product: webhook.product_id ? { name: productMap.get(webhook.product_id) || "Produto não encontrado" } : null,
  }));

  // Also fetch products for the response
  return jsonResponse({ success: true, webhooks: webhooksWithProducts, products: productsData || [] }, corsHeaders);
}

async function listUserProducts(
  supabase: SupabaseClient,
  vendorId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .eq("user_id", vendorId)
    .eq("status", "active")
    .order("name");

  if (error) {
    log.error("Products error:", error);
    return errorResponse("Erro ao listar produtos", corsHeaders, 500);
  }

  return jsonResponse({ success: true, products: data || [] }, corsHeaders);
}

async function getWebhookProducts(
  supabase: SupabaseClient,
  webhookId: string,
  vendorId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const ownership = await verifyWebhookOwnership(supabase, webhookId, vendorId);
  if (!ownership.valid) {
    return errorResponse(ownership.error!, corsHeaders, 403);
  }

  const { data, error } = await supabase
    .from("webhook_products")
    .select("product_id")
    .eq("webhook_id", webhookId);

  if (error) {
    log.error("Get webhook products error:", error);
    const { data: webhookData } = await supabase
      .from("outbound_webhooks")
      .select("product_id")
      .eq("id", webhookId)
      .single();
    
    const productIds = webhookData?.product_id ? [webhookData.product_id] : [];
    return jsonResponse({ success: true, productIds }, corsHeaders);
  }

  const productIds = (data || []).map((item: { product_id: string }) => item.product_id);
  return jsonResponse({ success: true, productIds }, corsHeaders);
}

// ============================================
// MAIN HANDLER
// ============================================

serve(withSentry("webhook-crud", async (req) => {
  const corsResult = handleCorsV2(req);
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

    log.info(`Action: ${action}`);

    // ============================================
    // AUTHENTICATION via unified-auth.ts
    // ============================================
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }
    const vendorId = producer.id;

    // ============================================
    // LIST ACTIONS (no webhookId required)
    // ============================================
    if (action === "list" || action === "list-with-products") {
      return listWebhooksWithProducts(supabase, vendorId, corsHeaders);
    }

    if (action === "list-products" || action === "list-user-products") {
      return listUserProducts(supabase, vendorId, corsHeaders);
    }

    if (action === "get-webhook-products") {
      if (!webhookId) {
        return errorResponse("webhookId é obrigatório", corsHeaders, 400);
      }
      return getWebhookProducts(supabase, webhookId, vendorId, corsHeaders);
    }

    // ============================================
    // CREATE WEBHOOK
    // ============================================
    if (action === "create") {
      if (!data?.name || !data?.url || !Array.isArray(data?.events)) {
        return errorResponse("name, url e events são obrigatórios", corsHeaders, 400);
      }

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
        log.error("Create error:", insertError);
        return errorResponse("Erro ao criar webhook", corsHeaders, 500);
      }

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
          log.warn("Link products error:", linkError);
        }
      }

      log.info(`Webhook created: ${(newWebhook as WebhookRecord).id} by ${vendorId}`);
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
        log.error("Update error:", updateError);
        return errorResponse("Erro ao atualizar webhook", corsHeaders, 500);
      }

      if (Array.isArray(data?.product_ids)) {
        await supabase.from("webhook_products").delete().eq("webhook_id", webhookId);

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

      log.info(`Webhook updated: ${webhookId} by ${vendorId}`);
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
        log.error("Delete error:", deleteError);
        return errorResponse("Erro ao excluir webhook", corsHeaders, 500);
      }

      log.info(`Webhook deleted: ${webhookId} by ${vendorId}`);
      return jsonResponse({ success: true, deletedId: webhookId }, corsHeaders);
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 400);

  } catch (error: unknown) {
    log.error("Unexpected error:", error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      functionName: "webhook-crud",
      url: req.url,
      method: req.method,
    });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
