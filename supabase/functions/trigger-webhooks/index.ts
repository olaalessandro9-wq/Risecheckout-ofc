/**
 * ============================================================================
 * TRIGGER-WEBHOOKS EDGE FUNCTION
 * ============================================================================
 * 
 * Versão: 474
 * Última Atualização: 2026-01-13
 * Status: ✅ Refatorado - Router Puro
 * 
 * RISE Protocol Compliant - < 150 linhas
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  logInfo,
  logError,
  sendToExternalWebhook,
  filterRelevantWebhooks,
  buildWebhookPayload,
  type WebhookRecord,
  type OrderItem,
  type Order,
} from "../_shared/trigger-webhooks-handlers.ts";

const FUNCTION_VERSION = "474";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const internalSecret = req.headers.get('X-Internal-Secret');
    const expectedSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');

    if (!internalSecret || internalSecret !== expectedSecret) {
      logError('Unauthorized: Invalid or missing X-Internal-Secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[trigger-webhooks] Versão ${FUNCTION_VERSION} iniciada (P0-5 secured)`);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { order_id, event_type } = await req.json();
    if (!order_id || !event_type) throw new Error("Campos obrigatórios ausentes");

    logInfo("🚀 Iniciando processamento", { order_id, event_type });

    const { data: order, error: orderError } = await supabase
      .from("orders").select("*").eq("id", order_id).single();
    if (orderError || !order) throw new Error("Pedido não encontrado");

    const { data: items, error: itemsError } = await supabase
      .from("order_items").select("*").eq("order_id", order_id);
    if (itemsError || !items?.length) {
      logInfo("⚠️ Pedido sem itens, abortando.");
      return new Response(JSON.stringify({ message: "No items" }), { headers: CORS_HEADERS });
    }

    const { data: webhooks, error: webHooksError } = await supabase
      .from("outbound_webhooks")
      .select(`id, url, name, events, secret_encrypted, secret, webhook_products(product_id)`)
      .eq("vendor_id", (order as Order).vendor_id)
      .eq("active", true);

    if (webHooksError) throw new Error("Erro ao buscar webhooks: " + webHooksError.message);
    
    if (!webhooks?.length) {
      logInfo("ℹ️ Nenhum webhook configurado para este vendedor.");
      return new Response(JSON.stringify({ message: "No webhooks configured" }), { headers: CORS_HEADERS });
    }

    const results = [];

    for (const item of items as OrderItem[]) {
      logInfo(`🔍 Analisando item: ${item.product_name} (${item.product_id})`);

      const relevantWebhooks = filterRelevantWebhooks(webhooks as WebhookRecord[], item.product_id, event_type);

      for (const webhook of relevantWebhooks) {
        const payload = buildWebhookPayload(event_type, order as Order, item);
        const result = await sendToExternalWebhook(webhook, payload, item.product_id, item.product_name);
        
        await supabase.from("webhook_deliveries").insert({
          webhook_id: webhook.id,
          order_id: (order as Order).id,
          event_type,
          payload,
          status: result.success ? "success" : "failed",
          response_status: result.status,
          attempts: 1
        });

        results.push(result);
      }
    }

    logInfo("✅ Processamento concluído", { total_webhooks_sent: results.length });

    return new Response(JSON.stringify({ success: true, results }), { 
      status: 200, headers: CORS_HEADERS 
    });

  } catch (error: unknown) {
    const err = error as Error;
    logError("Erro Fatal", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
});
