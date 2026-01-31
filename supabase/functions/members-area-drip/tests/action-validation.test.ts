/**
 * Action Validation Tests for members-area-drip
 * 
 * @module members-area-drip/tests/action-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateDripRequest, requiresProducerAuth, requiresNoAuth } from "./_shared.ts";

// ============================================================================
// ACTION VALIDATION TESTS
// ============================================================================

Deno.test("members-area-drip - Validation - get-settings requires content_id", () => {
  const result = validateDripRequest({ action: "get-settings" });
  assertEquals(result.valid, false);
  assertEquals(result.error, "content_id required");
});

Deno.test("members-area-drip - Validation - update-settings requires content_id and settings", () => {
  const result = validateDripRequest({ 
    action: "update-settings",
    content_id: "c1"
  });
  assertEquals(result.valid, false);
  assertEquals(result.error, "content_id and settings required");
});

Deno.test("members-area-drip - Validation - check-access requires content_id and buyer_id", () => {
  const result = validateDripRequest({ 
    action: "check-access",
    content_id: "c1"
  });
  assertEquals(result.valid, false);
  assertEquals(result.error, "content_id and buyer_id required");
});

Deno.test("members-area-drip - Validation - unlock-content requires content_id and buyer_id", () => {
  const result = validateDripRequest({ 
    action: "unlock-content",
    content_id: "c1"
  });
  assertEquals(result.valid, false);
  assertEquals(result.error, "content_id and buyer_id required");
});

Deno.test("members-area-drip - Validation - valid get-settings request", () => {
  const result = validateDripRequest({ 
    action: "get-settings",
    content_id: "c1"
  });
  assertEquals(result.valid, true);
});

Deno.test("members-area-drip - Validation - valid check-access request", () => {
  const result = validateDripRequest({ 
    action: "check-access",
    content_id: "c1",
    buyer_id: "b1"
  });
  assertEquals(result.valid, true);
});

// ============================================================================
// AUTH REQUIREMENT TESTS
// ============================================================================

Deno.test("members-area-drip - Auth - get-settings requires producer auth", () => {
  assertEquals(requiresProducerAuth("get-settings"), true);
});

Deno.test("members-area-drip - Auth - update-settings requires producer auth", () => {
  assertEquals(requiresProducerAuth("update-settings"), true);
});

Deno.test("members-area-drip - Auth - check-access requires no auth header", () => {
  assertEquals(requiresNoAuth("check-access"), true);
});

Deno.test("members-area-drip - Auth - unlock-content requires no auth header", () => {
  assertEquals(requiresNoAuth("unlock-content"), true);
});
