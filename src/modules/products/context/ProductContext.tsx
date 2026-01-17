/**
 * ProductContext - Orquestrador do Sistema de Edição de Produtos
 * 
 * MODULARIZADO seguindo RISE Protocol V3.
 * Helpers extraídos para ./helpers/
 * 
 * Antes: 484 linhas → Agora: ~280 linhas
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solução C (Nota 9.8/10)
 */

import { createContext, useContext, useReducer, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { ProductContextState, ProductProviderProps, AffiliateSettings, UpsellSettings, ProductData, Offer } from "../types/product.types";
import type { GeneralFormData, ImageFormState, ProductFormState, ProductFormDispatch, FormValidationErrors, CheckoutSettingsFormData, GatewayCredentials } from "../types/productForm.types";

// Reducer e Actions
import { productFormReducer, INITIAL_FORM_STATE, formActions } from "./productFormReducer";
import { validateGeneralForm } from "./productFormValidation";

// Hooks especializados
import {
  useProductCore,
  useProductEntities,
  useProductCheckouts,
  useProductSettings,
} from "./hooks";

// Helpers
import {
  createUpdateGeneralField,
  createUpdateImageState,
  createUpdateLocalOffers,
  createMarkOfferDeleted,
  createSetOffersModified,
  createUpdateCheckoutSettingsField,
  createInitCheckoutSettings,
  createSaveProduct,
  createSaveUpsellSettings,
  createSaveAffiliateSettings,
  createSaveAll,
  createUpdateProduct,
  createUpdateProductBulk,
  createUpdateUpsellSettings,
  createUpdateAffiliateSettings,
} from "./helpers";

// ============================================================================
// CONTEXT TYPE ESTENDIDO
// ============================================================================

interface ProductContextExtended extends ProductContextState {
  formState: ProductFormState;
  formDispatch: ProductFormDispatch;
  dispatchForm: ProductFormDispatch;
  formErrors: FormValidationErrors;
  validateGeneralForm: () => boolean;
  generalForm: GeneralFormData;
  imageState: ImageFormState;
  localOffers: Offer[];
  checkoutSettingsForm: CheckoutSettingsFormData;
  checkoutCredentials: GatewayCredentials;
  updateGeneralField: <K extends keyof GeneralFormData>(field: K, value: GeneralFormData[K]) => void;
  updateImageState: (update: Partial<ImageFormState>) => void;
  updateLocalOffers: (offers: Offer[]) => void;
  markOfferDeleted: (offerId: string) => void;
  setOffersModified: (modified: boolean) => void;
  updateCheckoutSettingsField: <K extends keyof CheckoutSettingsFormData>(field: K, value: CheckoutSettingsFormData[K]) => void;
  initCheckoutSettings: (settings: CheckoutSettingsFormData, credentials: GatewayCredentials) => void;
}

// ============================================================================
// CONTEXTO
// ============================================================================

const ProductContext = createContext<ProductContextExtended | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function ProductProvider({ productId, children }: ProductProviderProps) {
  const { user } = useAuth();

  // Reducer: Single Source of Truth
  const [formState, formDispatch] = useReducer(productFormReducer, INITIAL_FORM_STATE);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkoutCredentials, setCheckoutCredentials] = useState<GatewayCredentials>({});

  const hasUnsavedChanges = formState.isDirty;

  // Legacy callbacks (no-op para compatibilidade)
  const markCoreUnsaved = useCallback(() => {}, []);
  const markCoreSaved = useCallback(() => {}, []);
  const markSettingsUnsaved = useCallback(() => {}, []);
  const markSettingsSaved = useCallback(() => {}, []);
  const updateGeneralModified = useCallback(() => {}, []);
  const updateSettingsModified = useCallback(() => {}, []);
  const updateUpsellModified = useCallback(() => {}, []);
  const resetDirtySources = useCallback(() => {
    formDispatch(formActions.resetToServer());
  }, []);

  // Hooks especializados
  const settings = useProductSettings({
    productId,
    userId: user?.id,
    onUnsavedChange: markSettingsUnsaved,
    onSaveComplete: markSettingsSaved,
  });

  const core = useProductCore({
    productId,
    userId: user?.id,
    onUnsavedChange: markCoreUnsaved,
    onUpsellSettingsLoaded: settings.setUpsellSettings,
    onAffiliateSettingsLoaded: settings.setAffiliateSettings,
  });

  const entities = useProductEntities({ productId });
  const checkoutsHook = useProductCheckouts({ productId });

  // Sincronizar dados carregados → Reducer
  useEffect(() => {
    if (core.product && entities.offers !== undefined) {
      formDispatch(formActions.initFromServer({
        product: core.product,
        upsellSettings: settings.upsellSettings,
        affiliateSettings: settings.affiliateSettings,
        offers: entities.offers,
      }));
    }
  }, [core.product, entities.offers, settings.upsellSettings, settings.affiliateSettings]);

  // Refresh all
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        core.refreshProduct(),
        entities.refreshOffers(),
        entities.refreshOrderBumps(),
        checkoutsHook.refreshCheckouts(),
        entities.refreshCoupons(),
        checkoutsHook.refreshPaymentLinks(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [core, entities, checkoutsHook]);

  // Carregar dados iniciais
  useEffect(() => {
    if (productId && user) {
      refreshAll();
    }
  }, [productId, user]);

  // Form helpers (usando factory functions)
  const updateGeneralField = useCallback(createUpdateGeneralField(formDispatch), []);
  const updateImageState = useCallback(createUpdateImageState(formDispatch), []);
  const updateLocalOffers = useCallback(createUpdateLocalOffers(formDispatch), []);
  const markOfferDeleted = useCallback(createMarkOfferDeleted(formDispatch), []);
  const setOffersModified = useCallback(createSetOffersModified(formDispatch), []);
  const updateCheckoutSettingsField = useCallback(createUpdateCheckoutSettingsField(formDispatch), []);
  const initCheckoutSettingsHandler = useCallback(
    createInitCheckoutSettings(formDispatch, setCheckoutCredentials), 
    []
  );

  // Save wrappers
  const saveProduct = useCallback(
    createSaveProduct({ setSaving, formDispatch, core }),
    [core]
  );

  const saveUpsellSettings = useCallback(
    createSaveUpsellSettings({ setSaving, settings }),
    [settings]
  );

  const saveAffiliateSettings = useCallback(
    createSaveAffiliateSettings({ setSaving, settings }),
    [settings]
  );

  const saveAll = useCallback(
    createSaveAll({ setSaving, formDispatch, formState, core, settings }),
    [core, settings, formState]
  );

  // Update wrappers
  const updateProduct = useCallback(
    createUpdateProduct(core, formDispatch),
    [core]
  );

  const updateProductBulk = useCallback(
    createUpdateProductBulk(core, formDispatch),
    [core]
  );

  const updateUpsellSettingsWrapper = useCallback(
    createUpdateUpsellSettings(settings, formDispatch),
    [settings]
  );

  const updateAffiliateSettingsWrapper = useCallback(
    createUpdateAffiliateSettings(settings, formDispatch),
    [settings]
  );

  // Context value
  const contextValue: ProductContextExtended = {
    product: core.product,
    offers: entities.offers,
    orderBumps: entities.orderBumps,
    checkouts: checkoutsHook.checkouts,
    coupons: entities.coupons,
    paymentLinks: checkoutsHook.paymentLinks,
    paymentSettings: settings.paymentSettings,
    checkoutFields: settings.checkoutFields,
    upsellSettings: settings.upsellSettings,
    affiliateSettings: settings.affiliateSettings,
    loading,
    saving,
    hasUnsavedChanges,
    updateSettingsModified,
    updateGeneralModified,
    updateUpsellModified,
    resetDirtySources,
    updateProduct,
    updateProductBulk,
    updatePaymentSettings: settings.updatePaymentSettings,
    updateCheckoutFields: settings.updateCheckoutFields,
    updateUpsellSettings: updateUpsellSettingsWrapper,
    updateAffiliateSettings: updateAffiliateSettingsWrapper,
    saveProduct,
    savePaymentSettings: settings.savePaymentSettings,
    saveCheckoutFields: settings.saveCheckoutFields,
    saveUpsellSettings,
    saveAffiliateSettings,
    saveAll,
    refreshProduct: core.refreshProduct,
    refreshOffers: entities.refreshOffers,
    refreshOrderBumps: entities.refreshOrderBumps,
    refreshCheckouts: checkoutsHook.refreshCheckouts,
    refreshCoupons: entities.refreshCoupons,
    refreshPaymentLinks: checkoutsHook.refreshPaymentLinks,
    refreshAll,
    deleteProduct: core.deleteProduct,
    formState,
    formDispatch,
    dispatchForm: formDispatch,
    formErrors: formState.validation,
    validateGeneralForm: () => validateGeneralForm(formState.editedData.general).isValid,
    generalForm: formState.editedData.general,
    imageState: formState.editedData.image,
    localOffers: formState.editedData.offers.localOffers,
    checkoutSettingsForm: formState.editedData.checkoutSettings,
    checkoutCredentials,
    updateGeneralField,
    updateImageState,
    updateLocalOffers,
    markOfferDeleted,
    setOffersModified,
    updateCheckoutSettingsField,
    initCheckoutSettings: initCheckoutSettingsHandler,
  };

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
}

// ============================================================================
// HOOK CUSTOMIZADO
// ============================================================================

export function useProductContext() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error(
      "useProductContext must be used within a ProductProvider. " +
      "Wrap your component tree with <ProductProvider>."
    );
  }

  return context;
}
