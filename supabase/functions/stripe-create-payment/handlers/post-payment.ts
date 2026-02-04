/**
 * post-payment.ts - Ações pós-pagamento (transferência afiliado, webhooks, PIX, UTMify)
 * 
 * RISE Protocol V3 - 10.0/10 Compliant
 * Uses 'users' table as SSOT for affiliate stripe account lookup
 * 
 * @version 2.0.0 - UTMify Backend SSOT
 */

import Stripe from "https://esm.sh/stripe@14.14.0";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { OrderData } from "./order-loader.ts";
import { Logger } from "../../_shared/logger.ts";
import { dispatchUTMifyEventForOrder } from "../../_shared/utmify/index.ts";

/**
 * Processa comissão de afiliado via Stripe Transfer
 * 
 * RISE V3: Uses 'users' table as SSOT for affiliate stripe account
 */
export async function processAffiliateCommission(
  stripe: Stripe,
  supabase: SupabaseClient,
  order: OrderData,
  orderId: string,
  log: Logger
): Promise<void> {
  if (!order.affiliate_id || !order.commission_cents || order.commission_cents <= 0) {
    return;
  }

  try {
    const affiliateUserId = order.affiliates?.user_id;
    
    if (!affiliateUserId) {
      return;
    }

    // RISE V3: Use 'users' table as SSOT
    const { data: affiliateUser } = await supabase
      .from("users")
      .select("stripe_account_id")
      .eq("id", affiliateUserId)
      .maybeSingle();

    const affiliateStripeAccountId = affiliateUser?.stripe_account_id;

    if (!affiliateStripeAccountId) {
      log.warn("Affiliate has no Stripe account connected - skipping transfer", {
        affiliate_id: order.affiliate_id,
        affiliate_user_id: affiliateUserId,
      });
      return;
    }

    // Criar transfer para o afiliado
    // MODELO CAKTO: commission_cents já está calculado sobre o valor líquido
    const transfer = await stripe.transfers.create({
      amount: order.commission_cents,
      currency: "brl",
      destination: affiliateStripeAccountId,
      transfer_group: orderId,
      metadata: {
        order_id: orderId,
        affiliate_id: order.affiliate_id,
        type: "affiliate_commission",
        modelo: "cakto_proporcional",
        nota: "Comissão calculada sobre valor líquido (após taxa plataforma)"
      },
    });

    log.info("MODELO CAKTO - Affiliate commission transferred", {
      affiliate_id: order.affiliate_id,
      commission_cents: order.commission_cents,
      transfer_id: transfer.id,
      destination: affiliateStripeAccountId,
      nota: "Comissão sobre valor líquido"
    });
  } catch (transferError) {
    // Não falhar o pagamento se a transferência falhar
    log.error("Error transferring affiliate commission", { 
      error: transferError instanceof Error ? transferError.message : String(transferError),
      affiliate_id: order.affiliate_id,
    });
  }
}

/**
 * Dispara webhook de evento
 */
export async function triggerWebhook(
  eventType: string,
  orderId: string,
  log: Logger
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const internalSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');

    await fetch(`${supabaseUrl}/functions/v1/trigger-webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': internalSecret || ''
      },
      body: JSON.stringify({
        order_id: orderId,
        event_type: eventType
      })
    });
    
    log.info(`Webhook ${eventType} disparado`, { order_id: orderId });
  } catch (webhookError) {
    log.warn(`Erro ao disparar ${eventType} (não crítico)`, { error: webhookError });
  }
}

/**
 * Processa pagamento PIX (confirma e extrai QR Code)
 */
export async function processPixPayment(
  stripe: Stripe,
  supabase: SupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
  order: OrderData,
  orderId: string,
  log: Logger
): Promise<Record<string, unknown>> {
  // Confirmar para gerar QR Code
  const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
    payment_method_data: {
      type: "pix",
      billing_details: {
        email: order.customer_email || undefined,
        name: order.customer_name || undefined,
      },
    },
  });

  log.info("PIX Payment Intent confirmed", { 
    status: confirmedIntent.status,
    hasNextAction: !!confirmedIntent.next_action 
  });

  const pixAction = confirmedIntent.next_action?.pix_display_qr_code;

  if (!pixAction) {
    return {
      status: confirmedIntent.status,
    };
  }

  // Atualizar pedido com dados do PIX
  await supabase
    .from("orders")
    .update({
      pix_qr_code: pixAction.data,
      pix_created_at: new Date().toISOString(),
      pix_status: "pending",
    })
    .eq("id", orderId);

  // Disparar webhook pix_generated
  await triggerWebhook('pix_generated', orderId, log);

  return {
    status: confirmedIntent.status,
    qr_code: pixAction.image_url_png,
    qr_code_text: pixAction.data,
    expires_at: pixAction.expires_at,
    hosted_instructions_url: pixAction.hosted_instructions_url,
  };
}

// ============================================================================
// UTMIFY PIX_GENERATED EVENT (RISE V3 - Backend SSOT)
// ============================================================================

/**
 * Dispara evento pix_generated para UTMify após criação do PIX Stripe
 */
export async function dispatchStripePixGeneratedUTMify(
  supabase: SupabaseClient,
  orderId: string,
  log: Logger
): Promise<void> {
  try {
    log.info(`Disparando UTMify pix_generated para order ${orderId}`);
    
    const result = await dispatchUTMifyEventForOrder(supabase, orderId, "pix_generated");
    
    if (result.success && !result.skipped) {
      log.info(`✅ UTMify pix_generated disparado com sucesso`);
    } else if (result.skipped) {
      log.info(`UTMify pulado: ${result.reason}`);
    } else {
      log.warn(`Erro ao disparar UTMify: ${result.error}`);
    }
  } catch (error) {
    log.warn("Exceção ao disparar UTMify pix_generated (não crítico):", error);
  }
}
