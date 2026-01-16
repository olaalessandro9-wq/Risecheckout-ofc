/**
 * ============================================================================
 * STRIPE-WEBHOOK EDGE FUNCTION
 * ============================================================================
 * 
 * Versão: 2 (REFATORADO)
 * Última Atualização: 2026-01-11
 * Status: ✅ Refatorado para usar helpers compartilhados
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createLogger,
  CORS_HEADERS,
  ERROR_CODES
} from '../_shared/webhook-helpers.ts';
import { processPostPaymentActions } from '../_shared/webhook-post-payment.ts';

const FUNCTION_VERSION = "2";
const logger = createLogger('stripe-webhook', FUNCTION_VERSION);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Verify Signature
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logger.info("Webhook signature verified");
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        logger.error("Webhook signature verification failed", errMessage);
        return createErrorResponse(ERROR_CODES.SIGNATURE_MISMATCH, "Invalid signature", 400);
      }
    } else {
      logger.error("STRIPE_WEBHOOK_SECRET not configured - rejecting");
      return createErrorResponse(ERROR_CODES.SECRET_NOT_CONFIGURED, "Webhook secret not configured", 500);
    }

    logger.info("Processing event", { type: event.type, id: event.id });

    // PAYMENT_INTENT.SUCCEEDED
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.order_id;

      logger.info("Payment succeeded", { paymentIntentId: paymentIntent.id, orderId });

      if (!orderId) {
        logger.info("No order_id in metadata, skipping");
        return createSuccessResponse({ received: true });
      }

      const { data: order } = await supabase
        .from("orders")
        .select("customer_email, customer_name, product_name, amount_cents, product_id, offer_id, vendor_id")
        .eq("id", orderId)
        .single();

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          gateway_payment_id: paymentIntent.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        logger.error("Error updating order", updateError);
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      logger.info("Order updated to paid", { orderId });

      // Post-Payment Actions
      if (order) {
        await processPostPaymentActions(supabase, {
          orderId,
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          productId: order.product_id,
          productName: order.product_name,
          amountCents: order.amount_cents,
          offerId: order.offer_id,
          paymentMethod: 'Cartão de Crédito / Stripe',
          vendorId: order.vendor_id,
        }, 'purchase_approved', logger);
      }
    }

    // PAYMENT_INTENT.PAYMENT_FAILED
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.order_id;

      logger.info("Payment failed", { 
        paymentIntentId: paymentIntent.id, 
        orderId,
        error: paymentIntent.last_payment_error?.message 
      });

      if (orderId) {
        await supabase
          .from("orders")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", orderId);
        logger.info("Order updated to failed", { orderId });
      }
    }

    // CHARGE.REFUNDED
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      logger.info("Charge refunded", { chargeId: charge.id, paymentIntentId });

      const { data: order } = await supabase
        .from("orders")
        .select("id, vendor_id")
        .eq("gateway_payment_id", paymentIntentId)
        .maybeSingle();

      if (order) {
        const isFullRefund = charge.amount_refunded === charge.amount;

        await supabase
          .from("orders")
          .update({
            status: isFullRefund ? "refunded" : "partially_refunded",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        logger.info("Order updated for refund", { orderId: order.id, isFullRefund });

        // Trigger refund webhook
        const internalSecret = Deno.env.get("INTERNAL_WEBHOOK_SECRET");
        if (internalSecret) {
          try {
            await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/trigger-webhooks`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "X-Internal-Secret": internalSecret,
              },
              body: JSON.stringify({ order_id: order.id, event_type: "purchase_refunded" }),
            });
          } catch {
            logger.warn("Error triggering refund webhook");
          }
        }
      }
    }

    // CHARGE.DISPUTE.CREATED
    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId = dispute.charge as string;

      logger.info("Dispute created", { disputeId: dispute.id, chargeId, reason: dispute.reason });

      const charge = await stripe.charges.retrieve(chargeId);
      const paymentIntentId = charge.payment_intent as string;

      const { data: order } = await supabase
        .from("orders")
        .select("id, vendor_id")
        .eq("gateway_payment_id", paymentIntentId)
        .maybeSingle();

      if (order) {
        await supabase.from("order_events").insert({
          order_id: order.id,
          vendor_id: order.vendor_id,
          type: "dispute_created",
          data: { dispute_id: dispute.id, reason: dispute.reason, amount: dispute.amount },
          occurred_at: new Date().toISOString(),
        });
        logger.info("Dispute event recorded", { orderId: order.id });
      }
    }

    // ACCOUNT.UPDATED (Stripe Connect)
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      logger.info("Account updated", { 
        accountId: account.id, 
        chargesEnabled: account.charges_enabled 
      });

      if (!account.charges_enabled) {
        await supabase
          .from("vendor_integrations")
          .update({
            config: supabase.rpc("jsonb_set", {
              target: "config",
              path: ["charges_enabled"],
              value: false,
            }),
          })
          .eq("integration_type", "STRIPE")
          .contains("config", { stripe_account_id: account.id });
      }
    }

    return createSuccessResponse({ received: true });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("ERROR", { message: errorMessage });
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, errorMessage, 500);
  }
});
