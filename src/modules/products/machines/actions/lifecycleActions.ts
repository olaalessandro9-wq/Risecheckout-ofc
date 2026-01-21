/**
 * Lifecycle Actions
 * 
 * Actions relacionadas ao ciclo de vida: load, save, error.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 * @module products/machines/actions
 */

import { assign } from "xstate";
import type { 
  MappedProductData,
  GeneralFormData,
} from "../productFormMachine.types";

// ============================================================================
// HELPER: Derive General from Product
// ============================================================================

function deriveGeneralFromProduct(product: MappedProductData["product"] | null): GeneralFormData {
  if (!product) {
    return {
      name: "",
      description: "",
      price: 0,
      support_name: "",
      support_email: "",
      delivery_url: "",
      external_delivery: false,
    };
  }
  
  return {
    name: product.name ?? "",
    description: product.description ?? "",
    price: product.price ?? 0,
    support_name: product.support_name ?? "",
    support_email: product.support_email ?? "",
    delivery_url: product.delivery_url ?? "",
    external_delivery: product.external_delivery ?? false,
  };
}

// ============================================================================
// LOAD ACTIONS
// ============================================================================

/**
 * Inicializa o contexto com dados recebidos do servidor
 */
export const assignServerData = assign({
  serverData: ({ event }) => {
    if (event.type !== "RECEIVE_DATA") return undefined as never;
    const data = event.data as MappedProductData;
    const general = deriveGeneralFromProduct(data.product);
    
    return {
      product: data.product,
      general,
      upsell: data.upsellSettings,
      affiliateSettings: data.affiliateSettings,
      offers: data.offers,
      checkoutSettings: {
        required_fields: { name: true, email: true, phone: true, cpf: false },
        default_payment_method: "credit_card" as const,
        pix_gateway: "",
        credit_card_gateway: "",
      },
    };
  },
  editedData: ({ event }) => {
    if (event.type !== "RECEIVE_DATA") return undefined as never;
    const data = event.data as MappedProductData;
    const general = deriveGeneralFromProduct(data.product);
    
    return {
      general,
      image: {
        imageFile: null,
        imageUrl: data.product?.image_url ?? "",
        pendingRemoval: false,
      },
      offers: {
        localOffers: data.offers,
        deletedOfferIds: [],
        modified: false,
      },
      upsell: data.upsellSettings,
      affiliate: data.affiliateSettings,
      checkoutSettings: {
        required_fields: { name: true, email: true, phone: true, cpf: false },
        default_payment_method: "credit_card" as const,
        pix_gateway: "",
        credit_card_gateway: "",
      },
    };
  },
  entities: ({ event }) => {
    if (event.type !== "RECEIVE_DATA") return undefined as never;
    const data = event.data as MappedProductData;
    
    return {
      orderBumps: data.orderBumps,
      checkouts: data.checkouts,
      paymentLinks: data.paymentLinks,
      coupons: data.coupons,
    };
  },
  lastLoadedAt: () => Date.now(),
  loadError: () => null,
});

/**
 * Armazena erro de carregamento
 */
export const assignLoadError = assign({
  loadError: ({ event }) => {
    if (event.type !== "LOAD_ERROR") return null;
    return event.error;
  },
});

/**
 * Define o productId e userId no contexto
 */
export const assignProductId = assign({
  productId: ({ event }) => {
    if (event.type !== "LOAD_DATA") return null;
    return event.productId;
  },
  userId: ({ event }) => {
    if (event.type !== "LOAD_DATA") return undefined;
    return event.userId;
  },
});

// ============================================================================
// SAVE ACTIONS
// ============================================================================

/**
 * Marca como salvo com sucesso (sincroniza server com edited)
 */
export const markSaved = assign({
  serverData: ({ context }) => ({
    ...context.serverData,
    general: { ...context.editedData.general },
    upsell: { ...context.editedData.upsell },
    affiliateSettings: context.editedData.affiliate ? { ...context.editedData.affiliate } : null,
    offers: [...context.editedData.offers.localOffers],
    checkoutSettings: { ...context.editedData.checkoutSettings },
  }),
  editedData: ({ context }) => ({
    ...context.editedData,
    image: {
      ...context.editedData.image,
      imageFile: null,
      pendingRemoval: false,
    },
    offers: {
      ...context.editedData.offers,
      deletedOfferIds: [],
      modified: false,
    },
  }),
  lastSavedAt: () => Date.now(),
  saveError: () => null,
});

/**
 * Armazena erro de salvamento
 */
export const assignSaveError = assign({
  saveError: ({ event }) => {
    if (event.type !== "SAVE_ERROR") return null;
    return event.error;
  },
});

/**
 * Limpa erro de salvamento
 */
export const clearSaveError = assign({
  saveError: () => null,
});

// ============================================================================
// DISCARD ACTIONS
// ============================================================================

/**
 * Descarta todas as alterações (restaura editedData do serverData)
 */
export const resetToServer = assign({
  editedData: ({ context }) => ({
    general: { ...context.serverData.general },
    image: {
      imageFile: null,
      imageUrl: context.serverData.product?.image_url ?? "",
      pendingRemoval: false,
    },
    offers: {
      localOffers: [...context.serverData.offers],
      deletedOfferIds: [],
      modified: false,
    },
    upsell: { ...context.serverData.upsell },
    affiliate: context.serverData.affiliateSettings ? { ...context.serverData.affiliateSettings } : null,
    checkoutSettings: { ...context.serverData.checkoutSettings },
  }),
  validationErrors: () => ({
    general: {},
    upsell: {},
    affiliate: {},
    checkoutSettings: {},
  }),
  tabErrors: () => ({}),
});
