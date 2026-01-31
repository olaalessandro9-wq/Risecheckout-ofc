/**
 * Grant Member Access - Grant Logic Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module grant-member-access/tests/grant-logic
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  MOCK_PRODUCT_WITH_MEMBERS,
  MOCK_PRODUCT_WITHOUT_MEMBERS,
  MOCK_EXISTING_USER,
  simulateGrantAccess
} from "./_shared.ts";

Deno.test("grant-member-access - Grant Access Logic", async (t) => {
  await t.step("should skip if product has no members area", () => {
    const result = simulateGrantAccess(
      {
        order_id: "order-001",
        vendor_id: "vendor-001",
        product_id: MOCK_PRODUCT_WITHOUT_MEMBERS.id,
        customer_email: "user@example.com"
      },
      MOCK_PRODUCT_WITHOUT_MEMBERS,
      null
    );
    
    assertEquals(result.success, true);
    assertEquals(result.skipped, true);
    assertEquals(result.reason, "Produto sem área de membros");
  });

  await t.step("should return error if product not found", () => {
    const result = simulateGrantAccess(
      {
        order_id: "order-001",
        vendor_id: "vendor-001",
        product_id: "non-existent",
        customer_email: "user@example.com"
      },
      null,
      null
    );
    
    assertEquals(result.success, false);
    assertExists(result.error);
    assertStringIncludes(result.error!, "Produto não encontrado");
  });

  await t.step("should return error if customer email is missing", () => {
    const result = simulateGrantAccess(
      {
        order_id: "order-001",
        vendor_id: "vendor-001",
        product_id: MOCK_PRODUCT_WITH_MEMBERS.id,
        customer_email: ""
      },
      MOCK_PRODUCT_WITH_MEMBERS,
      null
    );
    
    assertEquals(result.success, false);
    assertEquals(result.error, "Email do cliente não disponível");
  });

  await t.step("should use existing user if found", () => {
    const result = simulateGrantAccess(
      {
        order_id: "order-001",
        vendor_id: "vendor-001",
        product_id: MOCK_PRODUCT_WITH_MEMBERS.id,
        customer_email: MOCK_EXISTING_USER.email
      },
      MOCK_PRODUCT_WITH_MEMBERS,
      MOCK_EXISTING_USER
    );
    
    assertEquals(result.success, true);
    assertEquals(result.buyer_id, MOCK_EXISTING_USER.id);
  });

  await t.step("should create new user if not found", () => {
    const result = simulateGrantAccess(
      {
        order_id: "order-001",
        vendor_id: "vendor-001",
        product_id: MOCK_PRODUCT_WITH_MEMBERS.id,
        customer_email: "brand.new@example.com"
      },
      MOCK_PRODUCT_WITH_MEMBERS,
      null
    );
    
    assertEquals(result.success, true);
    assertExists(result.buyer_id);
  });
});
