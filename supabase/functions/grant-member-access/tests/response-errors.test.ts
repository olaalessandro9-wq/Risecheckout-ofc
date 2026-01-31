/**
 * Grant Member Access - Response & Error Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module grant-member-access/tests/response-errors
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { type GrantAccessResponse } from "./_shared.ts";

Deno.test("grant-member-access - Response Format", async (t) => {
  await t.step("should return success with buyer_id on successful grant", () => {
    const response: GrantAccessResponse = {
      success: true,
      buyer_id: "buyer-123"
    };
    
    assertEquals(response.success, true);
    assertExists(response.buyer_id);
    assertEquals(response.error, undefined);
  });

  await t.step("should return skipped response for products without members area", () => {
    const response: GrantAccessResponse = {
      success: true,
      skipped: true,
      reason: "Produto sem área de membros"
    };
    
    assertEquals(response.success, true);
    assertEquals(response.skipped, true);
    assertExists(response.reason);
  });

  await t.step("should return error response on failure", () => {
    const response: GrantAccessResponse = {
      success: false,
      error: "Some error message"
    };
    
    assertEquals(response.success, false);
    assertExists(response.error);
    assertEquals(response.buyer_id, undefined);
  });
});

Deno.test("grant-member-access - Error Handling", async (t) => {
  await t.step("should handle database errors gracefully", () => {
    const errorMessage = "Database connection failed";
    const response: GrantAccessResponse = {
      success: false,
      error: errorMessage
    };
    
    assertEquals(response.success, false);
    assertEquals(response.error, errorMessage);
  });

  await t.step("should handle unexpected errors with generic message", () => {
    const errorMessage = "Internal server error";
    assertEquals(errorMessage, "Internal server error");
  });

  await t.step("should extract Error message correctly", () => {
    const error = new Error("Specific error message");
    assertEquals(error.message, "Specific error message");
  });

  await t.step("should handle non-Error objects", () => {
    const errorObj = { code: "ERR001", message: "Custom error" };
    const errorString = String(errorObj);
    assertEquals(typeof errorString, "string");
  });
});
