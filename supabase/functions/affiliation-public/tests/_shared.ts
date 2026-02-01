/**
 * Shared Test Infrastructure for affiliation-public
 * 
 * @module affiliation-public/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "affiliation-public";

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

export interface PublicAffiliationPayload {
  product_id?: string;
  affiliate_code?: string;
}

export function createPayload(
  productId?: string,
  affiliateCode?: string
): PublicAffiliationPayload {
  const payload: PublicAffiliationPayload = {};
  if (productId !== undefined) payload.product_id = productId;
  if (affiliateCode !== undefined) payload.affiliate_code = affiliateCode;
  return payload;
}

export function createFullPayload(
  productId: string = "test-product-id",
  affiliateCode: string = "test-code"
): PublicAffiliationPayload {
  return { product_id: productId, affiliate_code: affiliateCode };
}

export function createMockRequest(payload: PublicAffiliationPayload): Request {
  return new Request(getFunctionUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
