/**
 * Status Determination Tests for reconcile-mercadopago (Hotmart/Kiwify Model)
 * 
 * @module reconcile-mercadopago/tests/status-determination.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  determineOrderUpdate,
  mockApprovedStatus,
  mockRejectedStatus,
  mockCancelledStatus,
  mockPendingStatus,
  MercadoPagoStatus,
} from "./_shared.ts";

// ============================================================================
// STATUS DETERMINATION TESTS - MODELO HOTMART/KIWIFY
// ============================================================================

Deno.test("reconcile-mercadopago - Status Determination - should update to 'paid' for approved status", () => {
  const result = determineOrderUpdate(mockApprovedStatus, "PENDING");
  assertEquals(result.newStatus, "paid");
  assertEquals(result.action, "updated");
  assertStringIncludes(result.reason, "confirmado");
});

Deno.test("reconcile-mercadopago - Status Determination - should keep status for rejected (technical update only)", () => {
  const result = determineOrderUpdate(mockRejectedStatus, "PENDING");
  assertEquals(result.newStatus, "PENDING");
  assertEquals(result.technicalStatus, "gateway_error");
  assertEquals(result.action, "updated");
  assertStringIncludes(result.reason, "Technical status");
});

Deno.test("reconcile-mercadopago - Status Determination - should keep status for cancelled (technical update only)", () => {
  const result = determineOrderUpdate(mockCancelledStatus, "PENDING");
  assertEquals(result.newStatus, "PENDING");
  assertEquals(result.technicalStatus, "gateway_cancelled");
  assertEquals(result.action, "updated");
});

Deno.test("reconcile-mercadopago - Status Determination - should skip for pending status", () => {
  const result = determineOrderUpdate(mockPendingStatus, "PENDING");
  assertEquals(result.newStatus, "PENDING");
  assertEquals(result.action, "skipped");
  assertStringIncludes(result.reason, "pendente");
});

Deno.test("reconcile-mercadopago - Status Determination - should update to 'refunded' for refunded status", () => {
  const refundedStatus: MercadoPagoStatus = { status: "refunded", status_detail: "by_collector" };
  const result = determineOrderUpdate(refundedStatus, "paid");
  assertEquals(result.newStatus, "refunded");
  assertEquals(result.action, "updated");
});

Deno.test("reconcile-mercadopago - Status Determination - should update to 'chargeback' for charged_back status", () => {
  const chargebackStatus: MercadoPagoStatus = { status: "charged_back", status_detail: "chargeback" };
  const result = determineOrderUpdate(chargebackStatus, "paid");
  assertEquals(result.newStatus, "chargeback");
  assertEquals(result.action, "updated");
});
