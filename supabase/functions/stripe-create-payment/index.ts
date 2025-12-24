/**
 * Stripe Create Payment Edge Function
 * 
 * Cria Payment Intents para cartão de crédito e PIX via Stripe.
 * Suporta split de pagamentos via Stripe Connect.
 * 
 * ATUALIZADO: Taxa da plataforma = 4% (centralizada em platform-config.ts)
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { 
  PLATFORM_FEE_PERCENT, 
  calculatePlatformFeeCents,
  getVendorFeePercent,
  isVendorOwner
} from "../_shared/platform-config.ts";
import { rateLimitMiddleware, getIdentifier } from "../_shared/rate-limit.ts";

// Lista de origens permitidas (CORS restritivo)
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://risecheckout.com",
  "https://www.risecheckout.com",
  "https://risecheckout-84776.lovable.app",
  "https://prime-checkout-hub.lovable.app"
];

const getCorsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
});

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-CREATE-PAYMENT] ${step}${detailsStr}`);
};

interface CreatePaymentRequest {
  order_id: string;
  payment_method: "credit_card" | "pix";
  payment_method_id?: string; // Para cartão, ID do payment method criado no frontend
  return_url?: string;
}

serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting (P0 - proteção contra abuso)
  const rateLimitResponse = await rateLimitMiddleware(req, {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minuto
    identifier: getIdentifier(req, false),
    action: "stripe_create_payment",
  });

  if (rateLimitResponse) {
    logStep("Rate limit exceeded", { identifier: getIdentifier(req, false) });
    return rateLimitResponse;
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Capturar raw body no início para usar em caso de erro
  let rawBody = "";
  
  try {
    rawBody = await req.text();
    const body: CreatePaymentRequest = JSON.parse(rawBody);
    const { order_id, payment_method, payment_method_id, return_url } = body;

    logStep("Request received", { order_id, payment_method });

    if (!order_id) {
      throw new Error("order_id is required");
    }

    // Buscar pedido com dados do afiliado
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select(`
        *,
        products (user_id, name),
        affiliates (
          id,
          user_id,
          commission_rate
        )
      `)
      .eq("id", order_id)
      .maybeSingle();

    if (orderError || !order) {
      logStep("Order not found", { order_id, error: orderError });
      throw new Error("Order not found");
    }

    logStep("Order found", { 
      amount: order.amount_cents, 
      vendor_id: order.vendor_id,
      status: order.status,
      has_affiliate: !!order.affiliate_id
    });

    // Verificar se pedido já foi pago
    if (order.status === "PAID") {
      throw new Error("Order already paid");
    }

    const vendorId = order.vendor_id;

    // Buscar integração Stripe do vendedor
    const { data: stripeIntegration } = await supabaseClient
      .from("vendor_integrations")
      .select("config, active")
      .eq("vendor_id", vendorId)
      .eq("integration_type", "STRIPE")
      .maybeSingle();

    // Decidir qual chave usar
    let stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    let connectedAccountId: string | undefined;

    if (stripeIntegration?.active && stripeIntegration?.config?.stripe_account_id) {
      // Vendedor tem conta Stripe Connect
      connectedAccountId = stripeIntegration.config.stripe_account_id;
      logStep("Using Stripe Connect", { connectedAccountId });
    } else {
      logStep("Using platform Stripe account");
    }

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Preparar parâmetros do Payment Intent
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: order.amount_cents,
      currency: "brl",
      metadata: {
        order_id: order.id,
        vendor_id: vendorId,
        customer_email: order.customer_email || "",
        customer_name: order.customer_name || "",
        product_name: order.product_name || "",
      },
      description: `Pedido ${order.id} - ${order.product_name || "Produto"}`,
    };

    // Configurar método de pagamento
    if (payment_method === "pix") {
      paymentIntentParams.payment_method_types = ["pix"];
      paymentIntentParams.payment_method_options = {
        pix: {
          expires_after_seconds: 3600, // 1 hora
        },
      };
    } else {
      paymentIntentParams.payment_method_types = ["card"];
      if (payment_method_id) {
        paymentIntentParams.payment_method = payment_method_id;
        paymentIntentParams.confirm = true;
        if (return_url) {
          paymentIntentParams.return_url = return_url;
        }
      }
    }

    // Se tem conta conectada, configurar split (MODELO CAKTO)
    // OWNER SIMPLIFICADO: Se vendedor é Owner, não cobrar application_fee
    if (connectedAccountId) {
      const isOwner = await isVendorOwner(supabaseClient, vendorId);
      
      if (isOwner) {
        logStep("🏠 OWNER detectado - Skip application_fee (100% para Owner)");
        // Não adicionar application_fee - Owner recebe 100%
        paymentIntentParams.transfer_data = {
          destination: connectedAccountId,
        };
      } else {
        // Buscar taxa personalizada do vendedor
        const vendorFeePercent = await getVendorFeePercent(supabaseClient, vendorId);
        
        // Taxa da plataforma já foi calculada no create-order
        // Usar valor salvo ou recalcular com taxa dinâmica se não existir
        const platformFee = order.platform_fee_cents || calculatePlatformFeeCents(order.amount_cents, vendorFeePercent);
        
        paymentIntentParams.application_fee_amount = platformFee;
        paymentIntentParams.transfer_data = {
          destination: connectedAccountId,
        };

        logStep("MODELO CAKTO - Split configured", { 
          vendorFeePercent: `${vendorFeePercent * 100}%`,
          isCustomFee: vendorFeePercent !== PLATFORM_FEE_PERCENT,
          platformFee, 
          vendorAmount: order.amount_cents - platformFee,
          nota: 'Taxa proporcional já descontada no create-order'
        });

        // Atualizar taxa da plataforma no pedido se não existia
        if (!order.platform_fee_cents) {
          await supabaseClient
            .from("orders")
            .update({ platform_fee_cents: platformFee })
            .eq("id", order_id);
        }
      }
    }

    // Criar Payment Intent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
    logStep("Payment Intent created", { 
      id: paymentIntent.id, 
      status: paymentIntent.status 
    });

    // Preparar campos para atualização
    const updateFields: Record<string, unknown> = {
      gateway_payment_id: paymentIntent.id,
      gateway: "stripe",
      payment_method: payment_method,
      updated_at: new Date().toISOString(),
    };

    // SE O PAGAMENTO FOI APROVADO IMEDIATAMENTE, ATUALIZAR STATUS E PROCESSAR COMISSÃO
    if (paymentIntent.status === "succeeded") {
      updateFields.status = "PAID";
      updateFields.paid_at = new Date().toISOString();
      logStep("Payment succeeded immediately - updating order to PAID");

      // SPLIT DE AFILIADO (MODELO CAKTO): Transferir comissão já calculada sobre o líquido
      if (order.affiliate_id && order.commission_cents && order.commission_cents > 0) {
        try {
          // Buscar stripe_account_id do afiliado
          const affiliateUserId = order.affiliates?.user_id;
          
          if (affiliateUserId) {
            const { data: affiliateProfile } = await supabaseClient
              .from("profiles")
              .select("stripe_account_id")
              .eq("id", affiliateUserId)
              .maybeSingle();

            const affiliateStripeAccountId = affiliateProfile?.stripe_account_id;

            if (affiliateStripeAccountId) {
              // Criar transfer para o afiliado
              // MODELO CAKTO: commission_cents já está calculado sobre o valor líquido
              const transfer = await stripe.transfers.create({
                amount: order.commission_cents,
                currency: "brl",
                destination: affiliateStripeAccountId,
                transfer_group: order_id,
                metadata: {
                  order_id: order_id,
                  affiliate_id: order.affiliate_id,
                  type: "affiliate_commission",
                  modelo: "cakto_proporcional",
                  nota: "Comissão calculada sobre valor líquido (após taxa plataforma)"
                },
              });

              logStep("MODELO CAKTO - Affiliate commission transferred", {
                affiliate_id: order.affiliate_id,
                commission_cents: order.commission_cents,
                transfer_id: transfer.id,
                destination: affiliateStripeAccountId,
                nota: "Comissão sobre valor líquido"
              });
            } else {
              logStep("Affiliate has no Stripe account connected - skipping transfer", {
                affiliate_id: order.affiliate_id,
                affiliate_user_id: affiliateUserId,
              });
            }
          }
        } catch (transferError) {
          // Não falhar o pagamento se a transferência falhar
          logStep("ERROR transferring affiliate commission", { 
            error: transferError instanceof Error ? transferError.message : String(transferError),
            affiliate_id: order.affiliate_id,
          });
        }
      }
    }

    // Atualizar pedido
    await supabaseClient
      .from("orders")
      .update(updateFields)
      .eq("id", order_id);

    // Preparar resposta baseada no método de pagamento
    let responseData: Record<string, unknown> = {
      success: true,
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      status: paymentIntent.status,
    };

    // Para PIX, confirmar e extrair QR Code
    if (payment_method === "pix") {
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

      logStep("PIX Payment Intent confirmed", { 
        status: confirmedIntent.status,
        hasNextAction: !!confirmedIntent.next_action 
      });

      const pixAction = confirmedIntent.next_action?.pix_display_qr_code;

      if (pixAction) {
        responseData = {
          ...responseData,
          status: confirmedIntent.status,
          qr_code: pixAction.image_url_png,
          qr_code_text: pixAction.data,
          expires_at: pixAction.expires_at,
          hosted_instructions_url: pixAction.hosted_instructions_url,
        };

        // Atualizar pedido com dados do PIX
        await supabaseClient
          .from("orders")
          .update({
            pix_qr_code: pixAction.data,
            pix_created_at: new Date().toISOString(),
            pix_status: "pending",
          })
          .eq("id", order_id);
      }
    }

    logStep("Payment created successfully", { order_id, payment_method });

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    // Log erro no banco
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseClient.from("edge_function_errors").insert({
      function_name: "stripe-create-payment",
      error_message: errorMessage,
      request_payload: rawBody || null,
    });

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
