/**
 * Create Order Actor
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Handles order creation via Edge Function.
 * Pure async actor with no side effects.
 * 
 * @module checkout-public/machines/actors
 */

import { fromPromise } from "xstate";
import { publicApi } from "@/lib/api/public-client";
import { getAffiliateCode } from "@/hooks/checkout/helpers";
import { createLogger } from "@/lib/logger";
import { extractUTMParameters } from "@/integrations/tracking/utmify/utils";
import { captureFacebookBrowserIdentity } from "@/lib/tracking/facebook-cookies";

const log = createLogger("CreateOrderActor");

// ============================================================================
// TYPES
// ============================================================================

export interface CreateOrderInput {
  productId: string;
  checkoutId: string;
  offerId: string | null;
  formData: {
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
  };
  selectedBumps: string[];
  couponId: string | null;
  gateway: string;
  paymentMethod: 'pix' | 'credit_card';
  // RISE V3: Idempotency key per checkout submission attempt
  idempotencyKey: string | null;
}

export interface CreateOrderOutput {
  success: boolean;
  orderId: string;
  accessToken: string;
  error?: string;
}

// ============================================================================
// ACTOR
// ============================================================================

export const createOrderActor = fromPromise<CreateOrderOutput, CreateOrderInput>(
  async ({ input }) => {
    log.info("Creating order", { 
      productId: input.productId,
      paymentMethod: input.paymentMethod,
      gateway: input.gateway,
    });

    // RISE V3: Extract UTM parameters for tracking persistence
    const utmParams = extractUTMParameters();

    // ULTRA TRACKING: Capture Facebook browser identity (cookies + metadata)
    const fbIdentity = captureFacebookBrowserIdentity();

    const payload = {
      product_id: input.productId,
      offer_id: input.offerId || input.productId,
      checkout_id: input.checkoutId,
      customer_name: input.formData.name,
      customer_email: input.formData.email,
      customer_phone: input.formData.phone || null,
      customer_cpf: input.formData.cpf?.replace(/\D/g, '') || null,
      order_bump_ids: input.selectedBumps,
      gateway: input.gateway.toUpperCase(),
      // RISE V3: UTM tracking parameters for UTMify backend SSOT
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      utm_content: utmParams.utm_content,
      utm_term: utmParams.utm_term,
      src: utmParams.src,
      sck: utmParams.sck,
      payment_method: input.paymentMethod,
      coupon_id: input.couponId,
      affiliate_code: getAffiliateCode(),
      // RISE V3: Idempotency key per checkout submission attempt
      idempotency_key: input.idempotencyKey,
      // ULTRA TRACKING: Facebook browser identity for CAPI EMQ 8.0+
      fbp: fbIdentity.fbp,
      fbc: fbIdentity.fbc,
      customer_user_agent: fbIdentity.userAgent,
      event_source_url: fbIdentity.eventSourceUrl,
    };

    const { data, error } = await publicApi.call<{
      success: boolean;
      order_id?: string;
      access_token?: string;
      error?: string;
    }>("create-order", payload);

    if (error) {
      log.error("API error creating order", { error: error?.message ?? "Unknown error" });
      return {
        success: false,
        orderId: '',
        accessToken: '',
        error: error?.message ?? "Erro de rede ao criar pedido",
      };
    }

    if (!data?.success || !data?.order_id) {
      log.error("Order creation failed", { error: data?.error });
      return {
        success: false,
        orderId: '',
        accessToken: '',
        error: data?.error || "Erro ao criar pedido",
      };
    }

    log.info("Order created successfully", { orderId: data.order_id });

    return {
      success: true,
      orderId: data.order_id,
      accessToken: data.access_token || '',
    };
  }
);
