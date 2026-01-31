/**
 * @file _shared.ts
 * @description Shared test utilities for ProductDetails components
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { vi } from "vitest";
import type { MockAffiliationStatus, MockOffer } from "./_fixtures";

// ============================================================================
// MOCK HOOKS
// ============================================================================

/**
 * Mock for useAffiliateRequest hook
 */
export function createMockUseAffiliateRequest(overrides = {}) {
  return {
    requestAffiliate: vi.fn(),
    isLoading: false,
    error: null,
    success: null,
    ...overrides,
  };
}

/**
 * Mock for useAffiliationStatusCache hook
 */
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

/**
 * Mock for useProductOffers hook
 */
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

/**
 * Mock for useOwnerCheck hook
 */
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

/**
 * Setup mocks for all ProductDetails hooks
 */
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

/**
 * Cleanup all mocks
 */
export function cleanupProductDetailsHookMocks() {
  vi.clearAllMocks();
  vi.resetModules();
}

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Simulate user clicking a button
 */
export async function clickButton(buttonText: string, container: HTMLElement) {
  const { fireEvent } = await import("@testing-library/react");
  const button = container.querySelector(`button:has-text("${buttonText}")`);
  if (button) {
    fireEvent.click(button);
  }
}
