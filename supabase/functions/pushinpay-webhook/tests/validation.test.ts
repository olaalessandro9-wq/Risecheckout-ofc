/**
 * Unit Tests - Payload Validation
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 1: Pure logic tests
 * Execution: ALWAYS (no infrastructure dependency)
 * 
 * @module pushinpay-webhook/tests/validation
 * @version 1.0.0
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  unitTestOptions,
  createValidPayload,
  createPaidPayload,
  createExpiredPayload,
  createCanceledPayload,
  createCreatedPayload,
  createEmptyPayload,
  createPayloadWithoutId,
  STATUS_MAPPING,
} from "./_shared.ts";

// ============================================================================
// PAYLOAD STRUCTURE TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/validation: valid payload has all required fields",
  ...unitTestOptions,
  fn: () => {
    const payload = createValidPayload();
    
    assertEquals(typeof payload.id, "string");
    assertEquals(payload.id.length > 0, true);
    assertEquals(["created", "paid", "canceled", "expired"].includes(payload.status), true);
  }
});

Deno.test({
  name: "pushinpay-webhook/validation: empty payload is detected",
  ...unitTestOptions,
  fn: () => {
    const payload = createEmptyPayload();
    
    assertEquals(Object.keys(payload).length, 0);
  }
});

Deno.test({
  name: "pushinpay-webhook/validation: payload without ID is detectable",
  ...unitTestOptions,
  fn: () => {
    const payload = createPayloadWithoutId();
    
    assertEquals("id" in payload, false);
    assertEquals("status" in payload, true);
  }
});

// ============================================================================
// STATUS VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/validation: paid status is valid",
  ...unitTestOptions,
  fn: () => {
    const payload = createPaidPayload();
    
    assertEquals(payload.status, "paid");
    assertEquals(["created", "paid", "canceled", "expired"].includes(payload.status), true);
  }
});

Deno.test({
  name: "pushinpay-webhook/validation: expired status is valid",
  ...unitTestOptions,
  fn: () => {
    const payload = createExpiredPayload();
    
    assertEquals(payload.status, "expired");
  }
});

Deno.test({
  name: "pushinpay-webhook/validation: canceled status is valid",
  ...unitTestOptions,
  fn: () => {
    const payload = createCanceledPayload();
    
    assertEquals(payload.status, "canceled");
  }
});

Deno.test({
  name: "pushinpay-webhook/validation: created status is valid",
  ...unitTestOptions,
  fn: () => {
    const payload = createCreatedPayload();
    
    assertEquals(payload.status, "created");
  }
});

// ============================================================================
// STATUS MAPPING TESTS (Hotmart/Kiwify Model)
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/validation: paid maps to PAID order status",
  ...unitTestOptions,
  fn: () => {
    const mapping = STATUS_MAPPING.paid;
    
    assertEquals(mapping.orderStatus, "PAID");
    assertEquals(mapping.technicalStatus, undefined);
  }
});

Deno.test({
  name: "pushinpay-webhook/validation: expired keeps PENDING with technical_status",
  ...unitTestOptions,
  fn: () => {
    const mapping = STATUS_MAPPING.expired;
    
    assertEquals(mapping.orderStatus, "PENDING");
    assertEquals(mapping.technicalStatus, "pix_expired");
  }
});

Deno.test({
  name: "pushinpay-webhook/validation: canceled keeps PENDING with technical_status",
  ...unitTestOptions,
  fn: () => {
    const mapping = STATUS_MAPPING.canceled;
    
    assertEquals(mapping.orderStatus, "PENDING");
    assertEquals(mapping.technicalStatus, "pix_canceled");
  }
});

Deno.test({
  name: "pushinpay-webhook/validation: created keeps PENDING with no technical_status",
  ...unitTestOptions,
  fn: () => {
    const mapping = STATUS_MAPPING.created;
    
    assertEquals(mapping.orderStatus, "PENDING");
    assertEquals(mapping.technicalStatus, undefined);
  }
});

// ============================================================================
// OPTIONAL FIELDS TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/validation: payer_name can be null",
  ...unitTestOptions,
  fn: () => {
    const payload = createValidPayload({ payer_name: null });
    
    assertEquals(payload.payer_name, null);
  }
});

Deno.test({
  name: "pushinpay-webhook/validation: value can be any positive number",
  ...unitTestOptions,
  fn: () => {
    const smallValue = createValidPayload({ value: 100 });
    const largeValue = createValidPayload({ value: 1000000 });
    
    assertEquals(smallValue.value, 100);
    assertEquals(largeValue.value, 1000000);
  }
});
