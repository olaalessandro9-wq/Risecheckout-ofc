/**
 * Shared Test Infrastructure for asaas-validate-credentials
 * 
 * @module asaas-validate-credentials/tests/_shared
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { getTestConfig, skipIntegration, integrationTestOptions } from "../../_shared/testing/mod.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "asaas-validate-credentials";

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
// VALID ENVIRONMENTS
// ============================================================================

export const VALID_ENVIRONMENTS = ["sandbox", "production"] as const;
export type ValidEnvironment = typeof VALID_ENVIRONMENTS[number];

export function isValidEnvironment(env: string): env is ValidEnvironment {
  return (VALID_ENVIRONMENTS as readonly string[]).includes(env);
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export interface CredentialsPayload {
  apiKey?: string;
  environment?: string;
}

export function createPayload(overrides: Partial<CredentialsPayload> = {}): CredentialsPayload {
  return {
    apiKey: "test_key_123",
    environment: "sandbox",
    ...overrides,
  };
}

export function createMockRequest(payload: CredentialsPayload): Request {
  return new Request(getFunctionUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
