/**
 * Shared Test Infrastructure for vault-save
 * 
 * @module vault-save/tests/_shared
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 * RISE Protocol V3 Compliant
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "vault-save";

// ============================================================================
// TYPES
// ============================================================================

export interface VaultPayload {
  key?: string;
  value?: string;
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export function createMockRequest(body: VaultPayload): Request {
  const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}`;
  return new Request(url, {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
      "Authorization": "Bearer mock-token",
    }),
    body: JSON.stringify(body),
  });
}
