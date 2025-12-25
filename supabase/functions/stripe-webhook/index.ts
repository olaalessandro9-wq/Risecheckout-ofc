/**
 * Stripe Webhook Edge Function
 * 
 * Processa eventos do Stripe:
 * - payment_intent.succeeded → Atualiza pedido para PAID
 * - payment_intent.payment_failed → Marca como falho
 * - charge.refunded → Processa reembolso
 * - charge.dispute.created → Alerta de disputa
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendEmail } from '../_shared/zeptomail.ts';
import { getPurchaseConfirmationTemplate, getPurchaseConfirmationTextTemplate, type PurchaseConfirmationData } from '../_shared/email-templates.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Verificar assinatura do webhook (se configurado)
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err });
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      // 🔒 SEGURANÇA P0: Bloquear webhooks sem assinatura em produção
      logStep("SECURITY ERROR: STRIPE_WEBHOOK_SECRET not configured - rejecting webhook");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured. Configure STRIPE_WEBHOOK_SECRET for security." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Processing event", { type: event.type, id: event.id });

    // ========================================
    // PAYMENT_INTENT.SUCCEEDED
    // ========================================
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.order_id;

      logStep("Payment succeeded", { paymentIntentId: paymentIntent.id, orderId });

      if (!orderId) {
        logStep("No order_id in metadata, skipping");
        return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
      }

      // Buscar dados do pedido antes de atualizar
      const { data: order } = await supabaseClient
        .from("orders")
        .select("customer_email, customer_name, product_name, amount_cents")
        .eq("id", orderId)
        .single();

      // Atualizar pedido para PAID
      const { error: updateError } = await supabaseClient
        .from("orders")
        .update({
          status: "PAID",
          paid_at: new Date().toISOString(),
          gateway_payment_id: paymentIntent.id,
          pix_status: paymentIntent.payment_method_types?.includes("pix") ? "paid" : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        logStep("Error updating order", { error: updateError });
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      logStep("Order updated to PAID", { orderId });

      // Enviar email de confirmação
      if (order?.customer_email) {
        try {
          const emailData: PurchaseConfirmationData = {
            customerName: order.customer_name || 'Cliente',
            productName: order.product_name || 'Produto',
            amountCents: order.amount_cents,
            orderId: orderId,
            paymentMethod: 'Cartão de Crédito / Stripe',
          };

          const emailResult = await sendEmail({
            to: { email: order.customer_email, name: order.customer_name || undefined },
            subject: `✅ Compra Confirmada - ${order.product_name || 'Seu Pedido'}`,
            htmlBody: getPurchaseConfirmationTemplate(emailData),
            textBody: getPurchaseConfirmationTextTemplate(emailData),
            type: 'transactional',
            clientReference: `order_${orderId}_confirmation`,
          });

          if (emailResult.success) {
            logStep("Confirmation email sent", { messageId: emailResult.messageId });
          } else {
            logStep("Email send failed (non-critical)", { error: emailResult.error });
          }
        } catch (emailError) {
          logStep("Email exception (non-critical)", { error: emailError });
        }
      }

      // Disparar webhooks do vendedor
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        await fetch(`${supabaseUrl}/functions/v1/trigger-webhooks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            event_type: "purchase_approved",
          }),
        });
        logStep("Vendor webhooks triggered");
      } catch (webhookError) {
        logStep("Error triggering vendor webhooks", { error: webhookError });
      }
    }

    // ========================================
    // PAYMENT_INTENT.PAYMENT_FAILED
    // ========================================
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.order_id;

      logStep("Payment failed", { 
        paymentIntentId: paymentIntent.id, 
        orderId,
        error: paymentIntent.last_payment_error?.message 
      });

      if (orderId) {
        await supabaseClient
          .from("orders")
          .update({
            status: "FAILED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        logStep("Order updated to FAILED", { orderId });
      }
    }

    // ========================================
    // CHARGE.REFUNDED
    // ========================================
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      logStep("Charge refunded", { chargeId: charge.id, paymentIntentId });

      // Buscar pedido pelo payment_intent_id
      const { data: order } = await supabaseClient
        .from("orders")
        .select("id")
        .eq("gateway_payment_id", paymentIntentId)
        .maybeSingle();

      if (order) {
        const refundAmount = charge.amount_refunded;
        const isFullRefund = refundAmount === charge.amount;

        await supabaseClient
          .from("orders")
          .update({
            status: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        logStep("Order updated for refund", { 
          orderId: order.id, 
          refundAmount,
          isFullRefund 
        });

        // Disparar webhook de reembolso
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL");
          await fetch(`${supabaseUrl}/functions/v1/trigger-webhooks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: order.id,
              event_type: "purchase_refunded",
            }),
          });
        } catch {
          logStep("Error triggering refund webhook");
        }
      }
    }

    // ========================================
    // CHARGE.DISPUTE.CREATED
    // ========================================
    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId = dispute.charge as string;

      logStep("Dispute created", { disputeId: dispute.id, chargeId, reason: dispute.reason });

      // Buscar charge para obter payment_intent
      const charge = await stripe.charges.retrieve(chargeId);
      const paymentIntentId = charge.payment_intent as string;

      // Buscar pedido
      const { data: order } = await supabaseClient
        .from("orders")
        .select("id, vendor_id")
        .eq("gateway_payment_id", paymentIntentId)
        .maybeSingle();

      if (order) {
        // Registrar evento de disputa
        await supabaseClient.from("order_events").insert({
          order_id: order.id,
          vendor_id: order.vendor_id,
          type: "dispute_created",
          data: {
            dispute_id: dispute.id,
            reason: dispute.reason,
            amount: dispute.amount,
            currency: dispute.currency,
          },
          occurred_at: new Date().toISOString(),
        });

        logStep("Dispute event recorded", { orderId: order.id });
      }
    }

    // ========================================
    // ACCOUNT.UPDATED (Stripe Connect)
    // ========================================
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      logStep("Account updated", { 
        accountId: account.id, 
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled 
      });

      // Atualizar status da integração se necessário
      if (!account.charges_enabled) {
        await supabaseClient
          .from("vendor_integrations")
          .update({
            config: supabaseClient.rpc("jsonb_set", {
              target: "config",
              path: ["charges_enabled"],
              value: false,
            }),
          })
          .eq("integration_type", "STRIPE")
          .contains("config", { stripe_account_id: account.id });
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
