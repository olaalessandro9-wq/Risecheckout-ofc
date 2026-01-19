/**
 * ProductContext - Orquestrador do Sistema de Edição de Produtos
 * 
 * MODULARIZADO seguindo RISE Protocol V3.
 * - Reducer como Single Source of Truth
 * - Zero duplicidade de estado
 * - Helpers extraídos para manter < 300 linhas
 * - Registry Pattern para saveAll global
 * - Global Validation Handlers (SEMPRE montados)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Nota 10/10
 */

import { createContext, useContext, useReducer, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { ProductContextState, ProductProviderProps, Offer } from "../types/product.types";
import type { GeneralFormData, ImageFormState, ProductFormState, ProductFormDispatch, CheckoutSettingsFormData, GatewayCredentials, AffiliateSettings, UpsellSettings } from "../types/productForm.types";
import type { RegisterSaveHandler } from "../types/saveRegistry.types";
import type { TabValidationMap } from "../types/tabValidation.types";

// Reducer e Actions
import { productFormReducer, INITIAL_FORM_STATE, formActions } from "./productFormReducer";

// Hooks especializados
import { useProductCore, useProductEntities, useProductCheckouts, useGlobalValidationHandlers, useTabValidation, useProductLoader, useProductDataMapper } from "./hooks";
import { useProductSettings as useProductSettingsAdapter } from "./hooks/useProductSettingsAdapter";
import { useSaveRegistry } from "./hooks/useSaveRegistry";
import { createLogger } from "@/lib/logger";

const log = createLogger("ProductContext");

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
  createSaveAll,
} from "./helpers";
import { createContextValue } from "./helpers/createContextValue";

// ============================================================================
// CONTEXT TYPE ESTENDIDO
// ============================================================================

interface ProductContextExtended extends ProductContextState {
  formState: ProductFormState;
  formDispatch: ProductFormDispatch;
  dispatchForm: ProductFormDispatch;
  formErrors: ProductFormState["validation"];
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
  registerSaveHandler: RegisterSaveHandler;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabErrors: TabValidationMap;
  setTabErrors: (errors: TabValidationMap) => void;
  clearTabErrors: () => void;
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
  const [formState, formDispatch] = useReducer(productFormReducer, INITIAL_FORM_STATE);
  const { registerSaveHandler, executeAll: executeRegistrySaves } = useSaveRegistry();
  const { activeTab, setActiveTab, tabErrors, setTabErrors, clearTabErrors } = useTabValidation();
  const [saving, setSaving] = useState(false);
  const [checkoutCredentials, setCheckoutCredentials] = useState<GatewayCredentials>({});
  const hasUnsavedChanges = formState.isDirty;

  const handleUpdateUpsell = useCallback((settings: Partial<UpsellSettings>) => {
    formDispatch(formActions.updateUpsell(settings));
  }, []);

  const handleUpdateAffiliate = useCallback((settings: Partial<AffiliateSettings>) => {
    formDispatch(formActions.updateAffiliate(settings));
  }, []);

  const settingsAdapter = useProductSettingsAdapter({
    productId,
    userId: user?.id,
    upsellSettings: formState.editedData.upsell,
    affiliateSettings: formState.editedData.affiliate,
    onUpdateUpsell: handleUpdateUpsell,
    onUpdateAffiliate: handleUpdateAffiliate,
  });

  const core = useProductCore({
    productId,
    userId: user?.id,
  });

  const entities = useProductEntities({ productId });
  const checkoutsHook = useProductCheckouts({ productId });
  
  // React Query BFF Loader - Cache automático + 1 chamada substitui 6
  const { 
    data: rawProductData, 
    isLoading: bffLoading, 
    isFetching,
    invalidate: invalidateProductCache,
    error: loadError 
  } = useProductLoader({ 
    productId: productId ?? "",
    enabled: !!productId && !!user 
  });
  const { mapFullData } = useProductDataMapper();
  
  // Loading state: true se carregando pela primeira vez OU re-fetching
  const loading = bffLoading || isFetching;

  // ✅ SOLUÇÃO C: Usa settings diretamente do core (elimina race condition)
  useEffect(() => {
    if (core.product && entities.offers !== undefined) {
      formDispatch(formActions.initFromServer({
        product: core.product,
        upsellSettings: core.upsellSettings || {
          hasCustomThankYouPage: false,
          customPageUrl: "",
          redirectIgnoringOrderBumpFailures: false,
        },
        affiliateSettings: core.affiliateSettings || {
          enabled: false,
          defaultRate: 50,
          requireApproval: false,
          commissionOnOrderBump: false,
          commissionOnUpsell: false,
          supportEmail: "",
          publicDescription: "",
          attributionModel: "last_click",
          cookieDuration: 30,
          showInMarketplace: false,
          marketplaceDescription: "",
          marketplaceCategory: "",
        },
        offers: entities.offers,
      }));
    }
  }, [core.product, core.upsellSettings, core.affiliateSettings, entities.offers]);

  // ============================================================================
  // REACT QUERY DATA SYNC - Sincroniza dados do cache com hooks de entidade
  // ============================================================================

