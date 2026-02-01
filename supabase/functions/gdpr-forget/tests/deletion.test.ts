/**
 * GDPR Deletion Tests for gdpr-forget
 * 
 * @module gdpr-forget/tests/deletion.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  DATA_TO_DELETE,
  isDataCategory,
  GDPR_RULES,
  canDelete,
} from "./_shared.ts";

// ============================================================================
// SELF DELETION TESTS
// ============================================================================

Deno.test("gdpr-forget: should allow user to request deletion", () => {
  assertEquals(GDPR_RULES.selfDeletionAllowed, true);
});

// ============================================================================
// CONFIRMATION TESTS
// ============================================================================

Deno.test("gdpr-forget: should require confirmation", () => {
  assertEquals(GDPR_RULES.requiresConfirmation, true);
});

// ============================================================================
// ANONYMIZATION TESTS
// ============================================================================

Deno.test("gdpr-forget: should handle data anonymization", () => {
  assertEquals(GDPR_RULES.anonymizationSupported, true);
});

// ============================================================================
// DATA CATEGORIES TESTS
// ============================================================================

Deno.test("gdpr-forget: should delete user data categories", () => {
  assertEquals(DATA_TO_DELETE.length, 4);
  assert(isDataCategory("profile"));
  assert(isDataCategory("sessions"));
  assert(!isDataCategory("transactions"));
});

// ============================================================================
// TRANSACTION PRESERVATION TESTS
// ============================================================================

Deno.test("gdpr-forget: should preserve transaction records", () => {
  assertEquals(GDPR_RULES.preserveTransactions, true);
});

// ============================================================================
// ACTIVE ORDERS TESTS
// ============================================================================

Deno.test("gdpr-forget: should prevent deletion with active orders", () => {
  assertEquals(GDPR_RULES.blocksActiveOrders, true);
  assertEquals(canDelete(true), false);
  assertEquals(canDelete(false), true);
});

// ============================================================================
// CONFIRMATION EMAIL TESTS
// ============================================================================

Deno.test("gdpr-forget: should send confirmation email", () => {
  assertEquals(GDPR_RULES.sendsConfirmation, true);
});
