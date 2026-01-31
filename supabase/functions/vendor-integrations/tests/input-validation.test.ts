/**
 * Vendor Integrations - Input Validation Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module vendor-integrations/tests/input-validation
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateVendorRequest, MOCK_VENDOR_ID } from "./_shared.ts";

Deno.test("vendor-integrations - Input Validation", async (t) => {
  await t.step("should require vendorId", () => {
    const error = validateVendorRequest({ action: "get-all" });
    assertExists(error);
    assertStringIncludes(error, "vendorId");
  });

  await t.step("should require integrationType for get-config", () => {
    const error = validateVendorRequest({
      action: "get-config",
      vendorId: MOCK_VENDOR_ID
    });
    assertExists(error);
    assertStringIncludes(error, "integrationType");
  });

  await t.step("should pass for valid get-all request", () => {
    const error = validateVendorRequest({
      action: "get-all",
      vendorId: MOCK_VENDOR_ID
    });
    assertEquals(error, null);
  });

  await t.step("should pass for valid get-config request", () => {
    const error = validateVendorRequest({
      action: "get-config",
      vendorId: MOCK_VENDOR_ID,
      integrationType: "MERCADOPAGO"
    });
    assertEquals(error, null);
  });
});
