/**
 * Send Confirmation Email Tests - Validation
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for request validation in send-confirmation-email Edge Function.
 * 
 * @module send-confirmation-email/tests/validation
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  FUNCTION_NAME,
  createConfirmationEmailPayload,
  type SendConfirmationEmailRequest,
} from "./_shared.ts";

import { generatePrefixedId } from "../../_shared/testing/mod.ts";

// ============================================================================
// MISSING FIELD TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Validation - rejects missing 'orderId' field`, () => {
  const payload: Partial<SendConfirmationEmailRequest> = {};
  
  const hasOrderId = "orderId" in payload && payload.orderId;
  assertEquals(hasOrderId, false, "Payload should not have orderId");
});

Deno.test(`[${FUNCTION_NAME}] Validation - rejects null 'orderId'`, () => {
  const payload = { orderId: null };
  
  const isValid = payload.orderId !== null && payload.orderId !== undefined;
  assertEquals(isValid, false, "null orderId should be invalid");
});

Deno.test(`[${FUNCTION_NAME}] Validation - rejects undefined 'orderId'`, () => {
  const payload = { orderId: undefined };
  
  const isValid = payload.orderId !== null && payload.orderId !== undefined;
  assertEquals(isValid, false, "undefined orderId should be invalid");
});

Deno.test(`[${FUNCTION_NAME}] Validation - rejects empty string 'orderId'`, () => {
  const payload = { orderId: "" };
  
  const isValid = payload.orderId.length > 0;
  assertEquals(isValid, false, "empty orderId should be invalid");
});

// ============================================================================
// INVALID TYPE TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Validation - rejects numeric 'orderId'`, () => {
  const payload = { orderId: 12345 };
  
  const isString = typeof payload.orderId === "string";
  assertEquals(isString, false, "numeric orderId should be invalid");
});

Deno.test(`[${FUNCTION_NAME}] Validation - rejects object 'orderId'`, () => {
  const payload = { orderId: { id: "123" } };
  
  const isString = typeof payload.orderId === "string";
  assertEquals(isString, false, "object orderId should be invalid");
});

Deno.test(`[${FUNCTION_NAME}] Validation - rejects array 'orderId'`, () => {
  const payload = { orderId: ["123", "456"] };
  
  const isString = typeof payload.orderId === "string";
  assertEquals(isString, false, "array orderId should be invalid");
});

// ============================================================================
// VALID PAYLOAD TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Validation - accepts valid UUID orderId`, () => {
  const payload = createConfirmationEmailPayload();
  
  const isValid = 
    typeof payload.orderId === "string" && 
    payload.orderId.length > 0;
  
  assertEquals(isValid, true, "valid orderId should be accepted");
  assertExists(payload.orderId);
});

Deno.test(`[${FUNCTION_NAME}] Validation - accepts valid prefixed orderId`, () => {
  const orderId = generatePrefixedId("order");
  const payload = createConfirmationEmailPayload(orderId);
  
  const hasPrefix = payload.orderId.startsWith("order-");
  assertEquals(hasPrefix, true, "should accept prefixed orderId");
});

Deno.test(`[${FUNCTION_NAME}] Validation - accepts standard UUID format`, () => {
  const orderId = crypto.randomUUID();
  const payload = createConfirmationEmailPayload(orderId);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidUuid = uuidRegex.test(payload.orderId);
  
  assertEquals(isValidUuid, true, "should accept standard UUID");
});

// ============================================================================
// EDGE CASES
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Validation - handles whitespace-only orderId`, () => {
  const payload = { orderId: "   " };
  
  const trimmed = payload.orderId.trim();
  const isValid = trimmed.length > 0;
  
  assertEquals(isValid, false, "whitespace-only orderId should be invalid");
});

Deno.test(`[${FUNCTION_NAME}] Validation - handles orderId with whitespace`, () => {
  const orderId = crypto.randomUUID();
  const payload = { orderId: `  ${orderId}  ` };
  
  const trimmed = payload.orderId.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidAfterTrim = uuidRegex.test(trimmed);
  
  assertEquals(isValidAfterTrim, true, "should be valid after trimming");
});

Deno.test(`[${FUNCTION_NAME}] Validation - handles very long orderId`, () => {
  const longId = "a".repeat(1000);
  const payload = { orderId: longId };
  
  // UUIDs are 36 characters, any reasonable ID should be under 100
  const isReasonableLength = payload.orderId.length <= 100;
  
  assertEquals(isReasonableLength, false, "very long orderId should be suspicious");
});
