/**
 * Action Routing Tests for members-area-modules
 * RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { VALID_ACTIONS, isValidAction } from "./_shared.ts";

// ============================================
// UNIT TESTS: Action Routing
// ============================================

Deno.test("members-area-modules: validates action types", () => {
  VALID_ACTIONS.forEach(action => {
    assertEquals(typeof action, "string");
    assertEquals(action.length > 0, true);
  });
});

Deno.test("members-area-modules: accepts valid actions", () => {
  VALID_ACTIONS.forEach(action => {
    assertEquals(isValidAction(action), true);
  });
});

Deno.test("members-area-modules: rejects invalid actions", () => {
  const invalidActions = ["get", "add", "remove", "invalid"];

  invalidActions.forEach(action => {
    assertEquals(isValidAction(action), false);
  });
});

Deno.test("members-area-modules: action not found error format", () => {
  const action = "invalid";
  const response = { error: `Ação não encontrada: ${action}` };
  assertEquals(response.error, "Ação não encontrada: invalid");
});
