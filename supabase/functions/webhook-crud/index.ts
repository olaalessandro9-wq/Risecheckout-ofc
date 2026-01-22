/**
 * webhook-crud Edge Function
 * 
 * @version 3.1.0 - RISE Protocol V3 Compliant (Modularized)
 * 
 * Centralizes all webhook CRUD operations via modular handlers.
 * 
 * Actions:
 * - list / list-with-products: List webhooks
 * - list-products / list-user-products: List vendor products
 * - get-webhook-products: Get products linked to webhook
 * - get-logs: Get webhook delivery logs
 * - create: Create new webhook
 * - update: Update webhook
 * - delete: Delete webhook
 *
 * @module webhook-crud
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

// Handlers
import { listWebhooksWithProducts, listUserProducts, getWebhookProducts } from "./handlers/list-handlers.ts";
import { createWebhook, updateWebhook, deleteWebhook } from "./handlers/crud-handlers.ts";
import { getWebhookLogs } from "./handlers/logs-handler.ts";

import type { RequestBody } from "./types.ts";

const log = createLogger("WebhookCrud");

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
    // ROUTER
    // ============================================
    switch (action) {
      // List operations
      case "list":
      case "list-with-products":
        return listWebhooksWithProducts(supabase, vendorId, corsHeaders);

      case "list-products":
      case "list-user-products":
        return listUserProducts(supabase, vendorId, corsHeaders);

      case "get-webhook-products":
        if (!webhookId) {
          return errorResponse("webhookId é obrigatório", corsHeaders, 400);
        }
        return getWebhookProducts(supabase, webhookId, vendorId, corsHeaders);

      // Logs
      case "get-logs":
        if (!webhookId) {
          return errorResponse("webhookId é obrigatório", corsHeaders, 400);
        }
        return getWebhookLogs(supabase, webhookId, vendorId, corsHeaders);

      // CRUD operations
      case "create":
        if (!data) {
          return errorResponse("data é obrigatório", corsHeaders, 400);
        }
        return createWebhook(supabase, vendorId, data, corsHeaders);

      case "update":
        if (!webhookId) {
          return errorResponse("webhookId é obrigatório", corsHeaders, 400);
        }
        return updateWebhook(supabase, webhookId, vendorId, data, corsHeaders);

      case "delete":
        if (!webhookId) {
          return errorResponse("webhookId é obrigatório", corsHeaders, 400);
        }
        return deleteWebhook(supabase, webhookId, vendorId, corsHeaders);

      default:
        return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 400);
    }
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
