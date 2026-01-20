/**
 * ProductFormMachine Types
 * 
 * Tipos TypeScript para a State Machine XState do módulo de Produtos.
 * Define Context, Events e todos os sub-tipos necessários.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solução 10.0/10
 * @module products/machines
 */

import type { PaymentMethod } from "@/config/payment-gateways";

// ============================================================================
// BASIC FORM DATA TYPES
// ============================================================================

export interface GeneralFormData {
  name: string;
  description: string;
  price: number;
  support_name: string;
  support_email: string;
  delivery_url: string;
  external_delivery: boolean;
}

export interface ImageFormState {
  imageFile: File | null;
  imageUrl: string;
  pendingRemoval: boolean;
}

export interface OffersFormState {
  localOffers: MachineOffer[];
  deletedOfferIds: string[];
  modified: boolean;
}

export interface CheckoutSettingsFormData {
  required_fields: {
    name: boolean;
    email: boolean;
    phone: boolean;
    cpf: boolean;
  };
  default_payment_method: PaymentMethod;
  pix_gateway: string;
  credit_card_gateway: string;
}

export interface GatewayCredentialStatus {
  configured: boolean;
  viaSecrets?: boolean;
}

export interface GatewayCredentials {
  mercadopago?: GatewayCredentialStatus;
  pushinpay?: GatewayCredentialStatus;
  stripe?: GatewayCredentialStatus;
  asaas?: GatewayCredentialStatus;
  [key: string]: GatewayCredentialStatus | undefined;
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

export interface UpsellSettings {
  hasCustomThankYouPage: boolean;
  customPageUrl: string;
  redirectIgnoringOrderBumpFailures: boolean;
}

export interface AffiliateSettings {
  enabled: boolean;
  defaultRate: number;
  requireApproval: boolean;
  commissionOnOrderBump?: boolean;
  commissionOnUpsell?: boolean;
  supportEmail?: string;
  publicDescription?: string;
  attributionModel: "last_click" | "first_click";
  cookieDuration: number;
  showInMarketplace?: boolean;
  marketplaceDescription?: string;
  marketplaceCategory?: string;
}

// ============================================================================
// ENTITY TYPES (Read-only from BFF)
// ============================================================================

export interface MachineOffer {
  id: string;
  product_id: string;
  name: string;
  price: number;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MachineOrderBump {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  bump_product_id: string | null;
  created_at?: string;
}

export interface MachineCheckout {
  id: string;
  name: string;
  price: number;
  visits: number;
  offer: string;
  isDefault: boolean;
  linkId: string;
  product_id?: string;
  status?: string;
  created_at?: string;
}

export interface MachineCoupon {
  id: string;
  code: string;
  discount: number;
  discount_type?: "percentage" | "fixed";
  startDate: Date;
  endDate: Date;
  usageCount: number;
  max_uses?: number | null;
  applyToOrderBumps: boolean;
  created_at?: string;
  expires_at?: string;
}

export interface MachinePaymentLink {
  id: string;
  slug: string;
  url: string;
  offer_name: string;
  offer_price: number;
  is_default: boolean;
  status: "active" | "inactive";
  checkouts: Array<{ id: string; name: string }>;
  created_at?: string;
}

export interface MachineProduct {
  id?: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  support_name: string;
  support_email: string;
  status: "active" | "blocked";
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  delivery_url?: string | null;
  external_delivery?: boolean;
  members_area_enabled?: boolean;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationErrors {
  general: {
    name?: string;
    description?: string;
    price?: string;
    support_name?: string;
    support_email?: string;
    delivery_url?: string;
  };
  upsell: {
    customPageUrl?: string;
  };
  affiliate: {
    defaultRate?: string;
    cookieDuration?: string;
    supportEmail?: string;
    marketplaceDescription?: string;
    marketplaceCategory?: string;
  };
  checkoutSettings: {
    pix_gateway?: string;
    credit_card_gateway?: string;
  };
}

// ============================================================================
// SERVER DATA SNAPSHOT (Immutable after load)
// ============================================================================

export interface ServerDataSnapshot {
  product: MachineProduct | null;
  general: GeneralFormData;
  upsell: UpsellSettings;
  affiliateSettings: AffiliateSettings | null;
  offers: MachineOffer[];
  checkoutSettings: CheckoutSettingsFormData;
}

// ============================================================================
// EDITED DATA (Mutable via events)
// ============================================================================

export interface EditedFormData {
  general: GeneralFormData;
  image: ImageFormState;
  offers: OffersFormState;
  upsell: UpsellSettings;
  affiliate: AffiliateSettings | null;
  checkoutSettings: CheckoutSettingsFormData;
}

// ============================================================================
// ENTITIES (Read-only, populated from BFF)
// ============================================================================

export interface ProductEntities {
  orderBumps: MachineOrderBump[];
  checkouts: MachineCheckout[];
  paymentLinks: MachinePaymentLink[];
  coupons: MachineCoupon[];
}

// ============================================================================
// MAPPED DATA (Output from useProductDataMapper)
// ============================================================================

export interface MappedProductData {
  product: MachineProduct;
  upsellSettings: UpsellSettings;
  affiliateSettings: AffiliateSettings | null;
  offers: MachineOffer[];
  orderBumps: MachineOrderBump[];
  checkouts: MachineCheckout[];
  paymentLinks: MachinePaymentLink[];
  coupons: MachineCoupon[];
}

// ============================================================================
// MACHINE CONTEXT (Internal state)
// ============================================================================

export interface ProductFormContext {
  // Dados originais do servidor (imutáveis até novo load)
  serverData: ServerDataSnapshot;
  
