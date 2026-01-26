/**
 * send-webhook-test - Envia webhook de teste
 * 
 * @version 2.0.0 - RISE ARCHITECT PROTOCOL V3 - 10.0/10 (Zero any)
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2, PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "../_shared/rate-limiting/index.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("SendWebhookTest");

// === INTERFACES (Zero any) ===

interface RequestBody {
  webhook_id?: string;
  webhook_url: string;
  event_type: string;
  payload: Record<string, unknown>;
}

interface WebhookRecord {
  secret_encrypted: string | null;
}

interface WebhookDeliveryEntry {
  webhook_id: string;
  order_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: string;
  response_status: number;
  response_body: string;
  last_attempt_at: string;
  attempts: number;
}

// === HELPER FUNCTIONS ===

async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// === MAIN HANDLER ===

Deno.serve(async (req) => {
  // CORS handling
  const corsResult = handleCorsV2(req);
  
  // If it's a Response (preflight or error), return it
  if (corsResult instanceof Response) {
    return corsResult;
  }
  
  const corsHeaders = corsResult.headers;

  try {
    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(
      supabaseClient,
      req,
      RATE_LIMIT_CONFIGS.WEBHOOK_TEST,
      corsHeaders
    );
    if (rateLimitResult) {
      log.warn(`Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    const body: RequestBody = await req.json();
    const { webhook_id, webhook_url, event_type, payload } = body;

    if (!webhook_url || !event_type || !payload) {
      throw new Error("webhook_url, event_type and payload are required");
    }

    log.info("Enviando teste:", {
      webhook_id,
      webhook_url,
      event_type,
    });

    // Buscar o secret do webhook
    let secret = "";
    if (webhook_id) {
      const { data: webhook, error: webhookError } = await supabaseClient
        .from("outbound_webhooks")
        .select("secret_encrypted")
        .eq("id", webhook_id)
        .single() as { data: WebhookRecord | null; error: Error | null };

      if (webhookError) {
        log.error("Error fetching webhook:", webhookError);
      } else {
        secret = webhook?.secret_encrypted || "";
      }
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Gerar assinatura HMAC
    const signature = secret
      ? await generateSignature(JSON.stringify(payload), secret)
      : "";

    // Enviar webhook
    const response = await fetch(webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Rise-Signature": signature,
        "X-Rise-Timestamp": timestamp,
        "X-Rise-Event": event_type,
        "X-Rise-Test": "true",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    log.info("Resposta:", {
      status: response.status,
      ok: response.ok,
    });

    // Registrar entrega para histórico
    if (webhook_id) {
      const deliveryEntry: WebhookDeliveryEntry = {
        webhook_id: webhook_id,
        order_id: (payload.id as string) || crypto.randomUUID(),
        event_type: event_type,
        payload: payload,
        status: response.ok ? "success" : "failed",
        response_status: response.status,
        response_body: responseText.substring(0, 1000),
        last_attempt_at: new Date().toISOString(),
        attempts: 1,
      };
      await supabaseClient.from("webhook_deliveries").insert(deliveryEntry);
    }

    return new Response(
      JSON.stringify({
        success: response.ok,
        status_code: response.status,
        response_body: responseText,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
