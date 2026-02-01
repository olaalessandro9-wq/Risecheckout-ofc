/**
 * Status Validation Tests for manage-user-status
 * 
 * @module manage-user-status/tests/status-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  VALID_STATUSES,
  isValidStatus,
  VALID_TRANSITIONS,
  canTransition,
  ADMIN_ROLES,
  isAdminRole,
  canLogin,
} from "./_shared.ts";

// ============================================================================
// VALID STATUSES TESTS
// ============================================================================

Deno.test("manage-user-status: should define valid statuses", () => {
  assertEquals(VALID_STATUSES.length, 4);
  assert(isValidStatus("active"));
  assert(isValidStatus("blocked"));
  assert(!isValidStatus("unknown"));
});

// ============================================================================
// ADMIN PERMISSION TESTS
// ============================================================================

Deno.test("manage-user-status: should require admin permission", () => {
  assertEquals(ADMIN_ROLES.length, 2);
  assert(isAdminRole("admin"));
  assert(isAdminRole("owner"));
  assert(!isAdminRole("buyer"));
});

// ============================================================================
// STATUS TRANSITION TESTS
// ============================================================================

Deno.test("manage-user-status: should validate status transitions", () => {
  assertExists(VALID_TRANSITIONS.active);
  assertExists(VALID_TRANSITIONS.blocked);
  
  // Valid transitions
  assert(canTransition("pending", "active"));
  assert(canTransition("active", "blocked"));
  assert(canTransition("blocked", "active"));
  
  // Invalid transitions
  assert(!canTransition("pending", "inactive"));
});

// ============================================================================
// LOGIN PERMISSION TESTS
// ============================================================================

Deno.test("manage-user-status: should prevent blocked user login", () => {
  assertEquals(canLogin("blocked"), false);
});

Deno.test("manage-user-status: should allow active user login", () => {
  assertEquals(canLogin("active"), true);
});

Deno.test("manage-user-status: should prevent pending user login", () => {
  assertEquals(canLogin("pending"), false);
});

Deno.test("manage-user-status: should prevent inactive user login", () => {
  assertEquals(canLogin("inactive"), false);
});
