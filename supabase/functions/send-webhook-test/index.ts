import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { webhook_id, webhook_url, event_type, payload } = await req.json();

    if (!webhook_url || !event_type || !payload) {
      throw new Error("webhook_url, event_type and payload are required");
    }

    console.log("[send-webhook-test] Enviando teste:", {
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
        .single();

      if (webhookError) {
        console.error("[send-webhook-test] Error fetching webhook:", webhookError);
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

    console.log("[send-webhook-test] Resposta:", {
      status: response.status,
      ok: response.ok,
    });

    // Registrar entrega para histórico
    if (webhook_id) {
      await supabaseClient.from("webhook_deliveries").insert({
        webhook_id: webhook_id,
        order_id: payload.id || crypto.randomUUID(),
        event_type: event_type,
        payload: payload,
        status: response.ok ? "success" : "failed",
        response_status: response.status,
        response_body: responseText.substring(0, 1000),
        last_attempt_at: new Date().toISOString(),
        attempts: 1,
      });
    }

    return new Response(
      JSON.stringify({
        success: response.ok,
        status_code: response.status,
        response_body: responseText,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-webhook-test] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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
