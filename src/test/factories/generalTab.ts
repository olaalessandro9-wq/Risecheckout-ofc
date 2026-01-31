/**
 * GeneralTab Component Test Factories
 * 
 * Type-safe factories for GeneralTab component tests.
 * These factories provide complete mock return types that match the useGeneralTab hook.
 * 
 * @module test/factories/generalTab
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import type { ImageFormState, GeneralFormData, DeliveryType } from "@/modules/products/types/formData.types";

// ============================================================================
// Types - Matching useGeneralTab return type
// ============================================================================

export interface UseGeneralTabReturn {
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
  form: GeneralFormData;
  setForm: (form: GeneralFormData | ((prev: GeneralFormData) => GeneralFormData)) => void;
  errors: Record<string, string>;
  clearError: (field: string) => void;
  image: ImageFormState | null;
  localOffers: Array<{ id: string; name: string; price: number }>;
  memberGroups: Array<{ id: string; name: string }>;
  hasMembersArea: boolean;
  hasChanges?: boolean;
  handleImageFileChange: (file: File | null) => void;
  handleImageUrlChange: (url: string) => void;
  handleRemoveImage: () => void;
  handleOffersChange: (offers: Array<{ id: string; name: string; price: number }>) => void;
  handleOffersModifiedChange: (modified: boolean) => void;
  handleOfferDeleted: (offerId: string) => void;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a mock product for GeneralTab tests
 */
export function createMockGeneralTabProduct(
  overrides?: Partial<NonNullable<UseGeneralTabReturn["product"]>>
): NonNullable<UseGeneralTabReturn["product"]> {
  return {
    id: "product-123",
    name: "Test Product",
    description: "Test Description",
    price: 9900,
    image_url: "https://example.com/image.jpg",
    support_name: "Support Team",
    support_email: "support@example.com",
    delivery_url: "https://example.com/delivery",
    delivery_type: "url",
    members_area_enabled: false,
    ...overrides,
  };
}

/**
 * Creates a mock form data for GeneralTab tests
 */
export function createMockGeneralTabForm(
  overrides?: Partial<GeneralFormData>
): GeneralFormData {
  return {
    name: "Test Product",
    description: "Test Description",
    price: 9900,
    support_name: "Support Team",
    support_email: "support@example.com",
    delivery_url: "https://example.com/delivery",
    delivery_type: "standard" as DeliveryType,
    external_delivery: false,
    ...overrides,
  };
}

/**
 * Creates a complete mock return value for useGeneralTab
 */
export function createMockUseGeneralTabReturn(
  overrides?: Partial<UseGeneralTabReturn>
): UseGeneralTabReturn {
  const product = createMockGeneralTabProduct();
  const form = createMockGeneralTabForm();

  return {
    product,
    form,
    setForm: vi.fn(),
    errors: {},
    clearError: vi.fn(),
    image: null,
    localOffers: [],
    memberGroups: [],
    hasMembersArea: false,
    hasChanges: false,
    handleImageFileChange: vi.fn(),
    handleImageUrlChange: vi.fn(),
    handleRemoveImage: vi.fn(),
    handleOffersChange: vi.fn(),
    handleOffersModifiedChange: vi.fn(),
    handleOfferDeleted: vi.fn(),
    ...overrides,
  };
}