  useEffect(() => {
    if (!rawProductData) return;
    
    const mapped = mapFullData(rawProductData);
    
    // Injetar produto no core
    core.setProduct(mapped.product);
    
    // Injetar entidades nos hooks
    entities.setOffers(mapped.offers);
    entities.setOrderBumps(mapped.orderBumps);
    entities.setCoupons(mapped.coupons);
    checkoutsHook.setCheckouts(mapped.checkouts);
    checkoutsHook.setPaymentLinks(mapped.paymentLinks);
    
    // Dispatch para o reducer (form state)
    formDispatch(formActions.initFromServer({
      product: mapped.product,
      upsellSettings: mapped.upsellSettings,
      affiliateSettings: mapped.affiliateSettings,
      offers: mapped.offers,
    }));
    
    log.info("Product data synced from React Query cache", { productId });
  }, [rawProductData, mapFullData, core, entities, checkoutsHook, formDispatch, productId]);

  // Log de erros do React Query
  useEffect(() => {
    if (loadError) {
      log.error("React Query load error", { productId, error: loadError });
    }
  }, [loadError, productId]);

  // ============================================================================
  // REFRESH ALL - Invalidação do cache React Query
  // ============================================================================

  const refreshAll = useCallback((): Promise<void> => {
    log.info("Invalidating product cache via React Query", { productId });
    invalidateProductCache();
    return Promise.resolve();
  }, [invalidateProductCache, productId]);

  // Global Validation Handlers - SEMPRE REGISTRADOS
  useGlobalValidationHandlers({
    productId,
    userId: user?.id,
    registerSaveHandler,
    generalForm: formState.editedData.general,
    product: core.product,
    imageFile: formState.editedData.image.imageFile,
    pendingRemoval: formState.editedData.image.pendingRemoval,
    localOffers: formState.editedData.offers.localOffers,
    offersModified: formState.editedData.offers.modified,
    deletedOfferIds: formState.editedData.offers.deletedOfferIds,
    resetImage: () => formDispatch({ type: 'RESET_IMAGE' }),
    resetOffers: () => formDispatch({ type: 'RESET_OFFERS' }),
    checkoutSettingsForm: formState.editedData.checkoutSettings,
    isCheckoutSettingsInitialized: formState.isCheckoutSettingsInitialized,
    formDispatch,
    upsellSettings: formState.editedData.upsell,
    saveUpsellSettings: settingsAdapter.saveUpsellSettings,
    affiliateSettings: formState.editedData.affiliate,
    saveAffiliateSettings: settingsAdapter.saveAffiliateSettings,
  });

  const updateGeneralField = useCallback(createUpdateGeneralField(formDispatch), []);
  const updateImageState = useCallback(createUpdateImageState(formDispatch), []);
  const updateLocalOffers = useCallback(createUpdateLocalOffers(formDispatch), []);
  const markOfferDeleted = useCallback(createMarkOfferDeleted(formDispatch), []);
  const setOffersModified = useCallback(createSetOffersModified(formDispatch), []);
  const updateCheckoutSettingsField = useCallback(createUpdateCheckoutSettingsField(formDispatch), []);
  const initCheckoutSettingsHandler = useCallback(createInitCheckoutSettings(formDispatch, setCheckoutCredentials), []);
  const saveProduct = useCallback(createSaveProduct({ setSaving, formDispatch, core }), [core]);

  const saveUpsellSettings = useCallback(async () => {
    setSaving(true);
    try { await settingsAdapter.saveUpsellSettings(formState.editedData.upsell); } 
    finally { setSaving(false); }
  }, [settingsAdapter, formState.editedData.upsell]);

  const saveAffiliateSettings = useCallback(async () => {
    setSaving(true);
    try { await settingsAdapter.saveAffiliateSettings(formState.editedData.affiliate); } 
    finally { setSaving(false); }
  }, [settingsAdapter, formState.editedData.affiliate]);

  const saveAll = useCallback(
    createSaveAll({ setSaving, clearTabErrors, formDispatch, executeRegistrySaves, setTabErrors, setActiveTab }),
    [executeRegistrySaves, clearTabErrors, setTabErrors, setActiveTab]
  );

  const contextValue = createContextValue({
    core, entities, checkoutsHook, formState, formDispatch, settingsAdapter,
    loading, saving, hasUnsavedChanges, checkoutCredentials,
    updateGeneralField, updateImageState, updateLocalOffers, markOfferDeleted, setOffersModified,
    updateCheckoutSettingsField, initCheckoutSettings: initCheckoutSettingsHandler,
    saveProduct, saveUpsellSettings, saveAffiliateSettings, saveAll, refreshAll,
    registerSaveHandler, activeTab, setActiveTab, tabErrors, setTabErrors, clearTabErrors,
  }) as ProductContextExtended;

  return <ProductContext.Provider value={contextValue}>{children}</ProductContext.Provider>;
}

// ============================================================================
// HOOK CUSTOMIZADO
// ============================================================================

export function useProductContext() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProductContext must be used within a ProductProvider.");
  }
  return context;
}
