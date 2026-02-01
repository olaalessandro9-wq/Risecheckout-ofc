/**
 * Shared Test Infrastructure for update-affiliate-settings
 * 
 * @module update-affiliate-settings/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "update-affiliate-settings";

export interface TestConfig {
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
}

export function getTestConfig(): TestConfig {
  return {
    supabaseUrl: Deno.env.get("VITE_SUPABASE_URL"),
    supabaseAnonKey: Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY"),
  };
}

export function getFunctionUrl(): string {
  const config = getTestConfig();
  return config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
    : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;
}

// ============================================================================
// INTEGRATION TEST HELPERS
// ============================================================================

export function skipIntegration(): boolean {
  const config = getTestConfig();
  return !config.supabaseUrl || !config.supabaseAnonKey;
}

export const integrationTestOptions = {
  sanitizeOps: false,
  sanitizeResources: false,
};

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
