/**
 * Action Routing Tests for students-invite
 * RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { VALID_ACTIONS, isValidAction } from "./_shared.ts";

// ============================================
// UNIT TESTS: Action Routing
// ============================================

Deno.test("students-invite: validates action types", () => {
  VALID_ACTIONS.forEach(action => {
    assertEquals(typeof action, "string");
    assertEquals(action.length > 0, true);
  });
});

Deno.test("students-invite: accepts valid actions", () => {
  VALID_ACTIONS.forEach(action => {
    assertEquals(isValidAction(action), true);
  });
});

Deno.test("students-invite: rejects invalid action", () => {
  const invalidActions = ["invalid", "test", "create", "delete"];

  invalidActions.forEach(action => {
    assertEquals(isValidAction(action), false);
  });
});
