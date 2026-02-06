/**
 * stripe-create-payment/index.ts - Orquestrador Principal
 * 
 * @version 3.0.1 - RISE Protocol V3 Compliant
 * - Uses handleCorsV2 from _shared/cors-v2.ts
 * - Uses PUBLIC_CORS_HEADERS for checkout (public endpoint)
 * 
 * Estrutura:
 * - handlers/order-loader.ts (~100 linhas) - Carrega e valida pedido
 * - handlers/intent-builder.ts (~115 linhas) - Monta PaymentIntent params
 * - handlers/post-payment.ts (~150 linhas) - Comissão afiliado, webhooks, PIX
 * - index.ts (~150 linhas) ← VOCÊ ESTÁ AQUI
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2, PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { rateLimitOnlyMiddleware, getIdentifier, RATE_LIMIT_CONFIGS } from "../_shared/rate-limiting/index.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { loadOrder, getVendorStripeConfig } from "./handlers/order-loader.ts";
import { buildPaymentIntentParams } from "./handlers/intent-builder.ts";
import { processAffiliateCommission, triggerWebhook, processPixPayment } from "./handlers/post-payment.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("stripe-create-payment");

interface CreatePaymentRequest {
  order_id: string;
  payment_method: "credit_card" | "pix";
  payment_method_id?: string;
  return_url?: string;
}

serve(withSentry('stripe-create-payment', async (req) => {
  // Use handleCorsV2 for origin validation, fallback to PUBLIC_CORS_HEADERS for checkout
  const corsResult = handleCorsV2(req);
  
  // For checkout endpoints, we allow the request but use validated headers if available
  let corsHeaders: Record<string, string>;
  if (corsResult instanceof Response) {
    // If preflight, return it
    if (req.method === "OPTIONS") {
      return corsResult;
    }
    // For non-preflight blocked origins, use PUBLIC for checkout (anonymous clients)
    corsHeaders = PUBLIC_CORS_HEADERS;
  } else {
    corsHeaders = corsResult.headers;
  }

  // Handle OPTIONS separately
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient('payments');

  // 1. Rate Limiting (RISE V3 - Config específica por gateway)
  const rateLimitResponse = await rateLimitOnlyMiddleware(
    supabase,
    req,
    RATE_LIMIT_CONFIGS.STRIPE_CREATE_PAYMENT,
    corsHeaders
  );

  if (rateLimitResponse) {
    log.warn("Rate limit exceeded", { identifier: getIdentifier(req) });
    return rateLimitResponse;
  }

  let rawBody = "";

  try {
    rawBody = await req.text();
    const body: CreatePaymentRequest = JSON.parse(rawBody);
    const { order_id, payment_method, payment_method_id, return_url } = body;

    log.info("Request received", { order_id, payment_method });

    if (!order_id) {
      throw new Error("order_id is required");
    }

    // 2. CARREGAR PEDIDO
    const orderResult = await loadOrder(supabase, order_id, log);
    if (!orderResult.success) {
      throw new Error(orderResult.error);
    }
    const { order } = orderResult;

    // 3. BUSCAR CONFIG STRIPE DO VENDEDOR
    const connectedAccountId = await getVendorStripeConfig(supabase, order.vendor_id, log);

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // 4. MONTAR PAYMENT INTENT
    const intentParams = await buildPaymentIntentParams(supabase, {
      order,
      paymentMethod: payment_method,
      paymentMethodId: payment_method_id,
      returnUrl: return_url,
      connectedAccountId,
    }, log);

    // 5. CRIAR PAYMENT INTENT
    const paymentIntent = await stripe.paymentIntents.create(intentParams);
    log.info("Payment Intent created", { id: paymentIntent.id, status: paymentIntent.status });

    // 6. PREPARAR CAMPOS PARA ATUALIZAÇÃO - Normalizar para lowercase
    const updateFields: Record<string, unknown> = {
      gateway_payment_id: paymentIntent.id,
      gateway: "stripe",
      payment_method: payment_method.toLowerCase(),
      updated_at: new Date().toISOString(),
    };

    // 7. SE APROVADO IMEDIATAMENTE - status em lowercase
    if (paymentIntent.status === "succeeded") {
      updateFields.status = "paid";
      updateFields.paid_at = new Date().toISOString();
      log.info("Payment succeeded immediately - updating order to paid");

      // Transferir comissão do afiliado
      await processAffiliateCommission(stripe, supabase, order, order_id, log);
      
      // Disparar webhook purchase_approved
      await triggerWebhook('purchase_approved', order_id, log);
    }

    // 8. ATUALIZAR PEDIDO
    await supabase.from("orders").update(updateFields).eq("id", order_id);

    // 9. PREPARAR RESPOSTA
    let responseData: Record<string, unknown> = {
      success: true,
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      status: paymentIntent.status,
    };

    // 10. PROCESSAR PIX (confirmar e extrair QR Code)
    if (payment_method === "pix") {
      const pixData = await processPixPayment(stripe, supabase, paymentIntent, order, order_id, log);
      responseData = { ...responseData, ...pixData };
    }

    log.info("Payment created successfully", { order_id, payment_method });

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Payment creation failed", { message: errorMessage });

    await captureException(error instanceof Error ? error : new Error(String(error)), {
      functionName: 'stripe-create-payment',
      url: req.url,
      method: req.method,
      extra: { rawBody: rawBody || null },
    });

    await supabase.from("edge_function_errors").insert({
      function_name: "stripe-create-payment",
      error_message: errorMessage,
      request_payload: rawBody || null,
    });

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
}));
