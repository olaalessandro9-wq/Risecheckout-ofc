/**
 * intent-builder.ts - Monta parâmetros do PaymentIntent Stripe
 * @version 2.0.0 - Zero `any` compliance (RISE Protocol V2)
 */

import Stripe from "https://esm.sh/stripe@14.14.0";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  PLATFORM_FEE_PERCENT, 
  calculatePlatformFeeCents,
  getVendorFeePercent,
  isVendorOwner
} from "../../_shared/platform-config.ts";
import type { OrderData } from "./order-loader.ts";

export interface BuildIntentParams {
  order: OrderData;
  paymentMethod: "credit_card" | "pix";
  paymentMethodId?: string;
  returnUrl?: string;
  connectedAccountId?: string;
}

/**
 * Constrói os parâmetros do PaymentIntent
 */
export async function buildPaymentIntentParams(
  supabase: SupabaseClient,
  params: BuildIntentParams,
  logStep: (step: string, details?: unknown) => void
): Promise<Stripe.PaymentIntentCreateParams> {
  const { order, paymentMethod, paymentMethodId, returnUrl, connectedAccountId } = params;

  // Parâmetros base
  const intentParams: Stripe.PaymentIntentCreateParams = {
    amount: order.amount_cents,
    currency: "brl",
    metadata: {
      order_id: order.id,
      vendor_id: order.vendor_id,
      customer_email: order.customer_email || "",
      customer_name: order.customer_name || "",
      product_name: order.product_name || "",
    },
    description: `Pedido ${order.id} - ${order.product_name || "Produto"}`,
  };

  // Configurar método de pagamento
  if (paymentMethod === "pix") {
    intentParams.payment_method_types = ["pix"];
    intentParams.payment_method_options = {
      pix: {
        expires_after_seconds: 3600, // 1 hora
      },
    };
  } else {
    intentParams.payment_method_types = ["card"];
    if (paymentMethodId) {
      intentParams.payment_method = paymentMethodId;
      intentParams.confirm = true;
      if (returnUrl) {
        intentParams.return_url = returnUrl;
      }
    }
  }

  // Configurar split se tem conta conectada
  if (connectedAccountId) {
    await configureConnectSplit(
      supabase,
      order,
      connectedAccountId,
      intentParams,
      logStep
    );
  }

  return intentParams;
}

/**
 * Configura split para Stripe Connect
 */
async function configureConnectSplit(
  supabase: SupabaseClient,
  order: OrderData,
  connectedAccountId: string,
  intentParams: Stripe.PaymentIntentCreateParams,
  logStep: (step: string, details?: unknown) => void
): Promise<void> {
  const isOwner = await isVendorOwner(supabase, order.vendor_id);
  
  if (isOwner) {
    logStep("🏠 OWNER detectado - Skip application_fee (100% para Owner)");
    intentParams.transfer_data = {
      destination: connectedAccountId,
    };
    return;
  }

  // Buscar taxa personalizada do vendedor
  const vendorFeePercent = await getVendorFeePercent(supabase, order.vendor_id);
  
  // Taxa da plataforma já foi calculada no create-order
  // Usar valor salvo ou recalcular com taxa dinâmica se não existir
  const platformFee = order.platform_fee_cents || calculatePlatformFeeCents(order.amount_cents, vendorFeePercent);
  
  intentParams.application_fee_amount = platformFee;
  intentParams.transfer_data = {
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
    await supabase
      .from("orders")
      .update({ platform_fee_cents: platformFee })
      .eq("id", order.id);
  }
}
