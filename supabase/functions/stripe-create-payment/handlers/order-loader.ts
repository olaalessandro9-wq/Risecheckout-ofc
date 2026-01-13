/**
 * order-loader.ts - Carrega e valida pedido para pagamento Stripe
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface OrderData {
  id: string;
  vendor_id: string;
  amount_cents: number;
  status: string;
  customer_email: string | null;
  customer_name: string | null;
  product_name: string | null;
  affiliate_id: string | null;
  commission_cents: number | null;
  platform_fee_cents: number | null;
  affiliates: {
    id: string;
    user_id: string;
    commission_rate: number;
  } | null;
  products: {
    user_id: string;
    name: string;
  } | null;
}

export interface LoadOrderResult {
  success: true;
  order: OrderData;
}

export interface LoadOrderError {
  success: false;
  error: string;
}

/**
 * Carrega pedido com dados do afiliado e produto
 */
export async function loadOrder(
  supabase: SupabaseClient,
  orderId: string,
  logStep: (step: string, details?: unknown) => void
): Promise<LoadOrderResult | LoadOrderError> {
  logStep("Loading order", { order_id: orderId });

  const { data: order, error: orderError } = await supabase
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
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    logStep("Order not found", { order_id: orderId, error: orderError });
    return { success: false, error: "Order not found" };
  }

  logStep("Order found", { 
    amount: order.amount_cents, 
    vendor_id: order.vendor_id,
    status: order.status,
    has_affiliate: !!order.affiliate_id
  });

  // Verificar se pedido já foi pago
  if (order.status === "PAID") {
    return { success: false, error: "Order already paid" };
  }

  return { success: true, order: order as OrderData };
}

/**
 * Busca integração Stripe do vendedor
 */
export async function getVendorStripeConfig(
  supabase: SupabaseClient,
  vendorId: string,
  logStep: (step: string, details?: unknown) => void
): Promise<string | undefined> {
  const { data: stripeIntegration } = await supabase
    .from("vendor_integrations")
    .select("config, active")
    .eq("vendor_id", vendorId)
    .eq("integration_type", "STRIPE")
    .maybeSingle();

  if (stripeIntegration?.active && stripeIntegration?.config?.stripe_account_id) {
    const connectedAccountId = stripeIntegration.config.stripe_account_id;
    logStep("Using Stripe Connect", { connectedAccountId });
    return connectedAccountId;
  }

  logStep("Using platform Stripe account");
  return undefined;
}
