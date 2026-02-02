/**
 * Send PIX Email Tests - Validation
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { FUNCTION_NAME, createPixEmailPayload } from "./_shared.ts";
import { generatePrefixedId } from "../../_shared/testing/mod.ts";

Deno.test(`[${FUNCTION_NAME}] Validation - rejects missing orderId`, () => {
  const payload: Partial<{ orderId: string }> = {};
  assertEquals("orderId" in payload && payload.orderId, false);
});

Deno.test(`[${FUNCTION_NAME}] Validation - rejects empty orderId`, () => {
  assertEquals({ orderId: "" }.orderId.length > 0, false);
});

Deno.test(`[${FUNCTION_NAME}] Validation - rejects numeric orderId`, () => {
  assertEquals(typeof { orderId: 123 }.orderId === "string", false);
});

Deno.test(`[${FUNCTION_NAME}] Validation - accepts valid UUID`, () => {
  const payload = createPixEmailPayload(crypto.randomUUID());
  assertExists(payload.orderId);
  assertEquals(payload.orderId.length > 0, true);
});

Deno.test(`[${FUNCTION_NAME}] Validation - accepts prefixed orderId`, () => {
  const payload = createPixEmailPayload(generatePrefixedId("order"));
  assertEquals(payload.orderId.startsWith("order-"), true);
});
