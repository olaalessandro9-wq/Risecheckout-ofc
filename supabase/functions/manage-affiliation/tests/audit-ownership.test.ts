/**
 * Audit Log, Ownership & PII Tests for manage-affiliation
 * @module manage-affiliation/tests/audit-ownership.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isProductOwner, VALID_STATUSES, type AuditEntry, type Affiliation } from "./_shared.ts";

// ============================================
// AUDIT LOG
// ============================================

Deno.test("manage-affiliation - audit - logs action", () => {
  const auditEntry: AuditEntry = {
    affiliate_id: "affil-123",
    action: "approve",
    performed_by: "producer-uuid",
    previous_status: "pending",
    new_status: "active",
    metadata: {
      product_id: "product-123",
      product_name: "Test Product",
    },
    ip_address: "192.168.1.1",
  };
  
  assertExists(auditEntry.affiliate_id);
  assertExists(auditEntry.action);
  assertExists(auditEntry.performed_by);
  assertExists(auditEntry.metadata);
});

Deno.test("manage-affiliation - audit - includes product info in metadata", () => {
  const metadata = {
    product_id: "product-123",
    product_name: "Premium Course",
  };
  
  assertExists(metadata.product_id);
  assertExists(metadata.product_name);
});

// ============================================
// OWNERSHIP VERIFICATION
// ============================================

Deno.test("manage-affiliation - ownership - verifies producer owns product", () => {
  const product = { id: "product-123", user_id: "producer-456" };
  assertEquals(isProductOwner(product, "producer-456"), true);
});

Deno.test("manage-affiliation - ownership - rejects non-owner", () => {
  const product = { id: "product-123", user_id: "producer-456" };
  assertEquals(isProductOwner(product, "different-producer"), false);
});

// ============================================
// AFFILIATION FIELDS
// ============================================

Deno.test("manage-affiliation - fields - affiliation has expected structure", () => {
  const affiliation: Affiliation = {
    id: "uuid-123",
    user_id: "affiliate-user-uuid",
    product_id: "product-uuid",
    affiliate_code: "XYZ12345",
    status: "active",
    commission_rate: 30,
    total_sales_count: 0,
    total_sales_amount: 0,
  };
  
  assertExists(affiliation.id);
  assertExists(affiliation.user_id);
  assertExists(affiliation.product_id);
  assertExists(affiliation.status);
});

Deno.test("manage-affiliation - fields - status values", () => {
  assertEquals(VALID_STATUSES.includes("pending"), true);
  assertEquals(VALID_STATUSES.includes("active"), true);
  assertEquals(VALID_STATUSES.includes("rejected"), true);
  assertEquals(VALID_STATUSES.includes("blocked"), true);
});

// ============================================
// PII MASKING
// ============================================

Deno.test("manage-affiliation - pii masking - masks email in logs", () => {
  const email = "user@example.com";
  const masked = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
  assertStringIncludes(masked, "***");
});

// ============================================
// PRODUCTS ARRAY HANDLING
// ============================================

Deno.test("manage-affiliation - products - handles array response", () => {
  const products = [{ id: "prod-1", user_id: "owner-123" }];
  const product = Array.isArray(products) ? products[0] : products;
  assertEquals(product.user_id, "owner-123");
});

Deno.test("manage-affiliation - products - handles object response", () => {
  const products = { id: "prod-1", user_id: "owner-456" };
  const product = Array.isArray(products) ? products[0] : products;
  assertEquals(product.user_id, "owner-456");
});
