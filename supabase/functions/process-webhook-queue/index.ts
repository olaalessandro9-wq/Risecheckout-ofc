/**
 * process-webhook-queue Edge Function
 * 
 * ARQUITETURA: Retry DIRETO de webhooks falhos
 * NÃO chama trigger-webhooks para evitar loop infinito
 * 
 * Fluxo:
 * 1. Recebe delivery_id do webhook com falha (via Database Trigger)
 * 2. Busca payload original de webhook_deliveries
 * 3. Busca URL/secret do webhook de outbound_webhooks
 * 4. Reenvia diretamente via fetch()
 * 5. Atualiza status/attempts em webhook_deliveries
 * 
 * @version 2.0.0 - Zero `any` compliance (RISE Protocol V2)
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

const corsHeaders = PUBLIC_CORS_HEADERS;

// ============================================
// TYPES
// ============================================

interface WebhookRecord {
  id: string;
  status: string;
  attempts?: number;
}

interface WebhookPayload {
  record: WebhookRecord | null;
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: unknown;
  attempts: number;
}

interface OutboundWebhook {
  url: string;
  secret_encrypted: string;
  active: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // 🔒 SEGURANÇA: Validar X-Internal-Secret (obrigatório)
  const internalSecret = req.headers.get('X-Internal-Secret');
  const expectedSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');

  if (!internalSecret || internalSecret !== expectedSecret) {
    console.log("[process-webhook-queue] ❌ Unauthorized: Invalid or missing X-Internal-Secret");
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log("[process-webhook-queue] ✅ Autenticação validada");

  try {
    const payload: WebhookPayload = await req.json();
    const record = payload.record;

    console.log("[process-webhook-queue] Iniciando processamento...", { 
      hasRecord: !!record,
      recordId: record?.id 
    });

    // Validar que é um registro válido para processar
    if (!record || !record.id) {
      console.log("[process-webhook-queue] Nenhum registro válido recebido");
      return new Response(JSON.stringify({ 
        processed: false, 
        reason: "No valid record provided" 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // GUARDA: Só processar se status permite retry
    if (record.status === 'success') {
      console.log("[process-webhook-queue] Registro já processado com sucesso, ignorando");
      return new Response(JSON.stringify({ 
        processed: false, 
        reason: "Already successful" 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // GUARDA: Só processar se attempts < 5
    if ((record.attempts || 0) >= 5) {
      console.log("[process-webhook-queue] Máximo de tentativas atingido, ignorando");
      return new Response(JSON.stringify({ 
        processed: false, 
        reason: "Max attempts reached" 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Buscar dados completos do delivery
    const { data: delivery, error: deliveryError } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('id', record.id)
      .single();

    if (deliveryError || !delivery) {
      console.error("[process-webhook-queue] Delivery não encontrado:", deliveryError);
      return new Response(JSON.stringify({ 
        error: "Delivery not found" 
      }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const typedDelivery = delivery as WebhookDelivery;

    // Buscar dados do webhook de outbound_webhooks - usando secret_encrypted (seguro)
    const { data: webhook, error: webhookError } = await supabase
      .from('outbound_webhooks')
      .select('url, secret_encrypted, active')
      .eq('id', typedDelivery.webhook_id)
      .single();

    if (webhookError || !webhook) {
      console.error("[process-webhook-queue] Webhook não encontrado:", webhookError);
      
      // Marcar como falho permanente
      await supabase
        .from('webhook_deliveries')
        .update({ 
          status: 'failed', 
          response_body: 'Webhook configuration not found',
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', typedDelivery.id);

      return new Response(JSON.stringify({ 
        error: "Webhook configuration not found" 
      }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const typedWebhook = webhook as OutboundWebhook;

    // Verificar se webhook está ativo
    if (!typedWebhook.active) {
      console.log("[process-webhook-queue] Webhook inativo, ignorando");
      await supabase
        .from('webhook_deliveries')
        .update({ 
          status: 'failed', 
          response_body: 'Webhook is inactive',
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', typedDelivery.id);

      return new Response(JSON.stringify({ 
        processed: false, 
        reason: "Webhook inactive" 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Marcar como processando
    await supabase
      .from('webhook_deliveries')
      .update({ 
        status: 'processing', 
        last_attempt_at: new Date().toISOString() 
      })
      .eq('id', typedDelivery.id);

    console.log(`[process-webhook-queue] 🔄 Reenviando webhook ${typedDelivery.id} para ${typedWebhook.url}`);

    // Gerar assinatura HMAC usando Web Crypto API
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payloadString = JSON.stringify(typedDelivery.payload);
    const signaturePayload = `${timestamp}.${payloadString}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(typedWebhook.secret_encrypted);
    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signaturePayload));
    const signature = encodeHex(new Uint8Array(signatureBuffer));

    // Enviar webhook diretamente
    try {
      const response = await fetch(typedWebhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Rise-Signature': signature,
          'X-Rise-Timestamp': timestamp,
          'X-Rise-Event': typedDelivery.event_type,
          'X-Rise-Delivery-ID': typedDelivery.id,
          'User-Agent': 'RiseCheckout-Webhook/1.0'
        },
        body: payloadString
      });

      const responseText = await response.text();
      const isSuccess = response.ok;

      console.log(`[process-webhook-queue] Resposta: ${response.status} - ${isSuccess ? 'SUCESSO' : 'FALHA'}`);

      if (isSuccess) {
        // Sucesso!
        await supabase
          .from('webhook_deliveries')
          .update({ 
            status: 'success',
            response_status: response.status,
            response_body: responseText.slice(0, 1000),
            last_attempt_at: new Date().toISOString()
          })
          .eq('id', typedDelivery.id);

        console.log(`[process-webhook-queue] ✅ Webhook ${typedDelivery.id} entregue com sucesso`);
      } else {
        // Falha - incrementar tentativas
        const nextAttempts = (typedDelivery.attempts || 0) + 1;
        const nextStatus = nextAttempts >= 5 ? 'failed' : 'pending';

        await supabase
          .from('webhook_deliveries')
          .update({ 
            status: nextStatus,
            attempts: nextAttempts,
            response_status: response.status,
            response_body: responseText.slice(0, 1000),
            last_attempt_at: new Date().toISOString()
          })
          .eq('id', typedDelivery.id);

        console.log(`[process-webhook-queue] ❌ Webhook ${typedDelivery.id} falhou (tentativa ${nextAttempts}/5)`);
      }

      return new Response(JSON.stringify({ 
        success: isSuccess,
        delivery_id: typedDelivery.id,
        response_status: response.status
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });

    } catch (fetchError: unknown) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error(`[process-webhook-queue] Erro de rede:`, fetchError);
      
      const nextAttempts = (typedDelivery.attempts || 0) + 1;
      const nextStatus = nextAttempts >= 5 ? 'failed' : 'pending';

      await supabase
        .from('webhook_deliveries')
        .update({ 
          status: nextStatus,
          attempts: nextAttempts,
          response_body: `Network error: ${errorMessage}`,
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', typedDelivery.id);

      return new Response(JSON.stringify({ 
        success: false,
        error: errorMessage 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[process-webhook-queue] Erro fatal:", error);
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
