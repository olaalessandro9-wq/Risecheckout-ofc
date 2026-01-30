/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for Asaas Payment Helper
 * 
 * Coverage:
 * - Split rules conversion
 * - Due date generation
 * - Card token parsing
 * - Status mapping
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildSplitRules,
  getDueDate,
  parseCardToken,
  mapAsaasStatus,
  type AsaasPaymentStatus,
} from "./asaas-payment-helper.ts";
import { PaymentSplitRule } from "../types.ts";

// ============================================================================
// SPLIT RULES TESTS
// ============================================================================

Deno.test("buildSplitRules - should return undefined for empty rules", () => {
  const result = buildSplitRules([]);
  assertEquals(result, undefined);
});

Deno.test("buildSplitRules - should return undefined for undefined rules", () => {
  const result = buildSplitRules(undefined);
  assertEquals(result, undefined);
});

Deno.test("buildSplitRules - should skip producer role", () => {
  const rules: PaymentSplitRule[] = [
    {
      recipient_id: "wallet-123",
      amount_cents: 10000,
      role: "producer",
    },
  ];

  const result = buildSplitRules(rules);
  assertEquals(result, undefined);
});

Deno.test("buildSplitRules - should convert platform split rule", () => {
  const rules: PaymentSplitRule[] = [
    {
      recipient_id: "wallet-platform",
      amount_cents: 5000,
      role: "platform",
    },
  ];

  const result = buildSplitRules(rules);
  assertExists(result);
  assertEquals(result.length, 1);
  assertEquals(result[0].walletId, "wallet-platform");
  assertEquals(result[0].fixedValue, 50); // 5000 cents = R$ 50
  assertEquals(result[0].description, "Split platform");
});

Deno.test("buildSplitRules - should convert affiliate split rule", () => {
  const rules: PaymentSplitRule[] = [
    {
      recipient_id: "wallet-affiliate",
      amount_cents: 3000,
      role: "affiliate",
    },
  ];

  const result = buildSplitRules(rules);
  assertExists(result);
  assertEquals(result.length, 1);
  assertEquals(result[0].walletId, "wallet-affiliate");
  assertEquals(result[0].fixedValue, 30); // 3000 cents = R$ 30
  assertEquals(result[0].description, "Split affiliate");
});

Deno.test("buildSplitRules - should skip rules without recipient_id", () => {
  const rules: PaymentSplitRule[] = [
    {
      amount_cents: 5000,
      role: "platform",
    },
  ];

  const result = buildSplitRules(rules);
  assertEquals(result, undefined);
});

Deno.test("buildSplitRules - should handle multiple split rules", () => {
  const rules: PaymentSplitRule[] = [
    {
      recipient_id: "wallet-platform",
      amount_cents: 5000,
      role: "platform",
    },
    {
      recipient_id: "wallet-affiliate",
      amount_cents: 3000,
      role: "affiliate",
    },
  ];

  const result = buildSplitRules(rules);
  assertExists(result);
  assertEquals(result.length, 2);
  assertEquals(result[0].walletId, "wallet-platform");
  assertEquals(result[1].walletId, "wallet-affiliate");
});

Deno.test("buildSplitRules - should convert cents to reais correctly", () => {
  const rules: PaymentSplitRule[] = [
    {
      recipient_id: "wallet-test",
      amount_cents: 12345,
      role: "platform",
    },
  ];

  const result = buildSplitRules(rules);
  assertExists(result);
  assertEquals(result[0].fixedValue, 123.45);
});

// ============================================================================
// DUE DATE TESTS
// ============================================================================

Deno.test("getDueDate - should return date in YYYY-MM-DD format", () => {
  const dueDate = getDueDate();
  
  assertExists(dueDate);
  assertEquals(typeof dueDate, "string");
  assertEquals(dueDate.match(/^\d{4}-\d{2}-\d{2}$/), dueDate.match(/^\d{4}-\d{2}-\d{2}$/));
});

Deno.test("getDueDate - should return tomorrow's date", () => {
  const dueDate = getDueDate();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const expectedDate = tomorrow.toISOString().split('T')[0];
  
  assertEquals(dueDate, expectedDate);
});

// ============================================================================
// CARD TOKEN PARSING TESTS
// ============================================================================

