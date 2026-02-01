/**
 * Shared Test Infrastructure for manage-user-role
 * 
 * @module manage-user-role/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "manage-user-role";

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
