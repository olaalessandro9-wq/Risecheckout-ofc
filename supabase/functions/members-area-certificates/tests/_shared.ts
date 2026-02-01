/**
 * Shared Test Infrastructure for members-area-certificates
 * 
 * @module members-area-certificates/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "members-area-certificates";

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
