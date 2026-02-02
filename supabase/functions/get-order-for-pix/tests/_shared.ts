/**
 * Shared Test Infrastructure for get-order-for-pix
 * 
 * @module get-order-for-pix/tests/_shared
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { getTestConfig, skipIntegration, integrationTestOptions } from "../../_shared/testing/mod.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "get-order-for-pix";

const config = getTestConfig();

export function getFunctionUrl(orderId?: string): string {
  const baseUrl = config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
    : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;
  
  if (orderId === undefined) {
    return baseUrl;
  }
  return `${baseUrl}?orderId=${orderId}`;
}

// ============================================================================
// RE-EXPORT CENTRALIZED TEST HELPERS
// ============================================================================

export { skipIntegration, integrationTestOptions };
