/**
 * Shared Test Infrastructure for affiliation-public
 * 
 * @module affiliation-public/tests/_shared
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { getTestConfig, skipIntegration, integrationTestOptions } from "../../_shared/testing/mod.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "affiliation-public";

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
