/**
 * @file _shared.ts
 * @description Shared test utilities for ProductDetails components
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { vi } from "vitest";
import type { MockOffer } from "./_fixtures";

// ============================================================================
// MOCK AFFILIATION STATUS TYPE
// ============================================================================

export interface MockAffiliationStatus {
  isAffiliate: boolean;
  status: "active" | "pending" | "rejected" | null;
  affiliationId: string | null;
}

// ============================================================================
// MOCK HOOKS
// ============================================================================

export function createMockUseAffiliateRequest(overrides = {}) {
  return {
    requestAffiliate: vi.fn(),
    isLoading: false,
    error: null,
    success: null,
    ...overrides,
  };
}

export function createMockUseAffiliationStatusCache(
  status: MockAffiliationStatus | null = null,
  overrides = {}
) {
  return {
    getStatus: vi.fn(() => status),
    isLoaded: true,
    updateStatus: vi.fn(),
    updateTrigger: 0,
    ...overrides,
  };
}

export function createMockUseProductOffers(
  offers: MockOffer[] = [],
  maxCommission = 0,
  overrides = {}
) {
  return {
    offers,
    maxCommission,
    ...overrides,
  };
}

export function createMockUseOwnerCheck(
  isOwner = false,
  checkingOwner = false,
  overrides = {}
) {
  return {
    isOwner,
    checkingOwner,
    ...overrides,
  };
}

// ============================================================================
// MOCK MODULES
// ============================================================================

export function setupProductDetailsHookMocks() {
  vi.mock("@/hooks/useAffiliateRequest", () => ({
    useAffiliateRequest: vi.fn(() => createMockUseAffiliateRequest()),
  }));

  vi.mock("@/hooks/useAffiliationStatusCache", () => ({
    useAffiliationStatusCache: vi.fn(() => createMockUseAffiliationStatusCache()),
  }));

  vi.mock("../hooks/useProductOffers", () => ({
    useProductOffers: vi.fn(() => createMockUseProductOffers()),
  }));

  vi.mock("../hooks/useOwnerCheck", () => ({
    useOwnerCheck: vi.fn(() => createMockUseOwnerCheck()),
  }));
}

export function cleanupProductDetailsHookMocks() {
  vi.clearAllMocks();
  vi.resetModules();
}

// ============================================================================
// TEST HELPERS
// ============================================================================

export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));
