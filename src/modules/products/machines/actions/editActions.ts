/**
 * Edit Actions
 * 
 * Actions relacionadas à edição de campos do formulário.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 * @module products/machines/actions
 */

import { assign } from "xstate";

// ============================================================================
// EDIT ACTIONS
// ============================================================================

/**
 * Atualiza campos do formulário geral
 */
export const assignEditGeneral = assign({
  editedData: ({ context, event }) => {
    if (event.type !== "EDIT_GENERAL") return context.editedData;
    return {
      ...context.editedData,
      general: {
        ...context.editedData.general,
        ...event.payload,
      },
    };
  },
});

/**
 * Atualiza estado da imagem
 */
export const assignEditImage = assign({
  editedData: ({ context, event }) => {
    if (event.type !== "EDIT_IMAGE") return context.editedData;
    return {
      ...context.editedData,
      image: {
        ...context.editedData.image,
        ...event.payload,
      },
    };
  },
});

/**
 * Atualiza ofertas locais
 */
export const assignEditOffers = assign({
  editedData: ({ context, event }) => {
    if (event.type !== "EDIT_OFFERS") return context.editedData;
    return {
      ...context.editedData,
      offers: {
        ...context.editedData.offers,
        ...event.payload,
      },
    };
  },
});

/**
 * Adiciona oferta à lista de deletados
 */
export const assignAddDeletedOffer = assign({
  editedData: ({ context, event }) => {
    if (event.type !== "ADD_DELETED_OFFER") return context.editedData;
    return {
      ...context.editedData,
      offers: {
        ...context.editedData.offers,
        deletedOfferIds: [...context.editedData.offers.deletedOfferIds, event.offerId],
        modified: true,
      },
    };
  },
});

/**
 * Atualiza configurações de upsell
 */
export const assignEditUpsell = assign({
  editedData: ({ context, event }) => {
    if (event.type !== "EDIT_UPSELL") return context.editedData;
    return {
      ...context.editedData,
      upsell: {
        ...context.editedData.upsell,
        ...event.payload,
      },
    };
  },
});

/**
 * Atualiza configurações de afiliado
 */
export const assignEditAffiliate = assign({
  editedData: ({ context, event }) => {
    if (event.type !== "EDIT_AFFILIATE") return context.editedData;
    const currentAffiliate = context.editedData.affiliate ?? {
      enabled: false,
      defaultRate: 10,
      requireApproval: true,
      attributionModel: "last_click" as const,
      cookieDuration: 30,
    };
    return {
      ...context.editedData,
      affiliate: {
        ...currentAffiliate,
        ...event.payload,
      },
    };
  },
});

/**
 * Atualiza configurações de checkout
 */
export const assignEditCheckoutSettings = assign({
  editedData: ({ context, event }) => {
    if (event.type !== "EDIT_CHECKOUT_SETTINGS") return context.editedData;
    return {
      ...context.editedData,
      checkoutSettings: {
        ...context.editedData.checkoutSettings,
        ...event.payload,
      },
    };
  },
});

/**
 * Inicializa checkout settings (carregadas separadamente)
 */
export const assignInitCheckoutSettings = assign({
  editedData: ({ context, event }) => {
    if (event.type !== "INIT_CHECKOUT_SETTINGS") return context.editedData;
    return {
      ...context.editedData,
      checkoutSettings: event.settings,
    };
  },
  serverData: ({ context, event }) => {
    if (event.type !== "INIT_CHECKOUT_SETTINGS") return context.serverData;
    return {
      ...context.serverData,
      checkoutSettings: event.settings,
    };
  },
  checkoutCredentials: ({ event }) => {
    if (event.type !== "INIT_CHECKOUT_SETTINGS") return {};
    return event.credentials;
  },
  isCheckoutSettingsInitialized: () => true,
});
