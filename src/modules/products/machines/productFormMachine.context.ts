/**
 * ProductFormMachine Initial Context
 * 
 * Define o contexto inicial da State Machine.
 * Extraído para manter o arquivo principal abaixo de 300 linhas.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 * @module products/machines
 */

import type { ProductFormContext } from "./productFormMachine.types";

// ============================================================================
// INITIAL CONTEXT
// ============================================================================

export const initialContext: ProductFormContext = {
  serverData: {
    product: null,
    general: {
      name: "",
      description: "",
      price: 0,
      support_name: "",
      support_email: "",
      delivery_url: "",
      external_delivery: false,
      delivery_type: "standard",
    },
    upsell: {
      hasCustomThankYouPage: false,
      customPageUrl: "",
      redirectIgnoringOrderBumpFailures: false,
    },
    affiliateSettings: null,
    offers: [],
    checkoutSettings: {
      required_fields: { name: true, email: true, phone: true, cpf: false },
      default_payment_method: "credit_card",
      pix_gateway: "",
      credit_card_gateway: "",
    },
  },
  editedData: {
    general: {
      name: "",
      description: "",
      price: 0,
      support_name: "",
      support_email: "",
      delivery_url: "",
      external_delivery: false,
      delivery_type: "standard",
    },
    image: { imageFile: null, imageUrl: "", pendingRemoval: false },
    offers: { localOffers: [], deletedOfferIds: [], modified: false },
    upsell: { hasCustomThankYouPage: false, customPageUrl: "", redirectIgnoringOrderBumpFailures: false },
    affiliate: null,
    checkoutSettings: {
      required_fields: { name: true, email: true, phone: true, cpf: false },
      default_payment_method: "credit_card",
      pix_gateway: "",
      credit_card_gateway: "",
    },
  },
  entities: { orderBumps: [], checkouts: [], paymentLinks: [], coupons: [] },
  credentials: {},
  productId: null,
  userId: undefined,
  validationErrors: { general: {}, upsell: {}, affiliate: {}, checkoutSettings: {} },
  saveError: null,
  loadError: null,
  lastLoadedAt: null,
  lastSavedAt: null,
  activeTab: "geral",
  tabErrors: {},
  isCheckoutSettingsInitialized: false,
  pendingImageUrl: null,
};
