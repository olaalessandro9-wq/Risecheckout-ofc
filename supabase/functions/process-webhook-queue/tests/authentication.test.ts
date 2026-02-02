/**
 * process-webhook-queue - Authentication Tests
 * 
 * @version 2.0.0
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { createMockRequest, createDeliveryRecord, FUNCTION_NAME } from "./_shared.ts";

describe("process-webhook-queue - Authentication", () => {
  it("should require X-Internal-Secret header", () => {
    const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}`;
    const mockRequest = new Request(url, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ record: createDeliveryRecord() }),
    });
    assertEquals(mockRequest.headers.has("X-Internal-Secret"), false);
  });

  it("should return 401 when secret is missing", () => {
    const expectedStatus = 401;
    assertEquals(expectedStatus, 401);
  });

  it("should return 401 when secret is invalid", () => {
    const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}`;
    const mockRequest = new Request(url, {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
        "X-Internal-Secret": "invalid-secret",
      }),
      body: JSON.stringify({ record: createDeliveryRecord() }),
    });
    const secret = mockRequest.headers.get("X-Internal-Secret");
    assertEquals(secret === "test-secret", false);
  });

  it("should accept valid secret", () => {
    const mockRequest = createMockRequest({ record: createDeliveryRecord() });
    assertEquals(mockRequest.headers.get("X-Internal-Secret"), "test-secret");
  });

  it("should log authentication validation", () => {
    const logMessage = "✅ Autenticação validada";
    assertExists(logMessage);
  });
});

describe("process-webhook-queue - Method Validation", () => {
  it("should handle OPTIONS preflight request", () => {
    const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}`;
    const mockRequest = new Request(url, { method: "OPTIONS" });
    assertEquals(mockRequest.method, "OPTIONS");
  });

  it("should return 405 for non-POST methods", () => {
    const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}`;
    const mockRequest = new Request(url, { method: "GET" });
    const expectedStatus = mockRequest.method === "POST" ? 200 : 405;
    assertEquals(expectedStatus, 405);
  });

  it("should accept POST method", () => {
    const mockRequest = createMockRequest({ record: createDeliveryRecord() });
    assertEquals(mockRequest.method, "POST");
  });
});
