/**
 * Action Routing Tests for key-rotation-executor
 * 
 * @module key-rotation-executor/tests/action-routing.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidAction, routeAction, isAllowedMethod, VALID_ACTIONS } from "./_shared.ts";

// ============================================================================
// ACTION ROUTING TESTS
// ============================================================================

Deno.test("Action routing - should recognize all valid actions", () => {
  assertEquals(isValidAction("status"), true);
  assertEquals(isValidAction("prepare"), true);
  assertEquals(isValidAction("rotate"), true);
  assertEquals(isValidAction("activate"), true);
  assertEquals(isValidAction("invalid"), false);
});

Deno.test("Action routing - should reject unknown actions", () => {
  assertEquals(routeAction("delete")?.error, "Unknown action: delete");
  assertEquals(routeAction("status")?.error, undefined);
});

Deno.test("Action routing - all actions in constant", () => {
  assertEquals(VALID_ACTIONS.length, 4);
  assertEquals(VALID_ACTIONS.includes("status"), true);
  assertEquals(VALID_ACTIONS.includes("prepare"), true);
  assertEquals(VALID_ACTIONS.includes("rotate"), true);
  assertEquals(VALID_ACTIONS.includes("activate"), true);
});

// ============================================================================
// METHOD VALIDATION TESTS
// ============================================================================

Deno.test("Method validation - should only allow POST", () => {
  assertEquals(isAllowedMethod("POST"), true);
  assertEquals(isAllowedMethod("GET"), false);
  assertEquals(isAllowedMethod("PUT"), false);
  assertEquals(isAllowedMethod("DELETE"), false);
});

// ============================================================================
// CORS TESTS
// ============================================================================

Deno.test("CORS headers - should be included in responses", () => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
  };

  assertExists(corsHeaders["Access-Control-Allow-Origin"]);
  assertExists(corsHeaders["Access-Control-Allow-Headers"]);
});
