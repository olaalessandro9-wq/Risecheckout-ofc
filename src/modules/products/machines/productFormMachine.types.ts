/**
 * ProductFormMachine Types
 * 
 * Re-exporta e estende tipos existentes para a State Machine XState.
 * 
 * IMPORTANTE: Esta State Machine REUTILIZA os tipos do módulo Products
 * para garantir compatibilidade com o código existente.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solução 10.0/10
 * @module products/machines/types
 */

// Re-export tipos existentes para manter compatibilidade
export type {
  ProductData as MachineProduct,
  Offer as MachineOffer,
  OrderBump as MachineOrderBump,
  Checkout as MachineCheckout,
  PaymentLink as MachinePaymentLink,
  Coupon as MachineCoupon,
  UpsellSettings,
  AffiliateSettings,
} from "../types/product.types";

export type {
  GeneralFormData,
  ImageFormState,
  OffersFormState,
  CheckoutSettingsFormData,
  GatewayCredentials,
  GatewayCredentialStatus,
  ServerDataSnapshot,
  EditedFormData,
} from "../types/formData.types";

export type {
  TabValidationMap,
} from "../types/tabValidation.types";

// Import para uso interno
import type { 
  ProductData, 
  Offer, 
  OrderBump, 
  Checkout, 
  PaymentLink, 
  Coupon,
  UpsellSettings,
  AffiliateSettings 
} from "../types/product.types";
import type {
  GeneralFormData,
  ImageFormState,
  OffersFormState,
  CheckoutSettingsFormData,
  GatewayCredentials,
  ServerDataSnapshot,
  EditedFormData,
} from "../types/formData.types";
import type { TabValidationMap } from "../types/tabValidation.types";

// ============================================================================
// ENTITY TYPES (aliases para compatibilidade)
// ============================================================================

// Aliases mantidos para compatibilidade com código existente na state machine
export type MachineProduct = ProductData;
export type MachineOffer = Offer;
export type MachineOrderBump = OrderBump;
export type MachineCheckout = Checkout;
export type MachineCoupon = Coupon;
export type MachinePaymentLink = PaymentLink;

// ============================================================================
// PRODUCT ENTITIES (Entidades relacionadas ao produto)
// ============================================================================

export interface ProductEntities {
  orderBumps: OrderBump[];
  checkouts: Checkout[];
  paymentLinks: PaymentLink[];
  coupons: Coupon[];
}

// ============================================================================
// MAPPED DATA (Dados mapeados do BFF)
// ============================================================================

export interface MappedProductData {
  product: ProductData;
  offers: Offer[];
  orderBumps: OrderBump[];
  checkouts: Checkout[];
  paymentLinks: PaymentLink[];
  coupons: Coupon[];
  upsellSettings: UpsellSettings;
  affiliateSettings: AffiliateSettings | null;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationErrors {
  general?: Record<string, string>;
  image?: Record<string, string>;
  offers?: Record<string, string>;
  checkout?: Record<string, string>;
  [key: string]: Record<string, string> | undefined;
}

// ============================================================================
// ACTOR INPUT TYPES
// ============================================================================

export interface LoadProductInput {
  productId: string | null;
  userId?: string;
}

export interface SaveAllInput {
  productId: string | null;
  userId?: string;
  editedData: EditedFormData;
  serverData: ServerDataSnapshot;
}

export interface SaveHandlerRegistry {
  [handlerId: string]: () => Promise<{ success: boolean; errors?: string[] }>;
}

// ============================================================================
// COMPUTED TYPES
// ============================================================================

export interface ComputedValues {
  isDirty: boolean;
  isValid: boolean;
  canSave: boolean;
  dirtyFlags: {
    general: boolean;
    image: boolean;
    offers: boolean;
    upsell: boolean;
    affiliate: boolean;
    checkoutSettings: boolean;
  };
}

// ============================================================================
// CONTEXT (Estado interno da máquina)
// ============================================================================

export interface ProductFormContext {
  // IDs
  productId: string | null;
  userId: string | undefined;
  
  // Dados do servidor (imutáveis até novo load)
  serverData: ServerDataSnapshot;
  
  // Dados editados pelo usuário
  editedData: EditedFormData;
  
  // Entidades relacionadas
  entities: ProductEntities;
  
  // Credentials
  credentials: GatewayCredentials;
  
  // Erros
  validationErrors: ValidationErrors;
  saveError: string | null;
  loadError: string | null;
  
  // Timestamps
  lastLoadedAt: number | null;
  lastSavedAt: number | null;
  
  // Tab state
  activeTab: string;
  tabErrors: TabValidationMap;
}

// ============================================================================
// EVENTS (Ações que podem ocorrer)
// ============================================================================

// Lifecycle Events
export interface LoadDataEvent {
  type: "LOAD_DATA";
  productId: string;
}

export interface ReceiveDataEvent {
  type: "RECEIVE_DATA";
  data: MappedProductData;
}

export interface LoadErrorEvent {
  type: "LOAD_ERROR";
  error: string;
}

// Edit Events
export interface EditGeneralEvent {
  type: "EDIT_GENERAL";
  payload: Partial<GeneralFormData>;
}

export interface EditImageEvent {
  type: "EDIT_IMAGE";
  payload: Partial<ImageFormState>;
}

export interface EditOffersEvent {
  type: "EDIT_OFFERS";
  payload: Partial<OffersFormState>;
}

export interface AddDeletedOfferEvent {
  type: "ADD_DELETED_OFFER";
  offerId: string;
}

export interface EditUpsellEvent {
  type: "EDIT_UPSELL";
  payload: Partial<UpsellSettings>;
}

export interface EditAffiliateEvent {
  type: "EDIT_AFFILIATE";
  payload: Partial<AffiliateSettings>;
}

export interface EditCheckoutSettingsEvent {
  type: "EDIT_CHECKOUT_SETTINGS";
  payload: Partial<CheckoutSettingsFormData>;
}

export interface InitCheckoutSettingsEvent {
  type: "INIT_CHECKOUT_SETTINGS";
  settings: CheckoutSettingsFormData;
  credentials: GatewayCredentials;
}

// Action Events
export interface SaveAllEvent {
  type: "SAVE_ALL";
}

export interface SaveSuccessEvent {
  type: "SAVE_SUCCESS";
}

export interface SaveErrorEvent {
  type: "SAVE_ERROR";
  error: string;
}

export interface DiscardChangesEvent {
  type: "DISCARD_CHANGES";
}

export interface RefreshEvent {
  type: "REFRESH";
}

// Tab Events
export interface SetTabEvent {
  type: "SET_TAB";
  tab: string;
}

export interface SetTabErrorsEvent {
  type: "SET_TAB_ERRORS";
  errors: TabValidationMap;
}

export interface ClearTabErrorsEvent {
  type: "CLEAR_TAB_ERRORS";
}

// ============================================================================
// UNION TYPE
// ============================================================================

export type ProductFormEvent =
  | LoadDataEvent
  | ReceiveDataEvent
  | LoadErrorEvent
  | EditGeneralEvent
  | EditImageEvent
  | EditOffersEvent
  | AddDeletedOfferEvent
  | EditUpsellEvent
  | EditAffiliateEvent
  | EditCheckoutSettingsEvent
  | InitCheckoutSettingsEvent
  | SaveAllEvent
  | SaveSuccessEvent
  | SaveErrorEvent
  | DiscardChangesEvent
  | RefreshEvent
  | SetTabEvent
  | SetTabErrorsEvent
  | ClearTabErrorsEvent;
