/**
 * Shared Test Infrastructure for get-pix-status
 * 
 * @module get-pix-status/tests/_shared
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { getTestConfig, skipIntegration, integrationTestOptions } from "../../_shared/testing/mod.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "get-pix-status";

const config = getTestConfig();

export function getFunctionUrl(transactionId?: string): string {
  const baseUrl = config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
    : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;
  
  if (transactionId === undefined) {
    return baseUrl;
  }
  return `${baseUrl}?transactionId=${transactionId}`;
}

// ============================================================================
// RE-EXPORT CENTRALIZED TEST HELPERS
// ============================================================================

export { skipIntegration, integrationTestOptions };
