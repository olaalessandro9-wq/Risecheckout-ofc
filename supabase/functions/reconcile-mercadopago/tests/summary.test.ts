/**
 * Summary & API Tests for reconcile-mercadopago
 * 
 * @module reconcile-mercadopago/tests/summary.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  calculateSummary,
  buildMercadoPagoApiUrl,
  buildApprovedEventData,
  buildTechnicalStatusEventData,
  mockApprovedStatus,
  mockRejectedStatus,
  MOCK_PAYMENT_ID,
  FUNCTION_VERSION,
  ReconcileResult,
} from "./_shared.ts";

// ============================================================================
// SUMMARY CALCULATION TESTS
// ============================================================================

Deno.test("reconcile-mercadopago - Summary Calculation - should calculate correct totals", () => {
  const results: ReconcileResult[] = [
    { order_id: "1", previous_status: "PENDING", new_status: "paid", action: "updated", reason: "OK" },
    { order_id: "2", previous_status: "PENDING", new_status: "PENDING", technical_status: "gateway_error", action: "updated", reason: "Tech" },
    { order_id: "3", previous_status: "PENDING", new_status: "PENDING", action: "skipped", reason: "Still pending" },
    { order_id: "4", previous_status: "PENDING", new_status: "PENDING", action: "error", reason: "API error" },
  ];

  const summary = calculateSummary(results);
  assertEquals(summary.total, 4);
  assertEquals(summary.updated, 2);
  assertEquals(summary.skipped, 1);
  assertEquals(summary.errors, 1);
  assertEquals(summary.model, "hotmart_kiwify");
  assertEquals(summary.version, FUNCTION_VERSION);
});

Deno.test("reconcile-mercadopago - Summary Calculation - should handle empty results", () => {
  const summary = calculateSummary([]);
  assertEquals(summary.total, 0);
  assertEquals(summary.updated, 0);
});

// ============================================================================
// API URL BUILDING TESTS
// ============================================================================

Deno.test("reconcile-mercadopago - API URL Building - should build correct payment status URL", () => {
  const url = buildMercadoPagoApiUrl(MOCK_PAYMENT_ID);
  assertEquals(url, `https://api.mercadopago.com/v1/payments/${MOCK_PAYMENT_ID}`);
});

Deno.test("reconcile-mercadopago - API URL Building - should handle numeric payment IDs", () => {
  const url = buildMercadoPagoApiUrl("123456789");
  assertStringIncludes(url, "123456789");
});

// ============================================================================
// EVENT DATA BUILDING TESTS
// ============================================================================

Deno.test("reconcile-mercadopago - Event Data Building - should build approved event data", () => {
  const data = buildApprovedEventData(mockApprovedStatus);
  assertEquals(data.source, "reconcile-mercadopago");
  assertEquals(data.gateway_status, "approved");
  assertEquals(data.model, "hotmart_kiwify");
  assertEquals(data.version, FUNCTION_VERSION);
  assertExists(data.reconciled_at);
});

Deno.test("reconcile-mercadopago - Event Data Building - should build technical status event data", () => {
  const data = buildTechnicalStatusEventData(mockRejectedStatus, "gateway_error");
  assertEquals(data.source, "reconcile-mercadopago");
  assertEquals(data.technical_status, "gateway_error");
  assertEquals(data.model, "hotmart_kiwify");
  assertStringIncludes(data.note as string, "padrão de mercado");
});
