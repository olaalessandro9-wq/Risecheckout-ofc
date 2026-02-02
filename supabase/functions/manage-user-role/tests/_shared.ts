/**
 * Shared Test Infrastructure for manage-user-role
 * 
 * @module manage-user-role/tests/_shared
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { getTestConfig, skipIntegration, integrationTestOptions } from "../../_shared/testing/mod.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "manage-user-role";

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
// VALID ROLES
// ============================================================================

export const VALID_ROLES = ["admin", "owner", "producer", "buyer", "affiliate"] as const;
export type ValidRole = typeof VALID_ROLES[number];

export function isValidRole(role: string): role is ValidRole {
  return (VALID_ROLES as readonly string[]).includes(role);
}

// ============================================================================
// ADMIN ROLES
// ============================================================================

export const ADMIN_ROLES = ["admin", "owner"] as const;
export type AdminRole = typeof ADMIN_ROLES[number];

export function isAdminRole(role: string): role is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

// ============================================================================
// REQUIRED FIELDS
// ============================================================================

export const REQUIRED_FIELDS = ["userId", "role"] as const;
export type RequiredField = typeof REQUIRED_FIELDS[number];

export function hasRequiredField(field: string): field is RequiredField {
  return (REQUIRED_FIELDS as readonly string[]).includes(field);
}

// ============================================================================
// TABLE NAMES
// ============================================================================

export const TABLE_NAME = "user_roles";

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export interface RolePayload {
  userId?: string;
  role?: string;
}

export function createPayload(overrides: Partial<RolePayload> = {}): RolePayload {
  return {
    userId: "test-user-id",
    role: "producer",
    ...overrides,
  };
}

export function createMockRequest(payload: RolePayload): Request {
  return new Request(getFunctionUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