  // Dados editados pelo usuário
  editedData: EditedFormData;
  
  // Entidades relacionadas (read-only, vêm do BFF)
  entities: ProductEntities;
  
  // Credenciais de gateway (carregadas separadamente)
  checkoutCredentials: GatewayCredentials;
  
  // Metadados
  productId: string | null;
  userId: string | undefined;
  
  // Erros
  validationErrors: ValidationErrors;
  saveError: string | null;
  loadError: string | null;
  
  // Timestamps para controle
  lastLoadedAt: number | null;
  lastSavedAt: number | null;
  
  // Tab ativa (para UI)
  activeTab: string;
  
  // Tab errors (para validação global)
  tabErrors: Record<string, string[]>;
  
  // Flag de checkout settings inicializadas
  isCheckoutSettingsInitialized: boolean;
}

// ============================================================================
// EVENTS (User/System actions)
// ============================================================================

// Lifecycle events
export type LoadDataEvent = { type: "LOAD_DATA"; productId: string; userId?: string };
export type ReceiveDataEvent = { type: "RECEIVE_DATA"; data: MappedProductData };
export type LoadErrorEvent = { type: "LOAD_ERROR"; error: string };

// Edit events - General
export type EditGeneralEvent = { type: "EDIT_GENERAL"; payload: Partial<GeneralFormData> };

// Edit events - Image
export type EditImageEvent = { type: "EDIT_IMAGE"; payload: Partial<ImageFormState> };

// Edit events - Offers
export type EditOffersEvent = { type: "EDIT_OFFERS"; payload: Partial<OffersFormState> };
export type AddDeletedOfferEvent = { type: "ADD_DELETED_OFFER"; offerId: string };

// Edit events - Settings
export type EditUpsellEvent = { type: "EDIT_UPSELL"; payload: Partial<UpsellSettings> };
export type EditAffiliateEvent = { type: "EDIT_AFFILIATE"; payload: Partial<AffiliateSettings> };
export type EditCheckoutSettingsEvent = { type: "EDIT_CHECKOUT_SETTINGS"; payload: Partial<CheckoutSettingsFormData> };
export type InitCheckoutSettingsEvent = { type: "INIT_CHECKOUT_SETTINGS"; settings: CheckoutSettingsFormData; credentials: GatewayCredentials };

// Save events
export type SaveAllEvent = { type: "SAVE_ALL" };
export type SaveSuccessEvent = { type: "SAVE_SUCCESS" };
export type SaveErrorEvent = { type: "SAVE_ERROR"; error: string };

// Discard events
export type DiscardChangesEvent = { type: "DISCARD_CHANGES" };

// Refresh events
export type RefreshEvent = { type: "REFRESH" };

// Navigation events
export type AttemptNavigationEvent = { type: "ATTEMPT_NAVIGATION"; to: string };
export type ConfirmNavigationEvent = { type: "CONFIRM_NAVIGATION" };
export type CancelNavigationEvent = { type: "CANCEL_NAVIGATION" };

// Validation events
export type ValidateEvent = { type: "VALIDATE" };
export type SetValidationErrorEvent = { type: "SET_VALIDATION_ERROR"; section: keyof ValidationErrors; field: string; error: string };
export type ClearValidationErrorsEvent = { type: "CLEAR_VALIDATION_ERRORS" };

// Tab events
export type SetTabEvent = { type: "SET_TAB"; tab: string };
export type SetTabErrorsEvent = { type: "SET_TAB_ERRORS"; errors: Record<string, string[]> };
export type ClearTabErrorsEvent = { type: "CLEAR_TAB_ERRORS" };

// Union type of all events
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
  | AttemptNavigationEvent
  | ConfirmNavigationEvent
  | CancelNavigationEvent
  | ValidateEvent
  | SetValidationErrorEvent
  | ClearValidationErrorsEvent
  | SetTabEvent
  | SetTabErrorsEvent
  | ClearTabErrorsEvent;

// ============================================================================
// ACTOR INPUT TYPES
// ============================================================================

export interface LoadProductInput {
  productId: string | null;
  userId: string | undefined;
}

export interface SaveAllInput {
  context: ProductFormContext;
  handlers: SaveHandlerRegistry;
}

export interface SaveHandlerRegistry {
  executeAll: () => Promise<{ success: boolean; failedTabs: string[] }>;
}

// ============================================================================
// COMPUTED VALUES (Derived from context)
// ============================================================================

export interface ComputedValues {
  isDirty: boolean;
  dirtyFlags: {
    general: boolean;
    image: boolean;
    offers: boolean;
    upsell: boolean;
    affiliate: boolean;
    checkoutSettings: boolean;
  };
  isValid: boolean;
  canSave: boolean;
}
