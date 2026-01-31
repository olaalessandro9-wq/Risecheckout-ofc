/**
 * Ownership Verification Tests for content-save
 * 
 * @module content-save/tests/ownership.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { verifyModuleOwnership } from "./_shared.ts";

// ============================================================================
// OWNERSHIP VERIFICATION TESTS
// ============================================================================

Deno.test("content-save - Ownership - should approve valid ownership", () => {
  const result = verifyModuleOwnership("mod-1", "user-123");
  assertEquals(result.valid, true);
  assertEquals(result.productId, "prod-1");
});

Deno.test("content-save - Ownership - should reject invalid ownership", () => {
  const result = verifyModuleOwnership("mod-1", "user-456");
  assertEquals(result.valid, false);
  assertStringIncludes(result.error || "", "permissão");
});

Deno.test("content-save - Ownership - should reject non-existent module", () => {
  const result = verifyModuleOwnership("mod-inexistente", "user-123");
  assertEquals(result.valid, false);
  assertStringIncludes(result.error || "", "não encontrado");
});
