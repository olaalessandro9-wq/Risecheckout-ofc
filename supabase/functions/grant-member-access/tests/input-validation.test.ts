/**
 * Grant Member Access - Input Validation Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module grant-member-access/tests/input-validation
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateGrantAccessRequest, normalizeEmail } from "./_shared.ts";

Deno.test("grant-member-access - Input Validation", async (t) => {
  await t.step("should require order_id", () => {
    const error = validateGrantAccessRequest({
      product_id: "prod-001",
      vendor_id: "vendor-001"
    });
    assertExists(error);
    assertStringIncludes(error, "order_id");
  });

  await t.step("should require product_id", () => {
    const error = validateGrantAccessRequest({
      order_id: "order-001",
      vendor_id: "vendor-001"
    });
    assertExists(error);
    assertStringIncludes(error, "product_id");
  });

  await t.step("should require vendor_id", () => {
    const error = validateGrantAccessRequest({
      order_id: "order-001",
      product_id: "prod-001"
    });
    assertExists(error);
    assertStringIncludes(error, "vendor_id");
  });

  await t.step("should pass with all required fields", () => {
    const error = validateGrantAccessRequest({
      order_id: "order-001",
      product_id: "prod-001",
      vendor_id: "vendor-001"
    });
    assertEquals(error, null);
  });
});

Deno.test("grant-member-access - Email Normalization", async (t) => {
  await t.step("should lowercase email", () => {
    const normalized = normalizeEmail("User@EXAMPLE.com");
    assertEquals(normalized, "user@example.com");
  });

  await t.step("should trim whitespace", () => {
    const normalized = normalizeEmail("  user@example.com  ");
    assertEquals(normalized, "user@example.com");
  });

  await t.step("should handle mixed case and whitespace", () => {
    const normalized = normalizeEmail("  User.Name@COMPANY.COM  ");
    assertEquals(normalized, "user.name@company.com");
  });
});
