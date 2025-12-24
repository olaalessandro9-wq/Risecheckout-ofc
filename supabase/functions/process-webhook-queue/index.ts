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
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();
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

    // Buscar dados do webhook de outbound_webhooks
    const { data: webhook, error: webhookError } = await supabase
      .from('outbound_webhooks')
      .select('url, secret, active')
      .eq('id', delivery.webhook_id)
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
        .eq('id', delivery.id);

      return new Response(JSON.stringify({ 
        error: "Webhook configuration not found" 
      }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Verificar se webhook está ativo
    if (!webhook.active) {
      console.log("[process-webhook-queue] Webhook inativo, ignorando");
      await supabase
        .from('webhook_deliveries')
        .update({ 
          status: 'failed', 
          response_body: 'Webhook is inactive',
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', delivery.id);

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
      .eq('id', delivery.id);

    console.log(`[process-webhook-queue] 🔄 Reenviando webhook ${delivery.id} para ${webhook.url}`);

    // Gerar assinatura HMAC
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payloadString = JSON.stringify(delivery.payload);
    const signaturePayload = `${timestamp}.${payloadString}`;
    const signature = createHmac('sha256', webhook.secret)
      .update(signaturePayload)
      .digest('hex');

    // Enviar webhook diretamente
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Rise-Signature': signature,
          'X-Rise-Timestamp': timestamp,
          'X-Rise-Event': delivery.event_type,
          'X-Rise-Delivery-ID': delivery.id,
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
          .eq('id', delivery.id);

        console.log(`[process-webhook-queue] ✅ Webhook ${delivery.id} entregue com sucesso`);
      } else {
        // Falha - incrementar tentativas
        const nextAttempts = (delivery.attempts || 0) + 1;
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
          .eq('id', delivery.id);

        console.log(`[process-webhook-queue] ❌ Webhook ${delivery.id} falhou (tentativa ${nextAttempts}/5)`);
      }

      return new Response(JSON.stringify({ 
        success: isSuccess,
        delivery_id: delivery.id,
        response_status: response.status
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });

    } catch (fetchError: any) {
      console.error(`[process-webhook-queue] Erro de rede:`, fetchError);
      
      const nextAttempts = (delivery.attempts || 0) + 1;
      const nextStatus = nextAttempts >= 5 ? 'failed' : 'pending';

      await supabase
        .from('webhook_deliveries')
        .update({ 
          status: nextStatus,
          attempts: nextAttempts,
          response_body: `Network error: ${fetchError.message}`,
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', delivery.id);

      return new Response(JSON.stringify({ 
        success: false,
        error: fetchError.message 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

  } catch (error: any) {
    console.error("[process-webhook-queue] Erro fatal:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
