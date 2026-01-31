/**
 * Product Tabs Context Test Factories
 * 
 * Type-safe factories for product tab component tests (Cupons, Checkout, UpsellTab, etc.)
 * 
 * @module test/factories/productTabsContext
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import type { UpsellSettings } from "@/modules/products/types/product.types";

// ============================================================================
// Common Types
// ============================================================================

export interface MockProduct {
  id: string;
  name: string;
  description?: string | null;
  price?: number;
}

// ============================================================================
// CuponsTab Types & Factories
// ============================================================================

export interface CuponsTabContextMock {
  product: MockProduct | null;
  coupons: Array<{
    id: string;
    code: string;
    discount: number;
    discount_type: string;
    startDate: Date | null;
    endDate: Date | null;
    applyToOrderBumps: boolean;
    usageCount: number;
  }>;
  refreshCoupons: () => Promise<void>;
  loading: boolean;
}

export function createMockCuponsTabContext(
  overrides?: Partial<CuponsTabContextMock>
): CuponsTabContextMock {
  return {
    product: {
      id: "product-123",
      name: "Test Product",
    },
    coupons: [],
    refreshCoupons: vi.fn().mockResolvedValue(undefined),
    loading: false,
    ...overrides,
  };
}

export function createMockCoupon(
  overrides?: Partial<CuponsTabContextMock["coupons"][0]>
): CuponsTabContextMock["coupons"][0] {
  return {
    id: "coupon-1",
    code: "SAVE10",
    discount: 10,
    discount_type: "percentage",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    applyToOrderBumps: true,
    usageCount: 5,
    ...overrides,
  };
}

// ============================================================================
// CheckoutTab Types & Factories
// ============================================================================

export interface CheckoutTabContextMock {
  product: MockProduct | null;
  checkouts: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  refreshCheckouts: () => Promise<void>;
}

export function createMockCheckoutTabContext(
  overrides?: Partial<CheckoutTabContextMock>
): CheckoutTabContextMock {
  return {
    product: {
      id: "product-123",
      name: "Test Product",
    },
    checkouts: [],
    refreshCheckouts: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockCheckout(
  overrides?: Partial<CheckoutTabContextMock["checkouts"][0]>
): CheckoutTabContextMock["checkouts"][0] {
  return {
    id: "checkout-1",
    name: "Checkout 1",
    slug: "checkout-1",
    ...overrides,
  };
}

// ============================================================================
// UpsellTab Types & Factories
// ============================================================================

export interface UpsellTabFormState {
  editedData: {
    upsell: UpsellSettings;
  };
  serverData: {
    upsell: UpsellSettings;
  };
}

export interface UpsellTabContextMock {
  product: MockProduct | null;
  formState: UpsellTabFormState;
  dispatchForm: (event: { type: string; payload?: Partial<UpsellSettings> }) => void;
}

export function createMockUpsellTabContext(
  overrides?: Partial<UpsellTabContextMock>
): UpsellTabContextMock {
  const defaultUpsellSettings: UpsellSettings = {
    hasCustomThankYouPage: false,
    customPageUrl: "",
    redirectIgnoringOrderBumpFailures: false,
  };

  return {
    product: {
      id: "product-123",
      name: "Test Product",
    },
    formState: {
      editedData: {
        upsell: { ...defaultUpsellSettings },
      },
      serverData: {
        upsell: { ...defaultUpsellSettings },
      },
    },
    dispatchForm: vi.fn(),
    ...overrides,
  };
}

// ============================================================================
// OrderBumpTab Types & Factories
// ============================================================================

export interface OrderBumpTabContextMock {
  product: MockProduct | null;
  orderBumps: Array<{
    id: string;
    bump_product_id: string;
    name: string;
    price: number;
    image_url: string | null;
  }>;
  refreshOrderBumps: () => Promise<void>;
  loading: boolean;
}

export function createMockOrderBumpTabContext(
  overrides?: Partial<OrderBumpTabContextMock>
): OrderBumpTabContextMock {
  return {
    product: {
      id: "product-123",
      name: "Test Product",
    },
    orderBumps: [],
    refreshOrderBumps: vi.fn().mockResolvedValue(undefined),
    loading: false,
    ...overrides,
  };
}

export function createMockOrderBump(
  overrides?: Partial<OrderBumpTabContextMock["orderBumps"][0]>
): OrderBumpTabContextMock["orderBumps"][0] {
  return {
    id: "bump-1",
    bump_product_id: "product-456",
    name: "Bump Product 1",
    price: 1900,
    image_url: "https://example.com/bump1.jpg",
    ...overrides,
  };
}

// ============================================================================
// MembersAreaTab Types & Factories
// ============================================================================

export interface MembersAreaTabProductContextMock {
  productId: string;
}

export interface MembersAreaTabHookMock {
  isLoading: boolean;
  settings: {
    enabled: boolean;
  };
  modules: Array<{
    id: string;
    name: string;
    contents?: Array<{ id: string; name: string }>;
  }>;
  updateSettings: (enabled: boolean) => Promise<void>;
}

export function createMockMembersAreaTabContext(
  overrides?: Partial<MembersAreaTabProductContextMock>
): MembersAreaTabProductContextMock {
  return {
    productId: "product-123",
    ...overrides,
  };
}

export function createMockMembersAreaTabHook(
  overrides?: Partial<MembersAreaTabHookMock>
): MembersAreaTabHookMock {
  return {
    isLoading: false,
    settings: {
      enabled: false,
    },
    modules: [],
    updateSettings: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ============================================================================
// ConfirmDelete Mock
// ============================================================================

export interface ConfirmDeleteMock {
  confirm: (options: { onConfirm: () => void }) => void;
  Bridge: () => React.ReactNode;
}

export function createMockConfirmDelete(
  overrides?: Partial<ConfirmDeleteMock>
): ConfirmDeleteMock {
  return {
    confirm: vi.fn(),
    Bridge: vi.fn(() => null),
    ...overrides,
  };
}

// ============================================================================
// BusyProvider Mock
// ============================================================================

export interface BusyProviderMock {
  run: <T>(fn: () => Promise<T>) => Promise<T>;
}

export function createMockBusyProvider(
  overrides?: Partial<BusyProviderMock>
): BusyProviderMock {
  return {
    run: vi.fn((fn) => fn()),
    ...overrides,
  };
}
