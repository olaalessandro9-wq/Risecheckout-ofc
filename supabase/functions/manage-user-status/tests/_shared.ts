/**
 * Shared Test Infrastructure for manage-user-status
 * 
 * @module manage-user-status/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "manage-user-status";

// ============================================================================
// VALID STATUSES
// ============================================================================

export const VALID_STATUSES = ["active", "inactive", "blocked", "pending"] as const;
export type ValidStatus = typeof VALID_STATUSES[number];

export function isValidStatus(status: string): status is ValidStatus {
  return (VALID_STATUSES as readonly string[]).includes(status);
}

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

export const VALID_TRANSITIONS: Record<ValidStatus, ValidStatus[]> = {
  pending: ["active", "blocked"],
  active: ["inactive", "blocked"],
  inactive: ["active", "blocked"],
  blocked: ["active"],
};

export function canTransition(from: ValidStatus, to: ValidStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
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
// LOGIN PERMISSION LOGIC
// ============================================================================

export function canLogin(status: ValidStatus): boolean {
  return status === "active";
}
