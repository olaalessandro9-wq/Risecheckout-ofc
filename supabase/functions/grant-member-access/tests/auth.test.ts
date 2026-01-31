/**
 * Grant Member Access - Authentication Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module grant-member-access/tests/auth
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { MOCK_INTERNAL_SECRET, validateInternalSecret } from "./_shared.ts";

Deno.test("grant-member-access - Authentication", async (t) => {
  await t.step("should reject request without X-Internal-Secret header", () => {
    const isValid = validateInternalSecret(null, MOCK_INTERNAL_SECRET);
    assertEquals(isValid, false);
  });

  await t.step("should reject request with incorrect X-Internal-Secret", () => {
    const isValid = validateInternalSecret("wrong-secret", MOCK_INTERNAL_SECRET);
    assertEquals(isValid, false);
  });

  await t.step("should accept request with correct X-Internal-Secret", () => {
    const isValid = validateInternalSecret(MOCK_INTERNAL_SECRET, MOCK_INTERNAL_SECRET);
    assertEquals(isValid, true);
  });

  await t.step("should handle empty string as secret", () => {
    const isValid = validateInternalSecret("", MOCK_INTERNAL_SECRET);
    assertEquals(isValid, false);
  });
});
