/**
 * Shared Test Infrastructure for get-my-affiliations
 * 
 * @module get-my-affiliations/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "get-my-affiliations";

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

export interface PaginationPayload {
  page?: number;
  limit?: number;
}

export function createPayload(overrides: Partial<PaginationPayload> = {}): PaginationPayload {
  return { ...overrides };
}

export function createMockRequest(payload: PaginationPayload = {}): Request {
  return new Request(getFunctionUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
