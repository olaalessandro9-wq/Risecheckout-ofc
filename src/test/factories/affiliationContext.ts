/**
 * Affiliation Context Test Factories
 * 
 * Type-safe factory functions for mocking AffiliationContext and related types.
 * 
 * @module test/factories/affiliationContext
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import type { AffiliationDetails, OtherProducerProduct } from "@/hooks/useAffiliationDetails";
import type { AffiliationTabId } from "@/modules/affiliation/machines";

// ============================================================================
// AFFILIATION CONTEXT VALUE TYPE (inferred from AffiliationContext.tsx)
// ============================================================================

export interface AffiliationContextValue {
  // State
  state: "idle" | "loading" | "ready" | "error";
  activeTab: AffiliationTabId;
  tabErrors: Partial<Record<AffiliationTabId, boolean>>;
  
  // Data
  affiliation: AffiliationDetails | null;
  otherProducts: OtherProducerProduct[];
  isLoading: boolean;
  error: string | null;
  affiliationId: string | undefined;
  
  // Actions
  setActiveTab: (tab: AffiliationTabId) => void;
  setTabError: (tab: AffiliationTabId, hasError: boolean) => void;
  clearTabErrors: () => void;
  refetch: () => Promise<void>;
}

// ============================================================================
// AFFILIATION DETAILS FACTORY
// ============================================================================

export function createMockAffiliationDetails(
  overrides?: Partial<AffiliationDetails>
): AffiliationDetails {
  return {
    id: "affiliation-123",
    affiliate_code: "AFF-TEST",
    commission_rate: 10,
    status: "approved",
    total_sales_count: 0,
    total_sales_amount: 0,
    created_at: new Date().toISOString(),
    product: {
      id: "product-123",
      name: "Test Product",
      description: "Test Description",
      image_url: null,
      price: 9900,
      marketplace_description: null,
      marketplace_rules: null,
      marketplace_category: null,
      user_id: "vendor-123",
      affiliate_settings: {
        enabled: true,
        defaultRate: 10,
      },
    },
    offers: [],
    checkouts: [],
    producer: {
      id: "vendor-123",
      name: "Test Vendor",
    },
    pixels: [],
    pix_gateway: null,
    credit_card_gateway: null,
    allowed_gateways: {
      pix_allowed: [],
      credit_card_allowed: [],
      require_gateway_connection: false,
    },
    ...overrides,
  };
}

// ============================================================================
// OTHER PRODUCER PRODUCT FACTORY
// ============================================================================

export function createMockOtherProducerProduct(
  overrides?: Partial<OtherProducerProduct>
): OtherProducerProduct {
  return {
    id: "other-product-123",
    name: "Other Product",
    image_url: null,
    price: 4900,
    commission_percentage: null,
    ...overrides,
  };
}

// ============================================================================
// AFFILIATION CONTEXT VALUE FACTORY
// ============================================================================

export function createMockAffiliationContextValue(
  overrides?: Partial<AffiliationContextValue>
): AffiliationContextValue {
  return {
    // State
    state: "ready",
    activeTab: "gateways",
    tabErrors: {},
    
    // Data
    affiliation: createMockAffiliationDetails(),
    otherProducts: [],
    isLoading: false,
    error: null,
    affiliationId: "affiliation-123",
    
    // Actions
    setActiveTab: vi.fn(),
    setTabError: vi.fn(),
    clearTabErrors: vi.fn(),
    refetch: vi.fn().mockResolvedValue(undefined),
    
    ...overrides,
  };
}

// ============================================================================
// AFFILIATION MACHINE CONTEXT FACTORY
// ============================================================================

export interface AffiliationMachineContext {
  affiliationId: string | null;
  affiliation: AffiliationDetails | null;
  otherProducts: OtherProducerProduct[];
  activeTab: AffiliationTabId;
  tabErrors: Partial<Record<AffiliationTabId, boolean>>;
  loadError: string | null;
}

export function createMockAffiliationMachineContext(
  overrides?: Partial<AffiliationMachineContext>
): AffiliationMachineContext {
  return {
    affiliationId: "affiliation-123",
    affiliation: createMockAffiliationDetails(),
    otherProducts: [],
    activeTab: "gateways",
    tabErrors: {},
    loadError: null,
    ...overrides,
  };
}

// ============================================================================
// AFFILIATION MACHINE SNAPSHOT FACTORY
// ============================================================================

export interface MockAffiliationSnapshot {
  context: AffiliationMachineContext;
  value: string | Record<string, unknown>;
  matches: (state: string) => boolean;
  can: (event: { type: string }) => boolean;
  status: "active" | "done" | "error" | "stopped";
}

export function createMockAffiliationSnapshot(
  context?: Partial<AffiliationMachineContext>,
  stateValue: string | Record<string, unknown> = "ready"
): MockAffiliationSnapshot {
  const fullContext = createMockAffiliationMachineContext(context);
  
  return {
    context: fullContext,
    value: stateValue,
    matches: vi.fn((state: string) => {
      if (typeof stateValue === "string") {
        return state === stateValue;
      }
      return Object.keys(stateValue).includes(state);
    }),
    can: vi.fn(() => true),
    status: "active",
  };
}
