/**
 * Check-Secrets Edge Function - Categories Tests
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * @module check-secrets/tests/categories
 */

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  EXPECTED_CATEGORIES,
  EXPECTED_SECRETS,
  SECRETS_BY_CATEGORY,
  getCategorySecrets,
} from "./_shared.ts";

// ============================================================================
// CATEGORY EXISTENCE TESTS
// ============================================================================

Deno.test("check-secrets - Categories - supabase category exists", () => {
  assert(EXPECTED_CATEGORIES.includes("supabase"));
});

Deno.test("check-secrets - Categories - mercadopago category exists", () => {
  assert(EXPECTED_CATEGORIES.includes("mercadopago"));
});

Deno.test("check-secrets - Categories - stripe category exists", () => {
  assert(EXPECTED_CATEGORIES.includes("stripe"));
});

Deno.test("check-secrets - Categories - pushinpay category exists", () => {
  assert(EXPECTED_CATEGORIES.includes("pushinpay"));
});

Deno.test("check-secrets - Categories - asaas category exists", () => {
  assert(EXPECTED_CATEGORIES.includes("asaas"));
});

Deno.test("check-secrets - Categories - platform category exists", () => {
  assert(EXPECTED_CATEGORIES.includes("platform"));
});

// ============================================================================
// SECRETS BY CATEGORY COUNT TESTS
// ============================================================================

Deno.test("check-secrets - Categories - supabase has 4 secrets", () => {
  assertEquals(getCategorySecrets("supabase").length, 4);
});

Deno.test("check-secrets - Categories - mercadopago has 5 secrets", () => {
  assertEquals(getCategorySecrets("mercadopago").length, 5);
});

Deno.test("check-secrets - Categories - stripe has 3 secrets", () => {
  assertEquals(getCategorySecrets("stripe").length, 3);
});

Deno.test("check-secrets - Categories - pushinpay has 5 secrets", () => {
  assertEquals(getCategorySecrets("pushinpay").length, 5);
});

Deno.test("check-secrets - Categories - asaas has 3 secrets", () => {
  assertEquals(getCategorySecrets("asaas").length, 3);
});

Deno.test("check-secrets - Categories - platform has 2 secrets", () => {
  assertEquals(getCategorySecrets("platform").length, 2);
});

// ============================================================================
// SPECIFIC SECRETS TESTS
// ============================================================================

Deno.test("check-secrets - Categories - SUPABASE_URL is in supabase", () => {
  assertEquals(EXPECTED_SECRETS["SUPABASE_URL"], "supabase");
});

Deno.test("check-secrets - Categories - STRIPE_SECRET_KEY is in stripe", () => {
  assertEquals(EXPECTED_SECRETS["STRIPE_SECRET_KEY"], "stripe");
});

Deno.test("check-secrets - Categories - MERCADOPAGO_ACCESS_TOKEN is in mercadopago", () => {
  assertEquals(EXPECTED_SECRETS["MERCADOPAGO_ACCESS_TOKEN"], "mercadopago");
});

Deno.test("check-secrets - Categories - PUSHINPAY_API_TOKEN is in pushinpay", () => {
  assertEquals(EXPECTED_SECRETS["PUSHINPAY_API_TOKEN"], "pushinpay");
});

Deno.test("check-secrets - Categories - ASAAS_API_KEY is in asaas", () => {
  assertEquals(EXPECTED_SECRETS["ASAAS_API_KEY"], "asaas");
});

Deno.test("check-secrets - Categories - PLATFORM_FEE_PERCENT is in platform", () => {
  assertEquals(EXPECTED_SECRETS["PLATFORM_FEE_PERCENT"], "platform");
});

// ============================================================================
// AGGREGATION TESTS
// ============================================================================

Deno.test("check-secrets - Categories - total secrets equals sum of categories", () => {
  const totalFromCategories = Object.values(SECRETS_BY_CATEGORY)
    .reduce((sum, secrets) => sum + secrets.length, 0);
  assertEquals(totalFromCategories, Object.keys(EXPECTED_SECRETS).length);
});

Deno.test("check-secrets - Categories - unknown category returns empty array", () => {
  assertEquals(getCategorySecrets("unknown"), []);
});
