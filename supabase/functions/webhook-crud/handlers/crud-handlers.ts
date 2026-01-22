/**
 * webhook-crud CRUD Handlers
 * 
 * @version 3.1.0 - RISE Protocol V3 Compliant
 * @module webhook-crud/handlers/crud-handlers
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { verifyWebhookOwnership } from "./list-handlers.ts";
import type { WebhookData, WebhookRecord, WebhookUpdates } from "../types.ts";

const log = createLogger("WebhookCrud.CrudHandlers");

// ============================================
// HELPERS
// ============================================

function jsonResponse(
  data: Record<string, unknown>,
  corsHeaders: Record<string, string>,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(
  message: string,
  corsHeaders: Record<string, string>,
  status = 400
): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}

// ============================================
// CREATE WEBHOOK
// ============================================

export async function createWebhook(
  supabase: SupabaseClient,
  vendorId: string,
  data: WebhookData,
  corsHeaders: Record<string, string>
): Promise<Response> {
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

export async function updateWebhook(
  supabase: SupabaseClient,
  webhookId: string,
  vendorId: string,
  data: WebhookData | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
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

export async function deleteWebhook(
  supabase: SupabaseClient,
  webhookId: string,
  vendorId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
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
