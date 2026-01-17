/**
 * Product Form State Machine - Actions
 * 
 * Actions são funções que modificam o contexto da máquina.
 * Cada action é uma função pura que retorna as atualizações de contexto.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 10/10
 */

import { assign } from "xstate";
import type { ProductFormContext, ProductFormEvent } from "./productFormMachine.types";
import {
  calculateDirtyFlags,
  anyDirty,
  deriveGeneralFromProduct,
  createInitialServerSnapshot,
  createInitialEditedData,
  INITIAL_IMAGE_STATE,
  INITIAL_VALIDATION,
} from "./productFormMachine.helpers";
import type { ServerDataSnapshot, EditedFormData } from "../types/productForm.types";

// ============================================================================
// LOADING ACTIONS
// ============================================================================

/**
 * Define IDs ao iniciar carregamento
 */
export const setLoadingIds = assign({
  productId: ({ event }: { event: ProductFormEvent }) => {
    if (event.type === "START_LOADING") {
      return event.productId;
    }
    return null;
  },
  userId: ({ event }: { event: ProductFormEvent }) => {
    if (event.type === "START_LOADING") {
      return event.userId;
    }
    return null;
  },
  errorMessage: () => null,
});

/**
 * Processa dados carregados do servidor
 */
export const processLoadedData = assign({
  serverData: ({ event }: { event: ProductFormEvent }): ServerDataSnapshot => {
    if (event.type !== "DATA_LOADED") {
      return createInitialServerSnapshot();
    }
    
    const { product, upsellSettings, affiliateSettings, offers } = event.data;
    const general = deriveGeneralFromProduct(product);
    
    return {
      product,
      general,
      upsell: upsellSettings,
      affiliateSettings,
      offers,
      checkoutSettings: {
        required_fields: { name: true, email: true, phone: false, cpf: false },
        default_payment_method: "pix" as const,
        pix_gateway: "mercadopago",
        credit_card_gateway: "mercadopago",
      },
    };
  },
  editedData: ({ event }: { event: ProductFormEvent }): EditedFormData => {
    if (event.type !== "DATA_LOADED") {
      return createInitialEditedData();
    }
    
    const { product, upsellSettings, affiliateSettings, offers } = event.data;
    const general = deriveGeneralFromProduct(product);
    
    return {
      general,
      image: {
        imageFile: null,
        imageUrl: product?.image_url || "",
        pendingRemoval: false,
      },
      offers: {
        localOffers: offers,
        deletedOfferIds: [],
        modified: false,
      },
      upsell: upsellSettings,
      affiliate: affiliateSettings,
      checkoutSettings: {
        required_fields: { name: true, email: true, phone: false, cpf: false },
        default_payment_method: "pix",
        pix_gateway: "mercadopago",
        credit_card_gateway: "mercadopago",
      },
    };
  },
  isDirty: () => false,
  dirtyFlags: () => ({
    general: false,
    image: false,
    offers: false,
    upsell: false,
    affiliate: false,
    checkoutSettings: false,
  }),
  errorMessage: () => null,
});

/**
 * Define mensagem de erro ao carregar
 */
export const setLoadError = assign({
  errorMessage: ({ event }: { event: ProductFormEvent }) => {
    if (event.type === "LOAD_ERROR") {
      return event.error;
    }
    return "Erro desconhecido ao carregar";
  },
});

// ============================================================================
// UPDATE ACTIONS
// ============================================================================

/**
 * Atualiza dados gerais
 */
export const updateGeneral = assign({
  editedData: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_GENERAL") return context.editedData;
    
    return {
      ...context.editedData,
      general: { ...context.editedData.general, ...event.data },
    };
  },
  dirtyFlags: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_GENERAL") return context.dirtyFlags;
    
    const newGeneral = { ...context.editedData.general, ...event.data };
    const newEditedData = { ...context.editedData, general: newGeneral };
    return calculateDirtyFlags(newEditedData, context.serverData);
  },
  isDirty: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_GENERAL") return context.isDirty;
    
    const newGeneral = { ...context.editedData.general, ...event.data };
    const newEditedData = { ...context.editedData, general: newGeneral };
    const flags = calculateDirtyFlags(newEditedData, context.serverData);
    return anyDirty(flags);
  },
});

