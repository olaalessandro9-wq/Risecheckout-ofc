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
import { api } from "@/lib/api";
import { getAffiliateCode } from "@/hooks/checkout/helpers";
import { createLogger } from "@/lib/logger";

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
      payment_method: input.paymentMethod,
      coupon_id: input.couponId,
      affiliate_code: getAffiliateCode(),
    };

    const { data, error } = await api.publicCall<{
      success: boolean;
      order_id?: string;
      access_token?: string;
      error?: string;
    }>("create-order", payload);

    if (error) {
      log.error("API error creating order", { error: error.message });
      return {
        success: false,
        orderId: '',
        accessToken: '',
        error: error.message || "Erro de rede ao criar pedido",
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
