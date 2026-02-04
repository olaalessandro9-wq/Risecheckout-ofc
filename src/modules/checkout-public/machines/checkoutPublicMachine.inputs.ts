/**
 * Checkout Public Machine - Actor Input Factories
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Extracted input factory functions to maintain 300-line limit compliance.
 * These functions create the input objects for XState actors.
 * 
 * @module checkout-public/machines
 */

import type { CheckoutPublicContext } from "./checkoutPublicMachine.types";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculates total amount from context (product price + order bumps - coupon)
 */
export function calculateTotalFromContext(context: CheckoutPublicContext): number {
  const basePrice = context.offer?.offerPrice ?? context.product?.price ?? 0;
  
  const bumpsTotal = context.selectedBumps.reduce((sum, bumpId) => {
    const bump = context.orderBumps.find(b => b.id === bumpId);
    return sum + (bump?.price ?? 0);
  }, 0);
  
  let total = basePrice + bumpsTotal;
  
  // Apply coupon discount (RISE V3: apenas porcentagem suportado)
  if (context.appliedCoupon) {
    total = total * (1 - context.appliedCoupon.discount_value / 100);
  }
  
  // Prices are already in cents (e.g., 4990 = R$49.90)
  return Math.round(total);
}

// ============================================================================
// ACTOR INPUT FACTORIES
// ============================================================================

/**
 * Creates input for the createOrder actor
 */
export function createOrderInput(context: CheckoutPublicContext) {
  return {
    productId: context.product!.id,
    checkoutId: context.checkout!.id,
    offerId: context.offer?.offerId || null,
    formData: {
      name: context.formData.name,
      email: context.formData.email,
      phone: context.formData.phone || undefined,
      cpf: context.formData.cpf || undefined,
    },
    selectedBumps: context.selectedBumps,
    couponId: context.appliedCoupon?.id || null,
    gateway: context.selectedPaymentMethod === 'pix' 
      ? context.resolvedGateways.pix 
      : context.resolvedGateways.creditCard,
    paymentMethod: context.selectedPaymentMethod,
    // RISE V3: Idempotency key per checkout submission attempt
    idempotencyKey: context.orderAttemptKey,
  };
}

/**
 * Creates input for the processPixPayment actor
 */
export function processPixInput(context: CheckoutPublicContext) {
  return {
    orderId: context.orderId!,
    accessToken: context.accessToken!,
    gateway: context.resolvedGateways.pix,
    amount: calculateTotalFromContext(context),
    checkoutSlug: context.slug!,
    formData: {
      name: context.formData.name,
      email: context.formData.email,
      cpf: context.formData.cpf || undefined,
      phone: context.formData.phone || undefined,
    },
  };
}

/**
 * Creates input for the processCardPayment actor
 */
export function processCardInput(context: CheckoutPublicContext) {
  return {
    orderId: context.orderId!,
    accessToken: context.accessToken!,
    gateway: context.resolvedGateways.creditCard,
    amount: calculateTotalFromContext(context),
    formData: {
      name: context.formData.name,
      email: context.formData.email,
      cpf: context.formData.cpf || undefined,
      phone: context.formData.phone || undefined,
    },
    cardToken: context.cardFormData?.token || '',
    installments: context.cardFormData?.installments || 1,
    paymentMethodId: context.cardFormData?.paymentMethodId,
    issuerId: context.cardFormData?.issuerId,
    holderDocument: context.cardFormData?.holderDocument,
  };
}
