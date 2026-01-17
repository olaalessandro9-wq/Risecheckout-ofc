/**
 * productFormReducer - Reducer Central para Estado de Formulários
 * 
 * Este reducer é a Single Source of Truth para todo estado
 * de formulários no sistema de edição de produtos.
 * 
 * Benefícios:
 * - Estado síncrono e previsível
 * - Zero race conditions
 * - Fácil de testar
 * - Actions são logáveis e debugáveis
 * 
 * @see RISE ARCHITECT PROTOCOL - Solução C (Nota 9.8/10)
 */

import type {
  ProductFormState,
  ProductFormAction,
  ServerDataSnapshot,
  EditedFormData,
  GeneralFormData,
  ImageFormState,
  OffersFormState,
  FormValidationErrors,
  CheckoutSettingsFormData,
  GatewayCredentials,
} from "../types/productForm.types";
import type {
  ProductData,
  UpsellSettings,
  AffiliateSettings,
  Offer,
} from "../types/product.types";

// ============================================================================
// INITIAL STATE
// ============================================================================

const INITIAL_GENERAL_FORM: GeneralFormData = {
  name: "",
  description: "",
  price: 0,
  support_name: "",
  support_email: "",
  delivery_url: "",
  external_delivery: false,
};

const INITIAL_IMAGE_STATE: ImageFormState = {
  imageFile: null,
  imageUrl: "",
  pendingRemoval: false,
};

const INITIAL_OFFERS_STATE: OffersFormState = {
  localOffers: [],
  deletedOfferIds: [],
  modified: false,
};

const INITIAL_CHECKOUT_SETTINGS: CheckoutSettingsFormData = {
  required_fields: { name: true, email: true, phone: false, cpf: false },
  default_payment_method: "pix",
  pix_gateway: "pushinpay",
  credit_card_gateway: "mercadopago",
};

const INITIAL_UPSELL_SETTINGS: UpsellSettings = {
  hasCustomThankYouPage: false,
  customPageUrl: "",
  redirectIgnoringOrderBumpFailures: false,
};

const INITIAL_VALIDATION: FormValidationErrors = {
  general: {},
  upsell: {},
  affiliate: {},
};