Deno.test("parseCardToken - should parse simple token string", () => {
  const token = "tok_abc123xyz";
  const result = parseCardToken(token);
  
  assertExists(result);
  assertEquals(result.creditCardToken, "tok_abc123xyz");
  assertEquals(result.creditCard, undefined);
  assertEquals(result.creditCardHolderInfo, undefined);
});

Deno.test("parseCardToken - should parse JSON with creditCard data", () => {
  const token = JSON.stringify({
    creditCard: {
      holderName: "John Doe",
      number: "4111111111111111",
      expiryMonth: "12",
      expiryYear: "2025",
      ccv: "123",
    },
  });
  
  const result = parseCardToken(token);
  
  assertExists(result);
  assertExists(result.creditCard);
  assertEquals(result.creditCard?.holderName, "John Doe");
});

Deno.test("parseCardToken - should parse JSON with creditCardHolderInfo", () => {
  const token = JSON.stringify({
    creditCardHolderInfo: {
      name: "John Doe",
      email: "john@example.com",
      cpfCnpj: "12345678900",
    },
  });
  
  const result = parseCardToken(token);
  
  assertExists(result);
  assertExists(result.creditCardHolderInfo);
  assertEquals(result.creditCardHolderInfo?.name, "John Doe");
});

Deno.test("parseCardToken - should handle empty string", () => {
  const result = parseCardToken("");
  
  assertExists(result);
  assertEquals(result.creditCardToken, "");
});

// ============================================================================
// STATUS MAPPING TESTS
// ============================================================================

Deno.test("mapAsaasStatus - should map RECEIVED to approved", () => {
  assertEquals(mapAsaasStatus("RECEIVED"), "approved");
});

Deno.test("mapAsaasStatus - should map CONFIRMED to approved", () => {
  assertEquals(mapAsaasStatus("CONFIRMED"), "approved");
});

Deno.test("mapAsaasStatus - should map RECEIVED_IN_CASH to approved", () => {
  assertEquals(mapAsaasStatus("RECEIVED_IN_CASH"), "approved");
});

Deno.test("mapAsaasStatus - should map PENDING to pending", () => {
  assertEquals(mapAsaasStatus("PENDING"), "pending");
});

Deno.test("mapAsaasStatus - should map AWAITING_RISK_ANALYSIS to pending", () => {
  assertEquals(mapAsaasStatus("AWAITING_RISK_ANALYSIS"), "pending");
});

Deno.test("mapAsaasStatus - should map REFUNDED to refunded", () => {
  assertEquals(mapAsaasStatus("REFUNDED"), "refunded");
});

Deno.test("mapAsaasStatus - should map REFUND_REQUESTED to refunded", () => {
  assertEquals(mapAsaasStatus("REFUND_REQUESTED"), "refunded");
});

Deno.test("mapAsaasStatus - should map REFUND_IN_PROGRESS to refunded", () => {
  assertEquals(mapAsaasStatus("REFUND_IN_PROGRESS"), "refunded");
});

Deno.test("mapAsaasStatus - should map OVERDUE to cancelled", () => {
  assertEquals(mapAsaasStatus("OVERDUE"), "cancelled");
});

Deno.test("mapAsaasStatus - should map CHARGEBACK_REQUESTED to cancelled", () => {
  assertEquals(mapAsaasStatus("CHARGEBACK_REQUESTED"), "cancelled");
});

Deno.test("mapAsaasStatus - should map CHARGEBACK_DISPUTE to cancelled", () => {
  assertEquals(mapAsaasStatus("CHARGEBACK_DISPUTE"), "cancelled");
});

Deno.test("mapAsaasStatus - should map AWAITING_CHARGEBACK_REVERSAL to cancelled", () => {
  assertEquals(mapAsaasStatus("AWAITING_CHARGEBACK_REVERSAL"), "cancelled");
});

Deno.test("mapAsaasStatus - should map DUNNING_REQUESTED to cancelled", () => {
  assertEquals(mapAsaasStatus("DUNNING_REQUESTED"), "cancelled");
});

Deno.test("mapAsaasStatus - should map DUNNING_RECEIVED to cancelled", () => {
  assertEquals(mapAsaasStatus("DUNNING_RECEIVED"), "cancelled");
});

Deno.test("mapAsaasStatus - should map unknown status to error", () => {
  assertEquals(mapAsaasStatus("UNKNOWN_STATUS" as AsaasPaymentStatus), "error");
});
