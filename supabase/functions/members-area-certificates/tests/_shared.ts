/**
 * Shared Test Infrastructure for members-area-certificates
 * 
 * @module members-area-certificates/tests/_shared
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { getTestConfig, skipIntegration, integrationTestOptions } from "../../_shared/testing/mod.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "members-area-certificates";

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
// VALID ACTIONS
// ============================================================================

export const VALID_ACTIONS = [
  "list-templates",
  "get-template",
  "create-template",
  "update-template",
  "delete-template",
  "generate",
  "verify",
  "list-buyer-certificates",
] as const;

export type ValidAction = typeof VALID_ACTIONS[number];

export function isValidAction(action: string): action is ValidAction {
  return (VALID_ACTIONS as readonly string[]).includes(action);
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export interface CertificatePayload {
  action: string;
  product_id?: string;
  template_id?: string;
  verification_code?: string;
  data?: Record<string, unknown>;
}

export function createPayload(
  action: ValidAction,
  overrides: Partial<CertificatePayload> = {}
): CertificatePayload {
  return {
    action,
    ...overrides,
  };
}

export function createMockRequest(payload: CertificatePayload): Request {
  return new Request(getFunctionUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
