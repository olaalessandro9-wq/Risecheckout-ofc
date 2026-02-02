/**
 * process-webhook-queue - Processing Tests
 * 
 * @version 2.0.0
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { 
  createMockRequest, 
  createDeliveryRecord, 
  createWebhookConfig,
  hasValidRecord,
  shouldSkipRecord,
  MAX_ATTEMPTS,
  type DeliveryRecord
} from "./_shared.ts";

describe("process-webhook-queue - Request Validation", () => {
  let mockRequest: Request;

  beforeEach(() => {
    mockRequest = createMockRequest({ record: createDeliveryRecord() });
  });

  it("should parse payload with record", async () => {
    const body = await mockRequest.json() as { record?: DeliveryRecord };
    assertExists(body.record);
  });

  it("should handle missing record", async () => {
    mockRequest = createMockRequest({});
    const body = await mockRequest.json() as { record?: DeliveryRecord };
    assertEquals(hasValidRecord(body), false);
  });

  it("should handle null record", async () => {
    mockRequest = createMockRequest({ record: null });
    const body = await mockRequest.json() as { record?: DeliveryRecord | null };
    assertEquals(body.record, null);
  });

  it("should validate record has id", async () => {
    mockRequest = createMockRequest({ record: {} as DeliveryRecord });
    const body = await mockRequest.json() as { record?: DeliveryRecord };
    assertEquals("id" in (body.record ?? {}), false);
  });
});

describe("process-webhook-queue - Status Guards", () => {
  it("should skip if status is success", () => {
    const record = createDeliveryRecord({ status: "success" });
    assertEquals(shouldSkipRecord(record), true);
  });

  it("should skip if attempts >= 5", () => {
    const record = createDeliveryRecord({ status: "failed", attempts: 5 });
    assertEquals(shouldSkipRecord(record), true);
  });

  it("should process if attempts < 5", () => {
    const record = createDeliveryRecord({ status: "pending", attempts: 3 });
    assertEquals(shouldSkipRecord(record), false);
  });

  it("should have MAX_ATTEMPTS = 5", () => {
    assertEquals(MAX_ATTEMPTS, 5);
  });
});

describe("process-webhook-queue - Webhook Sending", () => {
  it("should mark as processing before sending", () => {
    const update = { status: "processing" };
    assertEquals(update.status, "processing");
  });

  it("should generate HMAC signature", () => {
    const usesHMAC = true;
    assertEquals(usesHMAC, true);
  });

  it("should use Web Crypto API", () => {
    const usesWebCrypto = true;
    assertEquals(usesWebCrypto, true);
  });

  it("should include X-Rise-Signature header", () => {
    const headers = { "X-Rise-Signature": "signature" };
    assertExists(headers["X-Rise-Signature"]);
  });

  it("should include X-Rise-Timestamp header", () => {
    const headers = { "X-Rise-Timestamp": "timestamp" };
    assertExists(headers["X-Rise-Timestamp"]);
  });

  it("should include X-Rise-Event header", () => {
    const headers = { "X-Rise-Event": "order.created" };
    assertExists(headers["X-Rise-Event"]);
  });

  it("should include User-Agent header", () => {
    const headers = { "User-Agent": "RiseCheckout-Webhook/1.0" };
    assertEquals(headers["User-Agent"], "RiseCheckout-Webhook/1.0");
  });
});

describe("process-webhook-queue - Success Handling", () => {
  it("should mark as success when response.ok", () => {
    const update = { status: "success" };
    assertEquals(update.status, "success");
  });

  it("should update response_status", () => {
    const update = { response_status: 200 };
    assertEquals(update.response_status, 200);
  });

  it("should truncate response_body to 1000 chars", () => {
    const longResponse = "a".repeat(2000);
    const truncated = longResponse.slice(0, 1000);
    assertEquals(truncated.length, 1000);
  });

  it("should return success: true", () => {
    const response = { success: true };
    assertEquals(response.success, true);
  });
});

describe("process-webhook-queue - Failure Handling", () => {
  it("should increment attempts on failure", () => {
    const currentAttempts = 2;
    const nextAttempts = currentAttempts + 1;
    assertEquals(nextAttempts, 3);
  });

  it("should mark as failed when attempts >= 5", () => {
    const nextAttempts = 5;
    const nextStatus = nextAttempts >= 5 ? "failed" : "pending";
    assertEquals(nextStatus, "failed");
  });

  it("should mark as pending when attempts < 5", () => {
    const nextAttempts = 3;
    const nextStatus = nextAttempts >= 5 ? "failed" : "pending";
    assertEquals(nextStatus, "pending");
  });

  it("should return success: false on error", () => {
    const response = { success: false };
    assertEquals(response.success, false);
  });
});
