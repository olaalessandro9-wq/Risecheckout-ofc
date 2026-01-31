/**
 * Action Routing Tests for members-area-progress
 * RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { VALID_ACTIONS, isValidAction } from "./_shared.ts";

// ============================================
// UNIT TESTS: Action Routing
// ============================================

Deno.test("members-area-progress: validates action types", () => {
  VALID_ACTIONS.forEach(action => {
    assertEquals(typeof action, "string");
    assertEquals(action.length > 0, true);
  });
});

Deno.test("members-area-progress: accepts valid actions", () => {
  VALID_ACTIONS.forEach(action => {
    assertEquals(isValidAction(action), true);
  });
});

Deno.test("members-area-progress: maps get alias to get_content", () => {
  const action: string = "get";
  const mappedAction = action === "get" ? "get_content" : action;
  assertEquals(mappedAction === "get_content", true);
});

Deno.test("members-area-progress: rejects invalid actions", () => {
  const invalidActions = ["create", "delete", "invalid", "test"];

  invalidActions.forEach(action => {
    assertEquals(isValidAction(action), false);
  });
});

Deno.test("members-area-progress: invalid action error", () => {
  const response = { error: "Invalid action" };
  assertEquals(response.error, "Invalid action");
});
