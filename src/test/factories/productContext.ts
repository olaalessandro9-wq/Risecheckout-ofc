/**
 * Product Context Test Factories
 * 
 * Type-safe factory functions for mocking ProductContext and related types.
 * 
 * @module test/factories/productContext
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import type { ProductContextValue } from "@/modules/products/context/ProductContext.types";
import type { ProductFormContext } from "@/modules/products/machines/types/context.types";
import type {
  GeneralFormData,
  ImageFormState,
  CheckoutSettingsFormData,
  GatewayCredentials,
  ServerDataSnapshot,
  EditedFormData,
  OffersFormState,
} from "@/modules/products/types/formData.types";
import type { ProductEntities, ValidationErrors } from "@/modules/products/machines/types/entities.types";
import type { ProductData, Offer, UpsellSettings, AffiliateSettings } from "@/modules/products/types/product.types";
import type { TabValidationMap, TabValidationState } from "@/modules/products/types/tabValidation.types";

// ============================================================================
// FORM DATA FACTORIES
// ============================================================================

export function createMockGeneralFormData(
  overrides?: Partial<GeneralFormData>
): GeneralFormData {
  return {
    name: "Test Product",
    description: "Test Description",
    price: 9900,
    support_name: "Support Team",
    support_email: "support@test.com",
    delivery_url: "https://delivery.test.com",
    external_delivery: false,
    delivery_type: "standard",
    ...overrides,
  };
}

export function createMockImageFormState(
  overrides?: Partial<ImageFormState>
): ImageFormState {
  return {
    imageFile: null,
    imageUrl: "",
    pendingRemoval: false,
    ...overrides,
  };
}

export function createMockCheckoutSettingsFormData(
  overrides?: Partial<CheckoutSettingsFormData>
): CheckoutSettingsFormData {
  return {
    required_fields: {
      name: true,
      email: true,
      phone: false,
      cpf: false,
    },
    default_payment_method: "pix",
    pix_gateway: "mercadopago",
    credit_card_gateway: "mercadopago",
    ...overrides,
  };
}

export function createMockGatewayCredentials(
  overrides?: Partial<GatewayCredentials>
): GatewayCredentials {
  return {
    mercadopago: { configured: false },
    pushinpay: { configured: false },
    stripe: { configured: false },
    asaas: { configured: false },
    ...overrides,
  };
}

export function createMockUpsellSettings(
  overrides?: Partial<UpsellSettings>
): UpsellSettings {
  return {
    hasCustomThankYouPage: false,
    customPageUrl: "",
    redirectIgnoringOrderBumpFailures: false,
    ...overrides,
  };
}

export function createMockAffiliateSettings(
  overrides?: Partial<AffiliateSettings> | null
): AffiliateSettings | null {
  if (overrides === null) return null;
  return {
    enabled: false,
    defaultRate: 10,
    requireApproval: false,
    attributionModel: "last_click",
    cookieDuration: 30,
    supportEmail: "",
    ...overrides,
  };
}

export function createMockOffersFormState(
  overrides?: Partial<OffersFormState>
): OffersFormState {
  return {
    localOffers: [],
    deletedOfferIds: [],
    modified: false,
    ...overrides,
  };
}

// ============================================================================
// PRODUCT DATA FACTORIES
// ============================================================================

export function createMockProductData(
  overrides?: Partial<ProductData>
): ProductData {
  return {
    id: "product-123",
    name: "Test Product",
    description: "Test Description",
    price: 9900,
    image_url: null,
    status: "active",
    support_name: "Support Team",
    support_email: "support@test.com",
    delivery_url: "https://delivery.test.com",
    external_delivery: false,
    delivery_type: "standard",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockOffer(overrides?: Partial<Offer>): Offer {
  return {
    id: "offer-123",
    product_id: "product-123",
    name: "Test Offer",
    price: 4900,
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// SERVER DATA SNAPSHOT FACTORY
// ============================================================================

export function createMockServerDataSnapshot(
  overrides?: Partial<ServerDataSnapshot>
): ServerDataSnapshot {
  return {
    product: createMockProductData(),
    general: createMockGeneralFormData(),
    upsell: createMockUpsellSettings(),
    affiliateSettings: null,
    offers: [],
    checkoutSettings: createMockCheckoutSettingsFormData(),
    ...overrides,
  };
}

// ============================================================================
// EDITED FORM DATA FACTORY
// ============================================================================

export function createMockEditedFormData(
  overrides?: Partial<EditedFormData>
): EditedFormData {
  return {
    general: createMockGeneralFormData(),
    image: createMockImageFormState(),
    offers: createMockOffersFormState(),
    upsell: createMockUpsellSettings(),
    affiliate: null,
    checkoutSettings: createMockCheckoutSettingsFormData(),
    ...overrides,
  };
}

// ============================================================================
// PRODUCT ENTITIES FACTORY
// ============================================================================

export function createMockProductEntities(
  overrides?: Partial<ProductEntities>
): ProductEntities {
  return {
    orderBumps: [],
    checkouts: [],
    paymentLinks: [],
    coupons: [],
    ...overrides,
  };
}

// ============================================================================
// VALIDATION ERRORS FACTORY
// ============================================================================

export function createMockValidationErrors(
  overrides?: Partial<ValidationErrors>
): ValidationErrors {
  return {
    general: {},
    upsell: {},
    affiliate: {},
    checkoutSettings: {},
    ...overrides,
  };
}

// ============================================================================
// TAB VALIDATION STATE FACTORY
// ============================================================================

export function createMockTabValidationState(
  overrides?: Partial<TabValidationState>
): TabValidationState {
  return {
    hasError: false,
    fields: [],
    errors: {},
    ...overrides,
  };
}

export function createMockTabValidationMap(
  overrides?: Partial<TabValidationMap>
): TabValidationMap {
  return {
    ...overrides,
  };
}

// ============================================================================
// PRODUCT FORM CONTEXT FACTORY
// ============================================================================

export function createMockProductFormContext(
  overrides?: Partial<ProductFormContext>
): ProductFormContext {
  return {
    productId: "product-123",
    userId: "user-123",
    serverData: createMockServerDataSnapshot(),
    editedData: createMockEditedFormData(),
    entities: createMockProductEntities(),
    credentials: createMockGatewayCredentials(),
    validationErrors: createMockValidationErrors(),
    saveError: null,
    loadError: null,
    lastLoadedAt: Date.now(),
    lastSavedAt: null,
    activeTab: "general",
    tabErrors: createMockTabValidationMap(),
    isCheckoutSettingsInitialized: false,
    pendingImageUrl: null,
    ...overrides,
  };
}

// ============================================================================
// PRODUCT CONTEXT VALUE FACTORY
// ============================================================================

export function createMockProductContextValue(
  overrides?: Partial<ProductContextValue>
): ProductContextValue {
  const defaultFormState = {
    editedData: createMockEditedFormData(),
    serverData: createMockServerDataSnapshot(),
    isDirty: false,
    validation: createMockValidationErrors(),
    isCheckoutSettingsInitialized: false,
    dirtyFlags: {
      general: false,
      image: false,
      offers: false,
      upsell: false,
      affiliate: false,
      checkoutSettings: false,
    },
  };

  return {
    // Stable Product ID from Route (SSOT)
    productId: "product-123",
    
    // Data from State Machine
    product: createMockProductData(),
    offers: [],
    orderBumps: [],
    checkouts: [],
    paymentLinks: [],
    coupons: [],
    
    // Settings
    upsellSettings: createMockUpsellSettings(),
    affiliateSettings: null,
    
    // State Flags
    loading: false,
    saving: false,
    hasUnsavedChanges: false,
    
    // Form Data
    generalForm: createMockGeneralFormData(),
    imageState: createMockImageFormState(),
    localOffers: [],
    checkoutSettingsForm: createMockCheckoutSettingsFormData(),
    checkoutCredentials: createMockGatewayCredentials(),
    
    // Form Handlers
    updateGeneralField: vi.fn(),
    updateImageState: vi.fn(),
    updateLocalOffers: vi.fn(),
    markOfferDeleted: vi.fn(),
    setOffersModified: vi.fn(),
    updateCheckoutSettingsField: vi.fn(),
    initCheckoutSettings: vi.fn(),
    updateUpsellSettings: vi.fn(),
    updateAffiliateSettings: vi.fn(),
    
    // Save/Refresh
    saveAll: vi.fn().mockResolvedValue(undefined),
    refreshAll: vi.fn().mockResolvedValue(undefined),
    saveProduct: vi.fn().mockResolvedValue(undefined),
    saveUpsellSettings: vi.fn().mockResolvedValue(undefined),
    saveAffiliateSettings: vi.fn().mockResolvedValue(undefined),
    deleteProduct: vi.fn().mockResolvedValue(true),
    
    // Refresh Individual
    refreshProduct: vi.fn().mockResolvedValue(undefined),
    refreshOffers: vi.fn().mockResolvedValue(undefined),
    refreshOrderBumps: vi.fn().mockResolvedValue(undefined),
    refreshCheckouts: vi.fn().mockResolvedValue(undefined),
    refreshCoupons: vi.fn().mockResolvedValue(undefined),
    refreshPaymentLinks: vi.fn().mockResolvedValue(undefined),
    
    // Product Operations
    updateProduct: vi.fn(),
    updateProductBulk: vi.fn(),
    
    // Validation
    formErrors: createMockValidationErrors(),
    validateGeneralForm: vi.fn().mockReturnValue(true),
    
    // Tab Management
    activeTab: "general",
    setActiveTab: vi.fn(),
    tabErrors: createMockTabValidationMap(),
    setTabErrors: vi.fn(),
    clearTabErrors: vi.fn(),
    
    // Save Registry
    registerSaveHandler: vi.fn().mockReturnValue(() => {}),
    
    // Public API
    formState: defaultFormState,
    formDispatch: vi.fn(),
    dispatchForm: vi.fn(),
    
    // State Machine Direct Access
    machineState: "ready",
    send: vi.fn(),
    
    ...overrides,
  };
}
