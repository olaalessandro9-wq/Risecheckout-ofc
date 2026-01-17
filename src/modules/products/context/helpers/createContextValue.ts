/**
 * createContextValue - Factory para construir o valor do ProductContext
 *
 * Extrai a construção do objeto de contexto para manter
 * ProductContext.tsx sob o limite de 300 linhas.
 *
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import type { ProductData, Offer } from "../../types/product.types";
import type { 
  GeneralFormData, 
  ImageFormState, 
  ProductFormState, 
  ProductFormDispatch,
  CheckoutSettingsFormData,
  GatewayCredentials,
  AffiliateSettings,
  UpsellSettings,
} from "../../types/productForm.types";
import { validateGeneralForm } from "../productFormValidation";

// ============================================================================
// TIPOS
// ============================================================================

export interface ContextValueDependencies {
  // Core data hooks (generic return types to avoid circular imports)
  core: {
    product: ProductData | null;
    refreshProduct: () => Promise<void>;
    deleteProduct: () => Promise<boolean>;
    updateProduct: (field: keyof ProductData, value: ProductData[keyof ProductData]) => void;
    updateProductBulk: (data: Partial<ProductData>) => void;
  };
  entities: {
    offers: Offer[];
    orderBumps: unknown[];
    coupons: unknown[];
    refreshOffers: () => Promise<void>;
    refreshOrderBumps: () => Promise<void>;
    refreshCoupons: () => Promise<void>;
  };
  checkoutsHook: {
    checkouts: unknown[];
    paymentLinks: unknown[];
    refreshCheckouts: () => Promise<void>;
    refreshPaymentLinks: () => Promise<void>;
  };
  formState: ProductFormState;
  formDispatch: ProductFormDispatch;
  settingsAdapter: {
    updateUpsellSettings: (settings: Partial<UpsellSettings>) => void;
    updateAffiliateSettings: (settings: Partial<AffiliateSettings>) => void;
  };
  loading: boolean;
  saving: boolean;
  hasUnsavedChanges: boolean;
  checkoutCredentials: GatewayCredentials;
  // Handlers
  updateGeneralField: <K extends keyof GeneralFormData>(field: K, value: GeneralFormData[K]) => void;
  updateImageState: (update: Partial<ImageFormState>) => void;
  updateLocalOffers: (offers: Offer[]) => void;
  markOfferDeleted: (offerId: string) => void;
  setOffersModified: (modified: boolean) => void;
  updateCheckoutSettingsField: <K extends keyof CheckoutSettingsFormData>(field: K, value: CheckoutSettingsFormData[K]) => void;
  initCheckoutSettings: (settings: CheckoutSettingsFormData, credentials: GatewayCredentials) => void;
  // Save handlers
  saveProduct: () => Promise<void>;
  saveUpsellSettings: () => Promise<void>;
  saveAffiliateSettings: () => Promise<void>;
  saveAll: () => Promise<void>;
  // Refresh
  refreshAll: () => Promise<void>;
  // Legacy callbacks
  updateSettingsModified: () => void;
  updateGeneralModified: () => void;
  updateUpsellModified: () => void;
  resetDirtySources: () => void;
}

// ============================================================================
// DEFAULTS (para compatibilidade)
// ============================================================================

export const defaultPaymentSettings = {
  pixEnabled: true,
  creditCardEnabled: true,
  defaultPaymentMethod: "credit_card" as const,
};

export const defaultCheckoutFields = {
  fullName: true,
  phone: true,
  email: true,
  cpf: false,
};

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createContextValue(deps: ContextValueDependencies) {
  const {
    core,
    entities,
    checkoutsHook,
    formState,
    formDispatch,
    settingsAdapter,
    loading,
    saving,
    hasUnsavedChanges,
    checkoutCredentials,
    updateGeneralField,
    updateImageState,
    updateLocalOffers,
    markOfferDeleted,
    setOffersModified,
    updateCheckoutSettingsField,
    initCheckoutSettings,
    saveProduct,
    saveUpsellSettings,
    saveAffiliateSettings,
    saveAll,
    refreshAll,
    updateSettingsModified,
    updateGeneralModified,
    updateUpsellModified,
    resetDirtySources,
  } = deps;

  return {
    // Dados
    product: core.product,
    offers: entities.offers,
    orderBumps: entities.orderBumps,
    checkouts: checkoutsHook.checkouts,
    coupons: entities.coupons,
    paymentLinks: checkoutsHook.paymentLinks,
    paymentSettings: defaultPaymentSettings,
    checkoutFields: defaultCheckoutFields,
    upsellSettings: formState.editedData.upsell,
    affiliateSettings: formState.editedData.affiliate,
    // Estado
    loading,
    saving,
    hasUnsavedChanges,
    // Legacy callbacks
    updateSettingsModified,
    updateGeneralModified,
    updateUpsellModified,
    resetDirtySources,
    // Update handlers
    updateProduct: core.updateProduct,
    updateProductBulk: core.updateProductBulk,
    updatePaymentSettings: () => {}, // Legacy no-op
    updateCheckoutFields: () => {}, // Legacy no-op
    updateUpsellSettings: settingsAdapter.updateUpsellSettings,
    updateAffiliateSettings: settingsAdapter.updateAffiliateSettings,
    // Save handlers
    saveProduct,
    savePaymentSettings: async () => {}, // Legacy no-op
    saveCheckoutFields: async () => {}, // Legacy no-op
    saveUpsellSettings,
    saveAffiliateSettings,
    saveAll,
    // Refresh handlers
    refreshProduct: core.refreshProduct,
    refreshOffers: entities.refreshOffers,
    refreshOrderBumps: entities.refreshOrderBumps,
    refreshCheckouts: checkoutsHook.refreshCheckouts,
    refreshCoupons: entities.refreshCoupons,
    refreshPaymentLinks: checkoutsHook.refreshPaymentLinks,
    refreshAll,
    deleteProduct: core.deleteProduct,
    // Form state (novo sistema)
    formState,
    formDispatch,
    dispatchForm: formDispatch,
    formErrors: formState.validation,
    validateGeneralForm: () => validateGeneralForm(formState.editedData.general).isValid,
    // Shortcuts para dados editados
    generalForm: formState.editedData.general,
    imageState: formState.editedData.image,
    localOffers: formState.editedData.offers.localOffers,
    checkoutSettingsForm: formState.editedData.checkoutSettings,
    checkoutCredentials,
    // Form handlers
    updateGeneralField,
    updateImageState,
    updateLocalOffers,
    markOfferDeleted,
    setOffersModified,
    updateCheckoutSettingsField,
    initCheckoutSettings,
  };
}
