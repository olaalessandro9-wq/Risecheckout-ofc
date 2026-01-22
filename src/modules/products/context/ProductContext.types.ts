/**
 * ProductContext Types
 * 
 * Define a interface do valor do contexto React.
 * Extraído para manter ProductContext.tsx abaixo de 300 linhas.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 * @module products/context
 */

import type { ProductFormContext, ProductFormEvent } from "../machines";
import type { calculateDirtyFlags } from "../machines/productFormMachine.guards";
import type { Offer } from "../types/product.types";
import type { 
  GeneralFormData, 
  ImageFormState, 
  CheckoutSettingsFormData, 
  GatewayCredentials 
} from "../types/productForm.types";
import type { RegisterSaveHandler } from "../types/saveRegistry.types";
import type { TabValidationMap } from "../types/tabValidation.types";

// ============================================================================
// CONTEXT VALUE INTERFACE
// ============================================================================

export interface ProductContextValue {
  // === Stable Product ID from Route (SSOT) ===
  productId: string;
  
  // === Data from State Machine ===
  product: ProductFormContext["serverData"]["product"];
  offers: Offer[];
  orderBumps: ProductFormContext["entities"]["orderBumps"];
  checkouts: ProductFormContext["entities"]["checkouts"];
  paymentLinks: ProductFormContext["entities"]["paymentLinks"];
  coupons: ProductFormContext["entities"]["coupons"];
  
  // === Settings ===
  upsellSettings: ProductFormContext["editedData"]["upsell"];
  affiliateSettings: ProductFormContext["editedData"]["affiliate"];
  
  // === State Flags ===
  loading: boolean;
  saving: boolean;
  hasUnsavedChanges: boolean;
  
  // === Form Data ===
  generalForm: GeneralFormData;
  imageState: ImageFormState;
  localOffers: Offer[];
  checkoutSettingsForm: CheckoutSettingsFormData;
  checkoutCredentials: GatewayCredentials;
  
  // === Form Handlers ===
  updateGeneralField: <K extends keyof GeneralFormData>(field: K, value: GeneralFormData[K]) => void;
  updateImageState: (update: Partial<ImageFormState>) => void;
  updateLocalOffers: (offers: Offer[]) => void;
  markOfferDeleted: (offerId: string) => void;
  setOffersModified: (modified: boolean) => void;
  updateCheckoutSettingsField: <K extends keyof CheckoutSettingsFormData>(field: K, value: CheckoutSettingsFormData[K]) => void;
  initCheckoutSettings: (settings: CheckoutSettingsFormData, credentials: GatewayCredentials) => void;
  updateUpsellSettings: (settings: Partial<ProductFormContext["editedData"]["upsell"]>) => void;
  updateAffiliateSettings: (settings: Partial<ProductFormContext["editedData"]["affiliate"]>) => void;
  
  // === Save/Refresh ===
  saveAll: () => Promise<void>;
  refreshAll: () => Promise<void>;
  saveProduct: () => Promise<void>;
  saveUpsellSettings: () => Promise<void>;
  saveAffiliateSettings: () => Promise<void>;
  deleteProduct: () => Promise<boolean>;
  
  // === Refresh Individual ===
  refreshProduct: () => Promise<void>;
  refreshOffers: () => Promise<void>;
  refreshOrderBumps: () => Promise<void>;
  refreshCheckouts: () => Promise<void>;
  refreshCoupons: () => Promise<void>;
  refreshPaymentLinks: () => Promise<void>;
  
  // === Product Operations ===
  updateProduct: (field: string, value: unknown) => void;
  updateProductBulk: (data: Record<string, unknown>) => void;
  
  // === Validation ===
  formErrors: ProductFormContext["validationErrors"];
  validateGeneralForm: () => boolean;
  
  // === Tab Management ===
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabErrors: TabValidationMap;
  setTabErrors: (errors: TabValidationMap) => void;
  clearTabErrors: () => void;
  
  // === Save Registry ===
  registerSaveHandler: RegisterSaveHandler;
  
  // === Legacy Compatibility ===
  formState: {
    editedData: ProductFormContext["editedData"];
    serverData: ProductFormContext["serverData"];
    isDirty: boolean;
    validation: ProductFormContext["validationErrors"];
    isCheckoutSettingsInitialized: boolean;
    dirtyFlags: ReturnType<typeof calculateDirtyFlags>;
  };
  formDispatch: (event: ProductFormEvent) => void;
  dispatchForm: (event: ProductFormEvent) => void;
  
  // === State Machine Direct Access ===
  machineState: string;
  send: (event: ProductFormEvent) => void;
}
