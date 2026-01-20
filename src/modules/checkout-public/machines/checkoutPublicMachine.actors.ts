/**
 * Checkout Public Machine Actors
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Async actors for the XState state machine.
 * 
 * @module checkout-public/machines
 */

import { fromPromise } from "xstate";
import { api } from "@/lib/api";
import type {
  FetchCheckoutInput,
  FetchCheckoutOutput,
  SubmitPaymentInput,
  SubmitPaymentOutput,
} from "./checkoutPublicMachine.types";

// ============================================================================
// FETCH CHECKOUT ACTOR
// ============================================================================

/**
 * Fetches checkout data from the BFF (checkout-public-data)
 * 
 * This actor:
 * 1. Calls the resolve-and-load action
 * 2. Returns raw data for validation by the machine
 * 3. Throws on network/API errors
 */
export const fetchCheckoutDataActor = fromPromise<FetchCheckoutOutput, FetchCheckoutInput>(
  async ({ input }) => {
    const { slug, affiliateCode } = input;

    if (!slug) {
      return {
        success: false,
        error: "Slug is required",
      };
    }

    const { data, error } = await api.publicCall<{
      success: boolean;
      data?: unknown;
      error?: string;
    }>("checkout-public-data", {
      action: "resolve-and-load",
      slug,
      affiliateCode,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Network error",
      };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || "Checkout não encontrado",
      };
    }

    return {
      success: true,
      data: data,
    };
  }
);

// ============================================================================
// SUBMIT PAYMENT ACTOR
// ============================================================================

/**
 * Submits payment to the backend
 * 
 * This actor handles both PIX and Credit Card payments.
 * The actual implementation will call the appropriate edge functions.
 */
export const submitPaymentActor = fromPromise<SubmitPaymentOutput, SubmitPaymentInput>(
  async ({ input }) => {
    const {
      formData,
      productId,
      offerId,
      selectedBumps,
      paymentMethod,
      coupon,
      resolvedGateways,
      cardToken,
      installments,
      paymentMethodId,
      issuerId,
      holderDocument,
    } = input;

    // Determine which endpoint to call based on payment method
    const endpoint = paymentMethod === 'pix' ? 'pix-create-payment' : 'card-create-payment';

    const payload = {
      productId,
      offerId,
      orderBumps: selectedBumps,
      couponId: coupon?.id,
      payerName: formData.name,
      payerEmail: formData.email,
      payerPhone: formData.phone || undefined,
      payerCpf: formData.cpf || undefined,
      gateway: paymentMethod === 'pix' ? resolvedGateways.pix : resolvedGateways.creditCard,
      // Card-specific fields
      ...(paymentMethod === 'credit_card' && {
        token: cardToken,
        installments,
        paymentMethodId,
        issuerId,
        holderDocument,
      }),
    };

    const { data, error } = await api.publicCall<{
      success: boolean;
      orderId?: string;
      qrCode?: string;
      qrCodeBase64?: string;
      expiresAt?: string;
      status?: string;
      error?: string;
    }>(endpoint, payload);

    if (error || !data?.success) {
      throw new Error(data?.error || error?.message || "Erro ao processar pagamento");
    }

    // Build payment data based on method
    if (paymentMethod === 'pix') {
      return {
        orderId: data.orderId!,
        paymentData: {
          type: 'pix' as const,
          qrCode: data.qrCode!,
          qrCodeBase64: data.qrCodeBase64!,
          expiresAt: data.expiresAt!,
        },
      };
    } else {
      return {
        orderId: data.orderId!,
        paymentData: {
          type: 'card' as const,
          status: (data.status as 'approved' | 'pending' | 'rejected') || 'pending',
        },
      };
    }
  }
);
