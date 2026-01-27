/**
 * ============================================================================
 * Post-PIX Handler - Ações Pós-Criação do PIX
 * ============================================================================
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Gerencia ações após a criação bem-sucedida de um PIX:
 * - Atualizar order com dados do PIX (qr_code, pix_id, status)
 * - Disparar webhook pix_generated
 * - Registrar pagamentos manuais necessários (split > 50%)
 * 
 * @module pushinpay-create-pix/handlers/post-pix
 * @author RiseCheckout Team
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { PushinPayResponse } from "./pix-builder.ts";
import type { SmartSplitDecision } from "./smart-split.ts";
import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("pushinpay-create-pix");

interface UpdateOrderParams {
  supabase: SupabaseClient;
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
    log.error(`Erro ao atualizar pedido ${orderId}:`, { error: updateError });
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
    log.warn('INTERNAL_WEBHOOK_SECRET nao configurado - pix_generated nao sera disparado');
    return;
  }

  try {
    log.info(`Disparando evento pix_generated para order ${orderId}`);
    
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
      log.info(`Evento pix_generated disparado com sucesso para order ${orderId}`);
    } else {
      const errorText = await webhookResponse.text();
      log.warn(`Erro ao disparar pix_generated:`, { error: errorText });
    }
  } catch (webhookError) {
    log.warn('Excecao ao disparar pix_generated (nao critico):', { error: webhookError });
  }
}

interface LogManualPaymentParams {
  supabase: SupabaseClient;
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
