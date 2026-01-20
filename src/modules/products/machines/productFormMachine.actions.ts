/**
 * ProductFormMachine Actions
 * 
 * Funções de ação que modificam o contexto da máquina.
 * Todas as ações são puras e retornam o novo contexto.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solução 10.0/10
 * @module products/machines
 */

import { assign } from "xstate";
import type { 
  ProductFormContext, 
  MappedProductData,
  GeneralFormData,
  ImageFormState,
  OffersFormState,
  UpsellSettings,
  AffiliateSettings,
  CheckoutSettingsFormData,
  GatewayCredentials,
  ValidationErrors,
} from "./productFormMachine.types";

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
// LIFECYCLE ACTIONS
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

// ============================================================================
// VALIDATION ACTIONS
// ============================================================================

/**
 * Define erro de validação em campo específico
 */
export const assignValidationError = assign({
  validationErrors: ({ context, event }) => {
    if (event.type !== "SET_VALIDATION_ERROR") return context.validationErrors;
    const { section, field, error } = event;
    return {
      ...context.validationErrors,
      [section]: {
        ...context.validationErrors[section],
        [field]: error,
      },
    };
  },
});

/**
 * Limpa todos os erros de validação
 */
export const clearValidationErrors = assign({
  validationErrors: (): ValidationErrors => ({
    general: {},
    upsell: {},
    affiliate: {},
    checkoutSettings: {},
  }),
});

// ============================================================================
// TAB ACTIONS
// ============================================================================

/**
 * Define tab ativa
 */
export const assignActiveTab = assign({
  activeTab: ({ event }) => {
    if (event.type !== "SET_TAB") return "general";
    return event.tab;
  },
});

/**
 * Define erros por tab
 */
export const assignTabErrors = assign({
  tabErrors: ({ event }) => {
    if (event.type !== "SET_TAB_ERRORS") return {};
    return event.errors;
  },
});

/**
 * Limpa erros de tabs
 */
export const clearTabErrors = assign({
  tabErrors: () => ({}),
});
