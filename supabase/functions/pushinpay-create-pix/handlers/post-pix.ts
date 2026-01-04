/**
 * Post-PIX Handler
 * 
 * Ações após criação do PIX
 * 
 * @author RiseCheckout Team
 */

import type { PushinPayResponse } from "./pix-builder.ts";
import type { SmartSplitDecision } from "./smart-split.ts";

interface UpdateOrderParams {
  supabase: { from: (table: string) => any };
  orderId: string;
  pixData: PushinPayResponse;
  logPrefix: string;
}

export async function updateOrderWithPixData(params: UpdateOrderParams): Promise<void> {
  const { supabase, orderId, pixData, logPrefix } = params;
  
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      pix_id: pixData.id,
      pix_qr_code: pixData.qr_code,
      pix_status: pixData.status || 'pending',
      pix_created_at: new Date().toISOString(),
      gateway: 'pushinpay'
    })
    .eq('id', orderId);

  if (updateError) {
    console.error(`[${logPrefix}] Erro ao atualizar pedido:`, updateError);
  }
}

interface TriggerWebhookParams {
  supabaseUrl: string;
  orderId: string;
  logPrefix: string;
}

export async function triggerPixGeneratedWebhook(params: TriggerWebhookParams): Promise<void> {
  const { supabaseUrl, orderId, logPrefix } = params;
  
  const internalSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');
  if (!internalSecret) {
    console.warn(`[${logPrefix}] INTERNAL_WEBHOOK_SECRET nao configurado - pix_generated nao sera disparado`);
    return;
  }

  try {
    console.log(`[${logPrefix}] Disparando evento pix_generated para order ${orderId}`);
    
    const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/trigger-webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': internalSecret,
      },
      body: JSON.stringify({
        order_id: orderId,
        event_type: 'pix_generated',
      }),
    });
    
    if (webhookResponse.ok) {
      console.log(`[${logPrefix}] Evento pix_generated disparado com sucesso`);
    } else {
      const errorText = await webhookResponse.text();
      console.warn(`[${logPrefix}] Erro ao disparar pix_generated:`, errorText);
    }
  } catch (webhookError) {
    console.warn(`[${logPrefix}] Excecao ao disparar pix_generated (nao critico):`, webhookError);
  }
}

interface LogManualPaymentParams {
  supabase: { from: (table: string) => any };
  orderId: string;
  smartSplit: SmartSplitDecision;
  logPrefix: string;
}

export async function logManualPaymentIfNeeded(params: LogManualPaymentParams): Promise<void> {
  const { supabase, orderId, smartSplit, logPrefix } = params;
  
  if (!smartSplit.adjustedSplit || smartSplit.manualPaymentNeeded <= 0) {
    return;
  }
  
  await supabase.from('edge_function_errors').insert({
    function_name: `${logPrefix}-manual-payment`,
    order_id: orderId,
    error_message: `PAGAMENTO MANUAL NECESSÁRIO: ${smartSplit.manualPaymentNeeded} centavos`,
    request_payload: {
      pixCreatedBy: smartSplit.pixCreatedBy,
      manualPaymentNeeded: smartSplit.manualPaymentNeeded,
      originalSplitRules: smartSplit.splitRules
    },
    notes: 'Split excedeu 50%, diferença precisa ser paga manualmente'
  });
}
