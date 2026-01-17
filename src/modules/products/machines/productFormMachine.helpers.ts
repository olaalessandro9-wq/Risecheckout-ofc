/**
 * Product Form State Machine - Helpers
 * 
 * Funções auxiliares para cálculos de estado.
 * Importadas de forma isolada para manter a máquina limpa.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 10/10
 */

import type {
  ProductFormContext,
} from "./productFormMachine.types";
import type {
  ServerDataSnapshot,
  EditedFormData,
  GeneralFormData,
  ImageFormState,
  OffersFormState,
  FormValidationErrors,
  CheckoutSettingsFormData,
} from "../types/productForm.types";
import type {
  UpsellSettings,
  AffiliateSettings,
  ProductData,
} from "../types/product.types";

// ============================================================================
// DIRTY FLAGS CALCULATION
// ============================================================================

/**
 * Compara dois objetos de forma profunda para dirty tracking
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== "object" || typeof b !== "object") return false;
  
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => 
    deepEqual(
      (a as Record<string, unknown>)[key], 
      (b as Record<string, unknown>)[key]
    )
  );
}

/**
 * Verifica se dados gerais foram modificados
 */
function isGeneralDirty(edited: GeneralFormData, server: GeneralFormData): boolean {
  return !deepEqual(edited, server);
}

/**
 * Verifica se imagem foi modificada
 */
function isImageDirty(edited: ImageFormState): boolean {
  return edited.imageFile !== null || edited.pendingRemoval;
}

/**
 * Verifica se ofertas foram modificadas
 */
function isOffersDirty(edited: OffersFormState, serverOffers: import("../types/product.types").Offer[]): boolean {
  if (edited.deletedOfferIds.length > 0) return true;
  if (edited.modified) return true;
  if (edited.localOffers.length !== serverOffers.length) return true;
  return !deepEqual(edited.localOffers, serverOffers);
}

/**
 * Verifica se upsell foi modificado
 */
function isUpsellDirty(edited: UpsellSettings, server: UpsellSettings): boolean {
  return !deepEqual(edited, server);
}

/**
 * Verifica se affiliate foi modificado
 */
function isAffiliateDirty(edited: AffiliateSettings | null, server: AffiliateSettings | null): boolean {
  if (edited === null && server === null) return false;
  if (edited === null || server === null) return true;
  return !deepEqual(edited, server);
}

/**
 * Verifica se checkout settings foi modificado
 */
function isCheckoutSettingsDirty(edited: CheckoutSettingsFormData, server: CheckoutSettingsFormData): boolean {
  return !deepEqual(edited, server);
}

/**
 * Calcula todos os dirty flags
 */
export function calculateDirtyFlags(
  editedData: EditedFormData,
  serverData: ServerDataSnapshot
): ProductFormContext["dirtyFlags"] {
  return {
    general: isGeneralDirty(editedData.general, serverData.general),
    image: isImageDirty(editedData.image),
    offers: isOffersDirty(editedData.offers, serverData.offers),
    upsell: isUpsellDirty(editedData.upsell, serverData.upsell),
    affiliate: isAffiliateDirty(editedData.affiliate, serverData.affiliateSettings),
    checkoutSettings: isCheckoutSettingsDirty(editedData.checkoutSettings, serverData.checkoutSettings),
  };
}

/**
 * Verifica se algum dirty flag está ativo
 */
export function anyDirty(flags: ProductFormContext["dirtyFlags"]): boolean {
  return Object.values(flags).some(Boolean);
}

// ============================================================================
// DERIVE DATA FROM PRODUCT
// ============================================================================

/**
 * Extrai dados do formulário geral a partir do ProductData
 */
export function deriveGeneralFromProduct(product: ProductData | null): GeneralFormData {
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
    name: product.name || "",
    description: product.description || "",
    price: product.price || 0,
    support_name: product.support_name || "",
    support_email: product.support_email || "",
    delivery_url: product.delivery_url || "",
    external_delivery: product.external_delivery || false,
  };
}

// ============================================================================
// INITIAL STATE FACTORIES
// ============================================================================

/**
 * Estado inicial da imagem
 */
export const INITIAL_IMAGE_STATE: ImageFormState = {
  imageFile: null,
  imageUrl: "",
  pendingRemoval: false,
};

/**
 * Estado inicial de ofertas
 */
export const INITIAL_OFFERS_STATE: OffersFormState = {
  localOffers: [],
  deletedOfferIds: [],
  modified: false,
};

/**
 * Estado inicial de validação
 */
export const INITIAL_VALIDATION: FormValidationErrors = {
  general: {},
  upsell: {},
  affiliate: {},
};

/**
 * Estado inicial de upsell
 */
export const INITIAL_UPSELL: UpsellSettings = {
  hasCustomThankYouPage: false,
  customPageUrl: "",
  redirectIgnoringOrderBumpFailures: false,
};

/**
 * Estado inicial de checkout settings
 */
export const INITIAL_CHECKOUT_SETTINGS: CheckoutSettingsFormData = {
  required_fields: {
    name: true,
    email: true,
    phone: false,
    cpf: false,
  },
  default_payment_method: "pix",
  pix_gateway: "mercadopago",
  credit_card_gateway: "mercadopago",
};

/**
 * Cria snapshot inicial do servidor
 */
export function createInitialServerSnapshot(): ServerDataSnapshot {
  return {
    product: null,
    general: deriveGeneralFromProduct(null),
    upsell: INITIAL_UPSELL,
    affiliateSettings: null,
    offers: [],
    checkoutSettings: INITIAL_CHECKOUT_SETTINGS,
  };
}

/**
 * Cria estado inicial de edição
 */
export function createInitialEditedData(): EditedFormData {
  return {
    general: deriveGeneralFromProduct(null),
    image: INITIAL_IMAGE_STATE,
    offers: INITIAL_OFFERS_STATE,
    upsell: INITIAL_UPSELL,
    affiliate: null,
    checkoutSettings: INITIAL_CHECKOUT_SETTINGS,
  };
}

/**
 * Cria contexto inicial da máquina
 */
export function createInitialContext(): ProductFormContext {
  return {
    productId: null,
    userId: null,
    serverData: createInitialServerSnapshot(),
    editedData: createInitialEditedData(),
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
    checkoutCredentials: {},
    errorMessage: null,
    saveAttempts: 0,
  };
}
