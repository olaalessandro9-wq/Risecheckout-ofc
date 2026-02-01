/**
 * Unit Tests - Payload Validation
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 1: Pure logic tests
 * Execution: ALWAYS
 * 
 * @module mercadopago-webhook/tests/validation
 * @version 1.0.0
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  unitTestOptions,
  createValidPayload,
  createNonPaymentPayload,
  createPayloadWithoutId,
  createMockPaymentDetails,
  STATUS_MAPPING,
} from "./_shared.ts";

// ============================================================================
// PAYLOAD STRUCTURE TESTS
// ============================================================================

Deno.test({
  name: "mercadopago-webhook/validation: valid payload has type and data",
  ...unitTestOptions,
  fn: () => {
    const payload = createValidPayload();
    
    assertEquals(payload.type, "payment");
    assertEquals(payload.data !== undefined, true);
    assertEquals(payload.data?.id !== undefined, true);
  }
});

Deno.test({
  name: "mercadopago-webhook/validation: non-payment payload has different type",
  ...unitTestOptions,
  fn: () => {
    const payload = createNonPaymentPayload();
    
    assertEquals(payload.type, "merchant_order");
    assertEquals(payload.type !== "payment", true);
  }
});

Deno.test({
  name: "mercadopago-webhook/validation: payload without id has undefined data",
  ...unitTestOptions,
  fn: () => {
    const payload = createPayloadWithoutId();
    
    assertEquals(payload.type, "payment");
    assertEquals(payload.data, undefined);
  }
});

// ============================================================================
// STATUS MAPPING TESTS
// ============================================================================

Deno.test({
  name: "mercadopago-webhook/validation: approved maps to PAID",
  ...unitTestOptions,
  fn: () => {
    assertEquals(STATUS_MAPPING.approved, "PAID");
  }
});

Deno.test({
  name: "mercadopago-webhook/validation: pending maps to PENDING",
  ...unitTestOptions,
  fn: () => {
    assertEquals(STATUS_MAPPING.pending, "PENDING");
  }
});

Deno.test({
  name: "mercadopago-webhook/validation: refunded maps to REFUNDED",
  ...unitTestOptions,
  fn: () => {
    assertEquals(STATUS_MAPPING.refunded, "REFUNDED");
  }
});

Deno.test({
  name: "mercadopago-webhook/validation: charged_back maps to CHARGEBACK",
  ...unitTestOptions,
  fn: () => {
    assertEquals(STATUS_MAPPING.charged_back, "CHARGEBACK");
  }
});

Deno.test({
  name: "mercadopago-webhook/validation: rejected maps to REJECTED",
  ...unitTestOptions,
  fn: () => {
    assertEquals(STATUS_MAPPING.rejected, "REJECTED");
  }
});

Deno.test({
  name: "mercadopago-webhook/validation: cancelled maps to CANCELLED",
  ...unitTestOptions,
  fn: () => {
    assertEquals(STATUS_MAPPING.cancelled, "CANCELLED");
  }
});

Deno.test({
  name: "mercadopago-webhook/validation: in_process maps to PENDING",
  ...unitTestOptions,
  fn: () => {
    assertEquals(STATUS_MAPPING.in_process, "PENDING");
  }
});

// ============================================================================
// PAYMENT DETAILS TESTS
// ============================================================================

Deno.test({
  name: "mercadopago-webhook/validation: payment details has required fields",
  ...unitTestOptions,
  fn: () => {
    const details = createMockPaymentDetails();
    
    assertEquals(typeof details.id, "number");
    assertEquals(typeof details.status, "string");
    assertEquals(typeof details.transaction_amount, "number");
  }
});

Deno.test({
  name: "mercadopago-webhook/validation: approved payment has date_approved",
  ...unitTestOptions,
  fn: () => {
    const details = createMockPaymentDetails({ status: "approved" });
    
    assertEquals(details.status, "approved");
    assertEquals(details.date_approved !== undefined, true);
  }
});

Deno.test({
  name: "mercadopago-webhook/validation: payment has external_reference for order lookup",
  ...unitTestOptions,
  fn: () => {
    const details = createMockPaymentDetails({ external_reference: "order-123" });
    
    assertEquals(details.external_reference, "order-123");
  }
});
