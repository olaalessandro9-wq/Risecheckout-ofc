/**
 * Unit Tests - Payload Validation
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 1: Pure logic tests
 * Execution: ALWAYS (no infrastructure dependency)
 * 
 * @module asaas-webhook/tests/validation
 * @version 1.0.0
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  unitTestOptions,
  createValidPayload,
  createConfirmedPayload,
  createOverduePayload,
  createRefundedPayload,
  createEmptyPayload,
  createPayloadWithoutPayment,
  STATUS_MAPPING,
  RELEVANT_EVENTS,
} from "./_shared.ts";

// ============================================================================
// PAYLOAD STRUCTURE TESTS
// ============================================================================

Deno.test({
  name: "asaas-webhook/validation: valid payload has event and payment",
  ...unitTestOptions,
  fn: () => {
    const payload = createValidPayload();
    
    assertEquals(typeof payload.event, "string");
    assertEquals(payload.payment !== undefined, true);
    assertEquals(typeof payload.payment?.id, "string");
  }
});

Deno.test({
  name: "asaas-webhook/validation: empty payload has no fields",
  ...unitTestOptions,
  fn: () => {
    const payload = createEmptyPayload();
    
    assertEquals(Object.keys(payload).length, 0);
  }
});

Deno.test({
  name: "asaas-webhook/validation: payload without payment has only event",
  ...unitTestOptions,
  fn: () => {
    const payload = createPayloadWithoutPayment();
    
    assertEquals("event" in payload, true);
    assertEquals("payment" in payload, false);
  }
});

// ============================================================================
// EVENT TYPE TESTS
// ============================================================================

Deno.test({
  name: "asaas-webhook/validation: PAYMENT_RECEIVED is relevant event",
  ...unitTestOptions,
  fn: () => {
    assertEquals(RELEVANT_EVENTS.includes("PAYMENT_RECEIVED"), true);
  }
});

Deno.test({
  name: "asaas-webhook/validation: PAYMENT_CONFIRMED is relevant event",
  ...unitTestOptions,
  fn: () => {
    assertEquals(RELEVANT_EVENTS.includes("PAYMENT_CONFIRMED"), true);
  }
});

Deno.test({
  name: "asaas-webhook/validation: PAYMENT_OVERDUE is relevant event",
  ...unitTestOptions,
  fn: () => {
    assertEquals(RELEVANT_EVENTS.includes("PAYMENT_OVERDUE"), true);
  }
});

Deno.test({
  name: "asaas-webhook/validation: PAYMENT_REFUNDED is relevant event",
  ...unitTestOptions,
  fn: () => {
    assertEquals(RELEVANT_EVENTS.includes("PAYMENT_REFUNDED"), true);
  }
});

// ============================================================================
// STATUS MAPPING TESTS (Hotmart/Kiwify Model)
// ============================================================================

Deno.test({
  name: "asaas-webhook/validation: RECEIVED maps to PAID",
  ...unitTestOptions,
  fn: () => {
    const mapping = STATUS_MAPPING.RECEIVED;
    
    assertEquals(mapping.orderStatus, "PAID");
    assertEquals(mapping.technicalStatus, undefined);
  }
});

Deno.test({
  name: "asaas-webhook/validation: CONFIRMED maps to PAID",
  ...unitTestOptions,
  fn: () => {
    const mapping = STATUS_MAPPING.CONFIRMED;
    
    assertEquals(mapping.orderStatus, "PAID");
  }
});

Deno.test({
  name: "asaas-webhook/validation: OVERDUE keeps PENDING with technical_status",
  ...unitTestOptions,
  fn: () => {
    const mapping = STATUS_MAPPING.OVERDUE;
    
    assertEquals(mapping.orderStatus, "PENDING");
    assertEquals(mapping.technicalStatus, "expired");
  }
});

Deno.test({
  name: "asaas-webhook/validation: REFUNDED maps to REFUNDED",
  ...unitTestOptions,
  fn: () => {
    const mapping = STATUS_MAPPING.REFUNDED;
    
    assertEquals(mapping.orderStatus, "REFUNDED");
  }
});

Deno.test({
  name: "asaas-webhook/validation: CHARGEBACK_REQUESTED maps to CHARGEBACK",
  ...unitTestOptions,
  fn: () => {
    const mapping = STATUS_MAPPING.CHARGEBACK_REQUESTED;
    
    assertEquals(mapping.orderStatus, "CHARGEBACK");
  }
});

// ============================================================================
// PAYMENT DATA TESTS
// ============================================================================

Deno.test({
  name: "asaas-webhook/validation: confirmed payload has correct structure",
  ...unitTestOptions,
  fn: () => {
    const payload = createConfirmedPayload();
    
    assertEquals(payload.event, "PAYMENT_CONFIRMED");
    assertEquals(payload.payment?.status, "CONFIRMED");
  }
});

Deno.test({
  name: "asaas-webhook/validation: overdue payload has correct structure",
  ...unitTestOptions,
  fn: () => {
    const payload = createOverduePayload();
    
    assertEquals(payload.event, "PAYMENT_OVERDUE");
    assertEquals(payload.payment?.status, "OVERDUE");
  }
});

Deno.test({
  name: "asaas-webhook/validation: refunded payload has correct structure",
  ...unitTestOptions,
  fn: () => {
    const payload = createRefundedPayload();
    
    assertEquals(payload.event, "PAYMENT_REFUNDED");
    assertEquals(payload.payment?.status, "REFUNDED");
  }
});

Deno.test({
  name: "asaas-webhook/validation: payment has billingType",
  ...unitTestOptions,
  fn: () => {
    const payload = createValidPayload();
    
    assertEquals(["PIX", "BOLETO", "CREDIT_CARD"].includes(payload.payment!.billingType), true);
  }
});
