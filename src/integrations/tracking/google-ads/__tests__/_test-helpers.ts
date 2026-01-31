/**
 * @file _test-helpers.ts
 * @description Test helpers for Google Ads tests
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import type { GoogleAdsIntegration, GoogleAdsConfig } from "../types";

export function createMockConfig(
  overrides?: Partial<GoogleAdsConfig>
): GoogleAdsConfig {
  return {
    conversion_id: "AW-123456789",
    conversion_label: "test_label",
    enabled: true,
    ...overrides,
  };
}

export function createMockIntegration(
  overrides?: Partial<GoogleAdsIntegration>
): GoogleAdsIntegration {
  return {
    id: "integration_123",
    config: createMockConfig(overrides?.config),
    active: true,
    vendor_id: "vendor_123",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

export function cleanupGoogleAdsGlobals() {
  document.querySelectorAll('script[src*="googletagmanager"]').forEach((s) => s.remove());
  delete (window as unknown as Record<string, unknown>).gtag;
  delete (window as unknown as Record<string, unknown>).dataLayer;
}
