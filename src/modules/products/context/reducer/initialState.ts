/**
 * Initial State - Estado inicial para o ProductFormReducer
 * 
 * Contém valores default e estado inicial para todos os formulários.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type {
  ProductFormState,
  GeneralFormData,
  ImageFormState,
  OffersFormState,
  FormValidationErrors,
  CheckoutSettingsFormData,
} from "../../types/productForm.types";
import type { UpsellSettings } from "../../types/product.types";

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const INITIAL_GENERAL_FORM: GeneralFormData = {
  name: "",
  description: "",
  price: 0,
  support_name: "",
  support_email: "",
  delivery_url: "",
  external_delivery: false,
};

export const INITIAL_IMAGE_STATE: ImageFormState = {
  imageFile: null,
  imageUrl: "",
  pendingRemoval: false,
};

export const INITIAL_OFFERS_STATE: OffersFormState = {
  localOffers: [],
  deletedOfferIds: [],
  modified: false,
};

export const INITIAL_CHECKOUT_SETTINGS: CheckoutSettingsFormData = {
  required_fields: { name: true, email: true, phone: false, cpf: false },
  default_payment_method: "pix",
  pix_gateway: "pushinpay",
  credit_card_gateway: "mercadopago",
};

export const INITIAL_UPSELL_SETTINGS: UpsellSettings = {
  hasCustomThankYouPage: false,
  customPageUrl: "",
  redirectIgnoringOrderBumpFailures: false,
};

export const INITIAL_VALIDATION: FormValidationErrors = {
  general: {},
  upsell: {},
  affiliate: {},
};

// ============================================================================
// INITIAL FORM STATE
// ============================================================================

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