/**
 * Atualiza estado da imagem
 */
export const updateImage = assign({
  editedData: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_IMAGE") return context.editedData;
    
    return {
      ...context.editedData,
      image: { ...context.editedData.image, ...event.data },
    };
  },
  dirtyFlags: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_IMAGE") return context.dirtyFlags;
    
    const newImage = { ...context.editedData.image, ...event.data };
    const newEditedData = { ...context.editedData, image: newImage };
    return calculateDirtyFlags(newEditedData, context.serverData);
  },
  isDirty: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_IMAGE") return context.isDirty;
    
    const newImage = { ...context.editedData.image, ...event.data };
    const newEditedData = { ...context.editedData, image: newImage };
    const flags = calculateDirtyFlags(newEditedData, context.serverData);
    return anyDirty(flags);
  },
});

/**
 * Reseta imagem para estado inicial
 */
export const resetImage = assign({
  editedData: ({ context }: { context: ProductFormContext }) => ({
    ...context.editedData,
    image: INITIAL_IMAGE_STATE,
  }),
  dirtyFlags: ({ context }: { context: ProductFormContext }) => {
    const newEditedData = { ...context.editedData, image: INITIAL_IMAGE_STATE };
    return calculateDirtyFlags(newEditedData, context.serverData);
  },
  isDirty: ({ context }: { context: ProductFormContext }) => {
    const newEditedData = { ...context.editedData, image: INITIAL_IMAGE_STATE };
    const flags = calculateDirtyFlags(newEditedData, context.serverData);
    return anyDirty(flags);
  },
});

/**
 * Atualiza ofertas
 */
export const updateOffers = assign({
  editedData: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_OFFERS") return context.editedData;
    
    return {
      ...context.editedData,
      offers: {
        localOffers: event.data.localOffers ?? context.editedData.offers.localOffers,
        deletedOfferIds: event.data.deletedOfferIds ?? context.editedData.offers.deletedOfferIds,
        modified: event.data.modified ?? context.editedData.offers.modified,
      },
    };
  },
  dirtyFlags: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_OFFERS") return context.dirtyFlags;
    
    const newOffers = {
      localOffers: event.data.localOffers ?? context.editedData.offers.localOffers,
      deletedOfferIds: event.data.deletedOfferIds ?? context.editedData.offers.deletedOfferIds,
      modified: event.data.modified ?? context.editedData.offers.modified,
    };
    const newEditedData = { ...context.editedData, offers: newOffers };
    return calculateDirtyFlags(newEditedData, context.serverData);
  },
  isDirty: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_OFFERS") return context.isDirty;
    
    const newOffers = {
      localOffers: event.data.localOffers ?? context.editedData.offers.localOffers,
      deletedOfferIds: event.data.deletedOfferIds ?? context.editedData.offers.deletedOfferIds,
      modified: event.data.modified ?? context.editedData.offers.modified,
    };
    const newEditedData = { ...context.editedData, offers: newOffers };
    const flags = calculateDirtyFlags(newEditedData, context.serverData);
    return anyDirty(flags);
  },
});

/**
 * Adiciona ID de oferta deletada
 */
export const addDeletedOffer = assign({
  editedData: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "ADD_DELETED_OFFER") return context.editedData;
    
    return {
      ...context.editedData,
      offers: {
        ...context.editedData.offers,
        deletedOfferIds: [...context.editedData.offers.deletedOfferIds, event.offerId],
      },
    };
  },
  isDirty: () => true,
  dirtyFlags: ({ context }: { context: ProductFormContext }) => ({
    ...context.dirtyFlags,
    offers: true,
  }),
});

/**
 * Atualiza upsell
 */
