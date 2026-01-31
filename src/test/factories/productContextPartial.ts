/**
 * Product Context Partial Mocks
 * 
 * Type-safe partial mock factories for hooks that consume only
 * a subset of ProductContext values.
 * 
 * These factories are specifically designed for mocking vi.mocked()
 * return values in tests where the full context is not needed.
 * 
 * @module test/factories/productContextPartial
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import type { GeneralFormData, FormValidationErrors, DeliveryType, ImageFormState } from "@/modules/products/types/formData.types";
import type { AffiliateSettings, Offer as ProductOffer } from "@/modules/products/types/product.types";
import type { ProductFormEvent } from "@/modules/products/machines";
import type { MemberGroupOption, Offer as OffersManagerOffer } from "@/components/products/offers-manager/types";

// ============================================================================
// useGeneralTab Mock Type
// ============================================================================

/**
 * Subset of ProductContext used by useGeneralTab
 */
export interface UseGeneralTabContextMock {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    image_url?: string | null;
    support_name?: string | null;
    support_email?: string | null;
    delivery_url?: string | null;
    delivery_type?: string | null;
    members_area_enabled?: boolean;
  } | null;
  formState: {
    serverData: {
      general: GeneralFormData;
    };
    editedData: {
      general: GeneralFormData;
    };
  };
  dispatchForm: (event: ProductFormEvent) => void;
  formErrors: FormValidationErrors;
}

export function createMockUseGeneralTabContext(
  overrides?: Partial<UseGeneralTabContextMock>
): UseGeneralTabContextMock {
  const defaultGeneralData: GeneralFormData = {
    name: "Test Product",
    description: "Test Description",
    price: 99.99,
    support_name: "Support Team",
    support_email: "support@example.com",
    delivery_url: "https://example.com/delivery",
    delivery_type: "standard" as DeliveryType,
    external_delivery: false,
  };

  return {
    product: {
      id: "test-product-id",
      name: "Test Product",
      description: "Test Description",
      price: 99.99,
      image_url: "https://example.com/image.jpg",
      support_name: "Support Team",
      support_email: "support@example.com",
      delivery_url: "https://example.com/delivery",
      delivery_type: "url",
      members_area_enabled: false,
    },
    formState: {
      serverData: {
        general: { ...defaultGeneralData },
      },
      editedData: {
        general: { ...defaultGeneralData },
      },
    },
    dispatchForm: vi.fn(),
    formErrors: {
      general: {},
      upsell: {},
      affiliate: {},
      checkoutSettings: {},
    },
    ...overrides,
  };
}

// ============================================================================
// useAffiliatesTab Mock Type
// ============================================================================

/**
 * Subset of ProductContext used by useAffiliatesTab
 */
export interface UseAffiliatesTabContextMock {
  product: {
    id: string;
    name: string;
  } | null;
  formState: {
    serverData: {
      affiliateSettings: AffiliateSettings;
    };
    editedData: {
      affiliate: AffiliateSettings;
    };
    dirtyFlags: {
      affiliate: boolean;
    };
  };
  dispatchForm: (event: ProductFormEvent) => void;
  saveAffiliateSettings: () => Promise<void>;
  saving: boolean;
}

export function createMockUseAffiliatesTabContext(
  overrides?: Partial<UseAffiliatesTabContextMock>
): UseAffiliatesTabContextMock {
  const defaultAffiliateSettings: AffiliateSettings = {
    enabled: false,
    defaultRate: 30,
    cookieDuration: 30,
    attributionModel: "last_click",
    requireApproval: true,
    commissionOnOrderBump: false,
    commissionOnUpsell: false,
    supportEmail: "",
    publicDescription: "",
    showInMarketplace: false,
    marketplaceDescription: "",
    marketplaceCategory: "",
  };

  return {
    product: {
      id: "test-product-id",
      name: "Test Product",
    },
    formState: {
      serverData: {
        affiliateSettings: { ...defaultAffiliateSettings },
      },
      editedData: {
        affiliate: { ...defaultAffiliateSettings },
      },
      dirtyFlags: {
        affiliate: false,
      },
    },
    dispatchForm: vi.fn(),
    saveAffiliateSettings: vi.fn().mockResolvedValue(undefined),
    saving: false,
    ...overrides,
  };
}

// ============================================================================
// useGeneralTabImage Mock Type
// ============================================================================

export interface UseGeneralTabImageMock {
  image: ImageFormState;
  handleImageFileChange: (file: File | null) => void;
  handleImageUrlChange: (url: string) => void;
  handleRemoveImage: () => void;
  resetImage: () => void;
}

export function createMockUseGeneralTabImage(
  overrides?: Partial<UseGeneralTabImageMock>
): UseGeneralTabImageMock {
  return {
    image: {
      imageFile: null,
      imageUrl: "",
      pendingRemoval: false,
    },
    handleImageFileChange: vi.fn(),
    handleImageUrlChange: vi.fn(),
    handleRemoveImage: vi.fn(),
    resetImage: vi.fn(),
    ...overrides,
  };
}

// ============================================================================
// useGeneralTabOffers Mock Type
// ============================================================================

export interface UseGeneralTabOffersMock {
  localOffers: ProductOffer[];
  offersModified: boolean;
  deletedOfferIds: string[];
  handleOffersChange: (offers: ProductOffer[]) => void;
  handleOffersModifiedChange: (modified: boolean) => void;
  handleOfferDeleted: (offerId: string) => void;
  resetOffers: () => void;
}

export function createMockUseGeneralTabOffers(
  overrides?: Partial<UseGeneralTabOffersMock>
): UseGeneralTabOffersMock {
  return {
    localOffers: [],
    offersModified: false,
    deletedOfferIds: [],
    handleOffersChange: vi.fn(),
    handleOffersModifiedChange: vi.fn(),
    handleOfferDeleted: vi.fn(),
    resetOffers: vi.fn(),
    ...overrides,
  };
}

/**
 * Creates a mock offer for testing (from productContextPartial)
 */
export function createMockProductOffer(overrides?: Partial<ProductOffer>): ProductOffer {
  return {
    id: "offer-1",
    product_id: "test-product-id",
    name: "Test Offer",
    price: 4999,
    is_default: false,
    ...overrides,
  };
}

// ============================================================================
// useGeneralTabMemberGroups Mock Type
// ============================================================================

export interface UseGeneralTabMemberGroupsMock {
  memberGroups: MemberGroupOption[];
  hasMembersArea: boolean;
}

export function createMockUseGeneralTabMemberGroups(
  overrides?: Partial<UseGeneralTabMemberGroupsMock>
): UseGeneralTabMemberGroupsMock {
  return {
    memberGroups: [],
    hasMembersArea: false,
    ...overrides,
  };
}

/**
 * Creates a mock member group for testing
 */
export function createMockMemberGroup(overrides?: Partial<MemberGroupOption>): MemberGroupOption {
  return {
    id: "group-1",
    name: "Test Group",
    is_default: false,
    ...overrides,
  };
}