export const INITIAL_FORM_STATE: ProductFormState = {
  serverData: {
    product: null,
    general: INITIAL_GENERAL_FORM,
    upsell: INITIAL_UPSELL_SETTINGS,
    affiliateSettings: null,
    offers: [],
    checkoutSettings: INITIAL_CHECKOUT_SETTINGS,
  },
  editedData: {
    general: INITIAL_GENERAL_FORM,
    image: INITIAL_IMAGE_STATE,
    offers: INITIAL_OFFERS_STATE,
    upsell: INITIAL_UPSELL_SETTINGS,
    affiliate: null,
    checkoutSettings: INITIAL_CHECKOUT_SETTINGS,
  },
  isInitialized: false,
  isDirty: false,
  dirtyFlags: {
    general: false,
    image: false,
    offers: false,
    upsell: false,
    affiliate: false,
    checkoutSettings: false,
  },
  validation: INITIAL_VALIDATION,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normaliza string para comparação (null/undefined → "")
 */
function normalizeString(value: string | null | undefined): string {
  return value ?? "";
}

/**
 * Normaliza boolean para comparação (null/undefined → false)
 */
function normalizeBoolean(value: boolean | null | undefined): boolean {
  return value ?? false;
}

/**
 * Deriva GeneralFormData de ProductData
 */
function deriveGeneralFromProduct(product: ProductData | null): GeneralFormData {
  if (!product) return INITIAL_GENERAL_FORM;
  
  return {
    name: product.name,
    description: normalizeString(product.description),
    price: product.price,
    support_name: normalizeString(product.support_name),
    support_email: normalizeString(product.support_email),
    delivery_url: normalizeString(product.delivery_url),
    external_delivery: normalizeBoolean(product.external_delivery),
  };
}

/**
 * Compara GeneralFormData com serverData.general para detectar mudanças
 */
function isGeneralDirty(form: GeneralFormData, serverGeneral: GeneralFormData): boolean {
  return (
    form.name !== serverGeneral.name ||
    form.description !== serverGeneral.description ||
    form.price !== serverGeneral.price ||
    form.support_name !== serverGeneral.support_name ||
    form.support_email !== serverGeneral.support_email ||
    form.delivery_url !== serverGeneral.delivery_url ||
    form.external_delivery !== serverGeneral.external_delivery
  );
}

/**
 * Compara ImageFormState para detectar mudanças
 */
function isImageDirty(image: ImageFormState): boolean {
  return image.imageFile !== null || image.pendingRemoval;
}

/**
 * Compara OffersFormState para detectar mudanças
 */
function isOffersDirty(offers: OffersFormState): boolean {
  return offers.modified || offers.deletedOfferIds.length > 0;
}

/**
 * Compara UpsellSettings para detectar mudanças
 */
function isUpsellDirty(edited: UpsellSettings, server: UpsellSettings): boolean {
  return (
    edited.hasCustomThankYouPage !== server.hasCustomThankYouPage ||
    edited.customPageUrl !== server.customPageUrl ||
    edited.redirectIgnoringOrderBumpFailures !== server.redirectIgnoringOrderBumpFailures
  );
}

/**
 * Compara AffiliateSettings para detectar mudanças
 */
function isAffiliateDirty(edited: AffiliateSettings | null, server: AffiliateSettings | null): boolean {
  if (edited === null && server === null) return false;
  if (edited === null || server === null) return true;
  
  return JSON.stringify(edited) !== JSON.stringify(server);
}

/**
 * Compara CheckoutSettingsFormData para detectar mudanças
 */
function isCheckoutSettingsDirty(edited: CheckoutSettingsFormData, server: CheckoutSettingsFormData): boolean {
  return JSON.stringify(edited) !== JSON.stringify(server);
}

/**
 * Calcula todos os dirty flags
 */
function calculateDirtyFlags(
  editedData: EditedFormData,
  serverData: ServerDataSnapshot
): ProductFormState["dirtyFlags"] {
  return {
    general: isGeneralDirty(editedData.general, serverData.general),
    image: isImageDirty(editedData.image),
    offers: isOffersDirty(editedData.offers),
    upsell: isUpsellDirty(editedData.upsell, serverData.upsell),
    affiliate: isAffiliateDirty(editedData.affiliate, serverData.affiliateSettings),
    checkoutSettings: isCheckoutSettingsDirty(editedData.checkoutSettings, serverData.checkoutSettings),
  };
}

/**
 * Verifica se algum flag está dirty
 */
function anyDirty(flags: ProductFormState["dirtyFlags"]): boolean {
  return flags.general || flags.image || flags.offers || flags.upsell || flags.affiliate || flags.checkoutSettings;
}

// ============================================================================
// REDUCER
// ============================================================================

export function productFormReducer(
  state: ProductFormState,
  action: ProductFormAction
): ProductFormState {
  switch (action.type) {
    // =========================================================================
    // INIT_FROM_SERVER
    // =========================================================================
    case "INIT_FROM_SERVER": {
      const { product, upsellSettings, affiliateSettings, offers } = action.payload;
      
      const generalFromProduct = deriveGeneralFromProduct(product);
      
      const serverData: ServerDataSnapshot = {
        product,
        general: generalFromProduct,
        upsell: upsellSettings,
        affiliateSettings,
        offers,
        checkoutSettings: state.serverData.checkoutSettings, // Mantém o existente
      };
      
      const editedData: EditedFormData = {
        general: { ...generalFromProduct },
        image: INITIAL_IMAGE_STATE,
        offers: {
          localOffers: offers,
          deletedOfferIds: [],
          modified: false,
        },
        upsell: { ...upsellSettings },
        affiliate: affiliateSettings ? { ...affiliateSettings } : null,
        checkoutSettings: state.editedData.checkoutSettings, // Mantém o existente
      };
      
      return {
        ...state,
        serverData,
        editedData,
        isInitialized: true,
        isDirty: false,
        dirtyFlags: {
          general: false,
          image: false,
          offers: false,
          upsell: false,
          affiliate: false,
          checkoutSettings: false,
        },
        validation: INITIAL_VALIDATION,
      };
    }
    
    // =========================================================================
    // UPDATE_GENERAL
    // =========================================================================
    case "UPDATE_GENERAL": {
      const newGeneral = { ...state.editedData.general, ...action.payload };
      const newEditedData = { ...state.editedData, general: newGeneral };
      const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
      
      return {
        ...state,
        editedData: newEditedData,
        dirtyFlags: newDirtyFlags,
        isDirty: anyDirty(newDirtyFlags),
      };
    }
    
    // =========================================================================
    // UPDATE_IMAGE
    // =========================================================================
    case "UPDATE_IMAGE": {
      const newImage = { ...state.editedData.image, ...action.payload };
      const newEditedData = { ...state.editedData, image: newImage };
      const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
      
      return {
        ...state,
        editedData: newEditedData,
        dirtyFlags: newDirtyFlags,
        isDirty: anyDirty(newDirtyFlags),
      };
    }
    
    // =========================================================================
    // UPDATE_OFFERS
    // =========================================================================
    case "UPDATE_OFFERS": {
      const newOffers: OffersFormState = {
        localOffers: action.payload.localOffers ?? state.editedData.offers.localOffers,
        deletedOfferIds: action.payload.deletedOfferIds ?? state.editedData.offers.deletedOfferIds,
        modified: action.payload.modified ?? state.editedData.offers.modified,
      };
      const newEditedData = { ...state.editedData, offers: newOffers };
      const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
      
      return {
        ...state,
        editedData: newEditedData,
        dirtyFlags: newDirtyFlags,
        isDirty: anyDirty(newDirtyFlags),
      };
    }
    
    // =========================================================================
    // ADD_DELETED_OFFER
    // =========================================================================
    case "ADD_DELETED_OFFER": {
      const newDeletedOfferIds = [...state.editedData.offers.deletedOfferIds, action.payload];
      const newOffers: OffersFormState = {
        ...state.editedData.offers,
        deletedOfferIds: newDeletedOfferIds,
      };
      const newEditedData = { ...state.editedData, offers: newOffers };
      const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
      
      return {
        ...state,
        editedData: newEditedData,
        dirtyFlags: newDirtyFlags,
        isDirty: anyDirty(newDirtyFlags),
      };
    }
    
    // =========================================================================
    // UPDATE_UPSELL
    // =========================================================================
    case "UPDATE_UPSELL": {
      const newUpsell = { ...state.editedData.upsell, ...action.payload };
      const newEditedData = { ...state.editedData, upsell: newUpsell };
      const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
      
      return {
        ...state,
        editedData: newEditedData,
        dirtyFlags: newDirtyFlags,
        isDirty: anyDirty(newDirtyFlags),
      };
    }
    
    // =========================================================================
    // UPDATE_AFFILIATE
    // =========================================================================
    case "UPDATE_AFFILIATE": {
      const currentAffiliate = state.editedData.affiliate;
      const newAffiliate = currentAffiliate
        ? { ...currentAffiliate, ...action.payload }
        : (action.payload as AffiliateSettings);
      const newEditedData = { ...state.editedData, affiliate: newAffiliate };
      const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
      
      return {
        ...state,
        editedData: newEditedData,
        dirtyFlags: newDirtyFlags,
        isDirty: anyDirty(newDirtyFlags),
      };
    }
    
    // =========================================================================
    // UPDATE_CHECKOUT_SETTINGS
    // =========================================================================
    case "UPDATE_CHECKOUT_SETTINGS": {
      const newCheckoutSettings = { ...state.editedData.checkoutSettings, ...action.payload };
      const newEditedData = { ...state.editedData, checkoutSettings: newCheckoutSettings };
      const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
      
      return {
        ...state,
        editedData: newEditedData,
        dirtyFlags: newDirtyFlags,
        isDirty: anyDirty(newDirtyFlags),
      };
    }
    
    // =========================================================================
    // INIT_CHECKOUT_SETTINGS
    // =========================================================================
    case "INIT_CHECKOUT_SETTINGS": {
      const { settings } = action.payload;
      
      return {
        ...state,
        serverData: {
          ...state.serverData,
          checkoutSettings: { ...settings },
        },
        editedData: {
          ...state.editedData,
          checkoutSettings: { ...settings },
        },
        dirtyFlags: {
          ...state.dirtyFlags,
          checkoutSettings: false,
        },
      };
    }
    // =========================================================================
    // RESET_TO_SERVER
    // =========================================================================
    case "RESET_TO_SERVER": {
      const editedData: EditedFormData = {
        general: { ...state.serverData.general },
        image: INITIAL_IMAGE_STATE,
        offers: {
          localOffers: state.serverData.offers,
          deletedOfferIds: [],
          modified: false,
        },
        upsell: { ...state.serverData.upsell },
        affiliate: state.serverData.affiliateSettings 
          ? { ...state.serverData.affiliateSettings } 
          : null,
        checkoutSettings: { ...state.serverData.checkoutSettings },
      };
      
      return {
        ...state,
        editedData,
        isDirty: false,
        dirtyFlags: {
          general: false,
          image: false,
          offers: false,
          upsell: false,
          affiliate: false,
          checkoutSettings: false,
        },
        validation: INITIAL_VALIDATION,
      };
    }
    
    // =========================================================================
    // MARK_SAVED
    // =========================================================================
    case "MARK_SAVED": {
      // Atualiza serverData se fornecido (após refresh do produto)
      let newServerData = state.serverData;
      if (action.payload?.newServerData) {
        newServerData = { ...state.serverData, ...action.payload.newServerData };
        
        // Se produto foi atualizado, atualizar general também
        if (action.payload.newServerData.product) {
          newServerData.general = deriveGeneralFromProduct(action.payload.newServerData.product);
        }
      } else {
        // Sem payload, copiar editedData para serverData (assume que save foi completo)
        newServerData = {
          ...state.serverData,
          general: { ...state.editedData.general },
          upsell: { ...state.editedData.upsell },
          affiliateSettings: state.editedData.affiliate ? { ...state.editedData.affiliate } : null,
        };
      }
      
      // Recalcula dirty flags com novos dados do servidor
      const newDirtyFlags = calculateDirtyFlags(state.editedData, newServerData);
      
      return {
        ...state,
        serverData: newServerData,
        dirtyFlags: newDirtyFlags,
        isDirty: anyDirty(newDirtyFlags),
      };
    }
    
    // =========================================================================
    // SET_VALIDATION_ERROR
    // =========================================================================
    case "SET_VALIDATION_ERROR": {
      const { section, field, error } = action.payload;
      
      return {
        ...state,
        validation: {
          ...state.validation,
          [section]: {
            ...state.validation[section],
            [field]: error,
          },
        },
      };
    }
    
    // =========================================================================
    // CLEAR_VALIDATION_ERRORS
    // =========================================================================
    case "CLEAR_VALIDATION_ERRORS": {
      return {
        ...state,
        validation: INITIAL_VALIDATION,
      };
    }
    
    // =========================================================================
    // RESET_IMAGE
    // =========================================================================
    case "RESET_IMAGE": {
      const newEditedData = {
        ...state.editedData,
        image: INITIAL_IMAGE_STATE,
      };
      const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
      
      return {
        ...state,
        editedData: newEditedData,
        dirtyFlags: newDirtyFlags,
        isDirty: anyDirty(newDirtyFlags),
      };
    }
    
    // =========================================================================
    // RESET_OFFERS
    // =========================================================================
    case "RESET_OFFERS": {
      const newOffers: OffersFormState = {
        localOffers: state.editedData.offers.localOffers,
        deletedOfferIds: [],
        modified: false,
      };
      const newEditedData = { ...state.editedData, offers: newOffers };
      const newDirtyFlags = calculateDirtyFlags(newEditedData, state.serverData);
      
      return {
        ...state,
        editedData: newEditedData,
        dirtyFlags: newDirtyFlags,
        isDirty: anyDirty(newDirtyFlags),
      };
    }
    
    // =========================================================================
    // MARK_USER_INTERACTION (no-op para tracking futuro)
    // =========================================================================
    case "MARK_USER_INTERACTION": {
      return state;
    }
    
    default:
      return state;
  }
}

// ============================================================================
// ACTION CREATORS (Helpers para criar actions tipadas)
// ============================================================================

export const formActions = {
  initFromServer: (payload: {
    product: ProductData | null;
    upsellSettings: UpsellSettings;
    affiliateSettings: AffiliateSettings | null;
    offers: Offer[];
  }) => ({ type: "INIT_FROM_SERVER" as const, payload }),
  
  updateGeneral: (payload: Partial<GeneralFormData>) => ({
    type: "UPDATE_GENERAL" as const,
    payload,
  }),
  
  updateImage: (payload: Partial<ImageFormState>) => ({
    type: "UPDATE_IMAGE" as const,
    payload,
  }),
  
  updateOffers: (payload: {
    localOffers?: Offer[];
    deletedOfferIds?: string[];
    modified?: boolean;
  }) => ({ type: "UPDATE_OFFERS" as const, payload }),
  
  addDeletedOffer: (offerId: string) => ({
    type: "ADD_DELETED_OFFER" as const,
    payload: offerId,
  }),
  
  updateUpsell: (payload: Partial<UpsellSettings>) => ({
    type: "UPDATE_UPSELL" as const,
    payload,
  }),
  
  updateAffiliate: (payload: Partial<AffiliateSettings>) => ({
    type: "UPDATE_AFFILIATE" as const,
    payload,
  }),
  
  updateCheckoutSettings: (payload: Partial<CheckoutSettingsFormData>) => ({
    type: "UPDATE_CHECKOUT_SETTINGS" as const,
    payload,
  }),
  
  initCheckoutSettings: (payload: { settings: CheckoutSettingsFormData; credentials: GatewayCredentials }) => ({
    type: "INIT_CHECKOUT_SETTINGS" as const,
    payload,
  }),
  
  resetToServer: () => ({ type: "RESET_TO_SERVER" as const }),
  
  markSaved: (payload?: { newServerData?: Partial<ServerDataSnapshot> }) => ({
    type: "MARK_SAVED" as const,
    payload,
  }),
  
  setValidationError: (
    section: "general" | "upsell" | "affiliate",
    field: string,
    error: string | undefined
  ) => ({
    type: "SET_VALIDATION_ERROR" as const,
    payload: { section, field, error },
  }),
  
  clearValidationErrors: () => ({ type: "CLEAR_VALIDATION_ERRORS" as const }),
  
  resetImage: () => ({ type: "RESET_IMAGE" as const }),
  
  resetOffers: () => ({ type: "RESET_OFFERS" as const }),
  
  markUserInteraction: () => ({ type: "MARK_USER_INTERACTION" as const }),
};
