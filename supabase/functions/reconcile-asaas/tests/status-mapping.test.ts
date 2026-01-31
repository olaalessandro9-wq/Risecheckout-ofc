/**
 * Status Mapping Tests for reconcile-asaas
 * 
 * @module reconcile-asaas/tests/status-mapping.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mapAsaasStatusToInternal, determineNewOrderStatus } from "./_shared.ts";

// ============================================================================
// STATUS MAPPING TESTS
// ============================================================================

Deno.test("reconcile-asaas - Status Mapping - should map RECEIVED to approved", () => {
  assertEquals(mapAsaasStatusToInternal("RECEIVED"), "approved");
});

Deno.test("reconcile-asaas - Status Mapping - should map CONFIRMED to approved", () => {
  assertEquals(mapAsaasStatusToInternal("CONFIRMED"), "approved");
});

Deno.test("reconcile-asaas - Status Mapping - should map RECEIVED_IN_CASH to approved", () => {
  assertEquals(mapAsaasStatusToInternal("RECEIVED_IN_CASH"), "approved");
});

Deno.test("reconcile-asaas - Status Mapping - should map OVERDUE to rejected", () => {
  assertEquals(mapAsaasStatusToInternal("OVERDUE"), "rejected");
});

Deno.test("reconcile-asaas - Status Mapping - should map REFUNDED to rejected", () => {
  assertEquals(mapAsaasStatusToInternal("REFUNDED"), "rejected");
});

Deno.test("reconcile-asaas - Status Mapping - should map CHARGEBACK_REQUESTED to rejected", () => {
  assertEquals(mapAsaasStatusToInternal("CHARGEBACK_REQUESTED"), "rejected");
});

Deno.test("reconcile-asaas - Status Mapping - should map CHARGEBACK_DISPUTE to rejected", () => {
  assertEquals(mapAsaasStatusToInternal("CHARGEBACK_DISPUTE"), "rejected");
});

Deno.test("reconcile-asaas - Status Mapping - should map PENDING to pending", () => {
  assertEquals(mapAsaasStatusToInternal("PENDING"), "pending");
});

Deno.test("reconcile-asaas - Status Mapping - should map AWAITING_RISK_ANALYSIS to pending", () => {
  assertEquals(mapAsaasStatusToInternal("AWAITING_RISK_ANALYSIS"), "pending");
});

Deno.test("reconcile-asaas - Status Mapping - should map unknown status to pending", () => {
  assertEquals(mapAsaasStatusToInternal("UNKNOWN_STATUS"), "pending");
});

// ============================================================================
// ORDER STATUS DETERMINATION TESTS
// ============================================================================

Deno.test("reconcile-asaas - Order Status Determination - should set status to 'paid' for approved payments", () => {
  assertEquals(determineNewOrderStatus("RECEIVED"), "paid");
  assertEquals(determineNewOrderStatus("CONFIRMED"), "paid");
});

Deno.test("reconcile-asaas - Order Status Determination - should set status to 'refunded' for REFUNDED", () => {
  assertEquals(determineNewOrderStatus("REFUNDED"), "refunded");
});

Deno.test("reconcile-asaas - Order Status Determination - should set status to 'chargeback' for CHARGEBACK statuses", () => {
  assertEquals(determineNewOrderStatus("CHARGEBACK_REQUESTED"), "chargeback");
  assertEquals(determineNewOrderStatus("CHARGEBACK_DISPUTE"), "chargeback");
});

Deno.test("reconcile-asaas - Order Status Determination - should set status to 'rejected' for OVERDUE", () => {
  assertEquals(determineNewOrderStatus("OVERDUE"), "rejected");
});

Deno.test("reconcile-asaas - Order Status Determination - should keep status as PENDING for pending statuses", () => {
  assertEquals(determineNewOrderStatus("PENDING"), "PENDING");
  assertEquals(determineNewOrderStatus("AWAITING_RISK_ANALYSIS"), "PENDING");
});
