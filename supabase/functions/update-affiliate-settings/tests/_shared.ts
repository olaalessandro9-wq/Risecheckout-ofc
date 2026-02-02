/**
 * Shared Test Infrastructure for update-affiliate-settings
 * 
 * @module update-affiliate-settings/tests/_shared
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { getTestConfig, skipIntegration, integrationTestOptions } from "../../_shared/testing/mod.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "update-affiliate-settings";

const config = getTestConfig();

export function getFunctionUrl(): string {
  return config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
    : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;
}

// ============================================================================
// RE-EXPORT CENTRALIZED TEST HELPERS
// ============================================================================

export { skipIntegration, integrationTestOptions };

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export interface AffiliateSettingsPayload {
  product_id: string;
  enabled?: boolean;
  requireApproval?: boolean;
  defaultRate?: number;
}

export function createSettingsPayload(
  overrides: Partial<AffiliateSettingsPayload> = {}
): AffiliateSettingsPayload {
  return {
    product_id: "test-product-id",
    ...overrides,
  };
}

export function createMockRequest(payload: AffiliateSettingsPayload): Request {
  return new Request(getFunctionUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const VALID_DEFAULT_RATES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90] as const;
export type ValidDefaultRate = typeof VALID_DEFAULT_RATES[number];

export function isValidDefaultRate(rate: number): rate is ValidDefaultRate {
  return rate >= 0 && rate <= 90;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validatePayload(payload: Partial<AffiliateSettingsPayload>): {
  valid: boolean;
  error?: string;
} {
  if (!payload.product_id) {
    return { valid: false, error: "product_id is required" };
  }
  
  if (payload.defaultRate !== undefined) {
    if (payload.defaultRate < 0 || payload.defaultRate > 90) {
      return { valid: false, error: "defaultRate must be between 0 and 90" };
    }
  }
  
  return { valid: true };
}
