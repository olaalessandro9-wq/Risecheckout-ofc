/**
 * @file _test-helpers.ts
 * @description Test helpers for Google Ads tests
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import type { GoogleAdsIntegration } from "../types";

export function createMockIntegration(
  overrides?: Partial<GoogleAdsIntegration>
): GoogleAdsIntegration {
  return {
    config: {
      conversion_id: "AW-123456789",
      conversion_label: "test_label",
    },
    active: true,
    integration_type: "GOOGLE_ADS",
    vendor_id: "vendor_123",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

export function cleanupGoogleAdsGlobals() {
  document.querySelectorAll('script[src*="googletagmanager"]').forEach((s) => s.remove());
  delete (window as Record<string, unknown>).gtag;
  delete (window as Record<string, unknown>).dataLayer;
}
