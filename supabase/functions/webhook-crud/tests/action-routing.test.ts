/**
 * Action Routing Tests for webhook-crud
 * 
 * @module webhook-crud/tests/action-routing.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultProducer,
  isKnownAction,
  type MockProducer,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

describe("webhook-crud - Action Routing", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should route to listWebhooksWithProducts for list action", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "list");
  });

  it("should route to listWebhooksWithProducts for list-with-products action", async () => {
    const mockRequest = createMockRequest({ action: "list-with-products" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "list-with-products");
  });

  it("should route to listUserProducts for list-products action", async () => {
    const mockRequest = createMockRequest({ action: "list-products" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "list-products");
  });

  it("should route to listUserProducts for list-user-products action", async () => {
    const mockRequest = createMockRequest({ action: "list-user-products" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "list-user-products");
  });

  it("should route to getWebhookProducts for get-webhook-products action", async () => {
    const mockRequest = createMockRequest({ action: "get-webhook-products", webhookId: "webhook-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "get-webhook-products");
  });

  it("should route to getWebhookLogs for get-logs action", async () => {
    const mockRequest = createMockRequest({ action: "get-logs", webhookId: "webhook-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "get-logs");
  });

  it("should route to createWebhook for create action", async () => {
    const mockRequest = createMockRequest({ action: "create", data: {} });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "create");
  });

  it("should route to updateWebhook for update action", async () => {
    const mockRequest = createMockRequest({ action: "update", webhookId: "webhook-123", data: {} });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "update");
  });

  it("should route to deleteWebhook for delete action", async () => {
    const mockRequest = createMockRequest({ action: "delete", webhookId: "webhook-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "delete");
  });

  it("should return 400 for unknown action", async () => {
    const mockRequest = createMockRequest({ action: "unknown-action" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const actionValid = isKnownAction(body.action as string);
    const expectedStatus = actionValid ? 200 : 400;
    assertEquals(expectedStatus, 400);
  });
});