export const updateUpsell = assign({
  editedData: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_UPSELL") return context.editedData;
    
    return {
      ...context.editedData,
      upsell: { ...context.editedData.upsell, ...event.data },
    };
  },
  dirtyFlags: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_UPSELL") return context.dirtyFlags;
    
    const newUpsell = { ...context.editedData.upsell, ...event.data };
    const newEditedData = { ...context.editedData, upsell: newUpsell };
    return calculateDirtyFlags(newEditedData, context.serverData);
  },
  isDirty: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_UPSELL") return context.isDirty;
    
    const newUpsell = { ...context.editedData.upsell, ...event.data };
    const newEditedData = { ...context.editedData, upsell: newUpsell };
    const flags = calculateDirtyFlags(newEditedData, context.serverData);
    return anyDirty(flags);
  },
});

/**
 * Atualiza affiliate
 */
export const updateAffiliate = assign({
  editedData: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_AFFILIATE") return context.editedData;
    
    const current = context.editedData.affiliate;
    return {
      ...context.editedData,
      affiliate: current ? { ...current, ...event.data } : event.data as typeof current,
    };
  },
  dirtyFlags: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_AFFILIATE") return context.dirtyFlags;
    
    const current = context.editedData.affiliate;
    const newAffiliate = current ? { ...current, ...event.data } : event.data;
    const newEditedData = { ...context.editedData, affiliate: newAffiliate as typeof current };
    return calculateDirtyFlags(newEditedData, context.serverData);
  },
  isDirty: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_AFFILIATE") return context.isDirty;
    
    const current = context.editedData.affiliate;
    const newAffiliate = current ? { ...current, ...event.data } : event.data;
    const newEditedData = { ...context.editedData, affiliate: newAffiliate as typeof current };
    const flags = calculateDirtyFlags(newEditedData, context.serverData);
    return anyDirty(flags);
  },
});

/**
 * Atualiza checkout settings
 */
export const updateCheckoutSettings = assign({
  editedData: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_CHECKOUT_SETTINGS") return context.editedData;
    
    return {
      ...context.editedData,
      checkoutSettings: { ...context.editedData.checkoutSettings, ...event.data },
    };
  },
  dirtyFlags: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_CHECKOUT_SETTINGS") return context.dirtyFlags;
    
    const newSettings = { ...context.editedData.checkoutSettings, ...event.data };
    const newEditedData = { ...context.editedData, checkoutSettings: newSettings };
    return calculateDirtyFlags(newEditedData, context.serverData);
  },
  isDirty: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "UPDATE_CHECKOUT_SETTINGS") return context.isDirty;
    
    const newSettings = { ...context.editedData.checkoutSettings, ...event.data };
    const newEditedData = { ...context.editedData, checkoutSettings: newSettings };
    const flags = calculateDirtyFlags(newEditedData, context.serverData);
    return anyDirty(flags);
  },
});

/**
 * Inicializa checkout settings (quando carregados)
 */
export const initCheckoutSettings = assign({
  editedData: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "INIT_CHECKOUT_SETTINGS") return context.editedData;
    
    return {
      ...context.editedData,
      checkoutSettings: event.settings,
    };
  },
  serverData: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "INIT_CHECKOUT_SETTINGS") return context.serverData;
    
    return {
      ...context.serverData,
      checkoutSettings: { ...event.settings },
    };
  },
  checkoutCredentials: ({ event }: { event: ProductFormEvent }) => {
    if (event.type !== "INIT_CHECKOUT_SETTINGS") return {};
    return event.credentials;
  },
});

// ============================================================================
// VALIDATION ACTIONS
// ============================================================================

/**
 * Define erro de validação
 */
export const setValidationError = assign({
  validation: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "SET_VALIDATION_ERROR") return context.validation;
    
    const { section, field, error } = event;
    return {
      ...context.validation,
      [section]: {
        ...context.validation[section],
        [field]: error,
      },
    };
  },
});

/**
 * Limpa todos os erros de validação
 */
