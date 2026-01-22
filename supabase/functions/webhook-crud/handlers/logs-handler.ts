/**
 * webhook-crud Logs Handler
 * 
 * @version 3.1.0 - RISE Protocol V3 Compliant
 * @module webhook-crud/handlers/logs-handler
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { verifyWebhookOwnership } from "./list-handlers.ts";
import type { WebhookLogEntry } from "../types.ts";

const log = createLogger("WebhookCrud.LogsHandler");

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
// GET WEBHOOK LOGS
// ============================================

export async function getWebhookLogs(
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

  const { data: logs, error } = await supabase
    .from("webhook_deliveries")
    .select("id, webhook_id, order_id, event_type, payload, status, response_status, response_body, attempts, last_attempt_at, created_at")
    .eq("webhook_id", webhookId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    log.error("Get logs error:", error);
    return errorResponse("Erro ao buscar logs", corsHeaders, 500);
  }

  return jsonResponse({ success: true, logs: (logs || []) as WebhookLogEntry[] }, corsHeaders);
}
