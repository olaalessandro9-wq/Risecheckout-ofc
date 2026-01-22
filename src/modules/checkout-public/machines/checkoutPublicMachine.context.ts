/**
 * Initial Context for Checkout Public Machine
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Extracted to maintain the 300-line limit in the main machine file.
 * 
 * @module checkout-public/machines
 */

import type { CheckoutPublicContext } from "./checkoutPublicMachine.types";

/**
 * Initial context state for the checkout public machine.
 * All values are set to their neutral/empty state.
 */
export const initialCheckoutContext: CheckoutPublicContext = {
  // === Slug and Raw Data ===
  slug: null,
  affiliateCode: null,
  rawData: null,
  
  // === Loaded Data (immutable after load) ===
  checkout: null,
  product: null,
  offer: null,
  orderBumps: [],
  affiliate: null,
  design: null,
  resolvedGateways: {
    pix: 'mercadopago',
    creditCard: 'mercadopago',
    mercadoPagoPublicKey: null,
    stripePublicKey: null,
  },
  
  // === Form State ===
  formData: { 
    name: '', 
    email: '', 
    phone: '', 
    cpf: '', 
    document: '' 
  },
  formErrors: {},
  selectedBumps: [],
  appliedCoupon: null,
  selectedPaymentMethod: 'pix',
  
  // === Payment State ===
  orderId: null,
  accessToken: null,
  paymentData: null,
  navigationData: null,
  
  // === Card Form Data ===
  cardFormData: null,
  
  // === Error State ===
  error: null,
  
  // === Metadata ===
  loadedAt: null,
  retryCount: 0,
};