export const clearValidationErrors = assign({
  validation: () => INITIAL_VALIDATION,
});

/**
 * Processa erros de validação do evento
 */
export const processValidationErrors = assign({
  validation: ({ event }: { event: ProductFormEvent }) => {
    if (event.type !== "VALIDATION_FAILED") return INITIAL_VALIDATION;
    return event.errors;
  },
});

// ============================================================================
// SAVE ACTIONS
// ============================================================================

/**
 * Incrementa contador de tentativas de save
 */
export const incrementSaveAttempts = assign({
  saveAttempts: ({ context }: { context: ProductFormContext }) => context.saveAttempts + 1,
});

/**
 * Reseta contador de tentativas
 */
export const resetSaveAttempts = assign({
  saveAttempts: () => 0,
});

/**
 * Processa sucesso do save
 */
export const processSaveSuccess = assign({
  serverData: ({ context, event }: { context: ProductFormContext; event: ProductFormEvent }) => {
    if (event.type !== "SAVE_SUCCESS") return context.serverData;
    
    // Atualiza serverData com os dados editados (agora são a nova "verdade")
    return {
      ...context.serverData,
      general: { ...context.editedData.general },
      upsell: { ...context.editedData.upsell },
      affiliateSettings: context.editedData.affiliate ? { ...context.editedData.affiliate } : null,
      offers: [...context.editedData.offers.localOffers],
      checkoutSettings: { ...context.editedData.checkoutSettings },
      ...(event.newServerData || {}),
    };
  },
  editedData: ({ context }: { context: ProductFormContext }) => ({
    ...context.editedData,
    image: INITIAL_IMAGE_STATE,
    offers: {
      ...context.editedData.offers,
      deletedOfferIds: [],
      modified: false,
    },
  }),
  isDirty: () => false,
  dirtyFlags: () => ({
    general: false,
    image: false,
    offers: false,
    upsell: false,
    affiliate: false,
    checkoutSettings: false,
  }),
  saveAttempts: () => 0,
  errorMessage: () => null,
});

/**
 * Define erro de save
 */
export const setSaveError = assign({
  errorMessage: ({ event }: { event: ProductFormEvent }) => {
    if (event.type === "SAVE_ERROR") {
      return event.error;
    }
    return "Erro desconhecido ao salvar";
  },
});

// ============================================================================
// RESET ACTIONS
// ============================================================================

/**
 * Descarta mudanças (volta para serverData)
 */
export const discardChanges = assign({
  editedData: ({ context }: { context: ProductFormContext }): EditedFormData => ({
    general: { ...context.serverData.general },
    image: {
      imageFile: null,
      imageUrl: context.serverData.product?.image_url || "",
      pendingRemoval: false,
    },
    offers: {
      localOffers: [...context.serverData.offers],
      deletedOfferIds: [],
      modified: false,
    },
    upsell: { ...context.serverData.upsell },
    affiliate: context.serverData.affiliateSettings
      ? { ...context.serverData.affiliateSettings }
      : null,
    checkoutSettings: { ...context.serverData.checkoutSettings },
  }),
  isDirty: () => false,
  dirtyFlags: () => ({
    general: false,
    image: false,
    offers: false,
    upsell: false,
    affiliate: false,
    checkoutSettings: false,
  }),
  validation: () => INITIAL_VALIDATION,
  errorMessage: () => null,
});

// ============================================================================
// ACTION MAP
// ============================================================================

export const actions = {
  setLoadingIds,
  processLoadedData,
  setLoadError,
  updateGeneral,
  updateImage,
  resetImage,
  updateOffers,
  addDeletedOffer,
  updateUpsell,
  updateAffiliate,
  updateCheckoutSettings,
  initCheckoutSettings,
  setValidationError,
  clearValidationErrors,
  processValidationErrors,
  incrementSaveAttempts,
  resetSaveAttempts,
  processSaveSuccess,
  setSaveError,
  discardChanges,
};
