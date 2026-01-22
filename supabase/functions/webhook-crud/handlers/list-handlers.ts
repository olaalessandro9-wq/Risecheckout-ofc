/**
 * webhook-crud List Handlers
 * 
 * @version 3.1.0 - RISE Protocol V3 Compliant
 * @module webhook-crud/handlers/list-handlers
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import type { WebhookWithProduct, WebhookOwnership } from "../types.ts";

const log = createLogger("WebhookCrud.ListHandlers");

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
// OWNERSHIP VERIFICATION
// ============================================

export async function verifyWebhookOwnership(
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
// LIST WEBHOOKS
// ============================================

export async function listWebhooksWithProducts(
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

  const productMap = new Map(
    (productsData || []).map((p: { id: string; name: string }) => [p.id, p.name])
  );

  const webhooksWithProducts: WebhookWithProduct[] = (webhooksData || []).map(
    (webhook: {
      id: string;
      name: string;
      url: string;
      events: string[];
      product_id: string | null;
      created_at: string;
    }) => ({
      ...webhook,
      product: webhook.product_id
        ? { name: productMap.get(webhook.product_id) || "Produto não encontrado" }
        : null,
    })
  );

  return jsonResponse(
    { success: true, webhooks: webhooksWithProducts, products: productsData || [] },
    corsHeaders
  );
}

// ============================================
// LIST PRODUCTS
// ============================================

export async function listUserProducts(
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

// ============================================
// GET WEBHOOK PRODUCTS
// ============================================

export async function getWebhookProducts(
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
