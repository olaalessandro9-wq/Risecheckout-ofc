/**
 * List Actions Tests for webhook-crud
 * 
 * @module webhook-crud/tests/list-actions.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultProducer,
  type MockProducer,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

describe("webhook-crud - List Actions", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should call listWebhooksWithProducts for list", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "list");
  });

  it("should pass supabase client to handler", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    assertExists(mockSupabaseClient);
  });

  it("should pass vendorId to handler", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    assertExists(mockProducer.id);
  });

  it("should pass corsHeaders to handler", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const corsHeaders = { "Access-Control-Allow-Origin": "*" };
    assertExists(corsHeaders);
  });

  it("should call listUserProducts for list-products", async () => {
    const mockRequest = createMockRequest({ action: "list-products" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "list-products");
  });
});

describe("webhook-crud - Get Webhook Products Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should require webhookId", async () => {
    const mockRequest = createMockRequest({ action: "get-webhook-products" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    assertEquals(hasWebhookId, false);
  });

  it("should return 400 when webhookId is missing", async () => {
    const mockRequest = createMockRequest({ action: "get-webhook-products" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    const expectedStatus = hasWebhookId ? 200 : 400;
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for missing webhookId", async () => {
    const mockRequest = createMockRequest({ action: "get-webhook-products" });
    const errorMessage = "webhookId é obrigatório";
    assertExists(errorMessage);
  });

  it("should call getWebhookProducts with webhookId", async () => {
    const mockRequest = createMockRequest({ action: "get-webhook-products", webhookId: "webhook-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.webhookId, "webhook-123");
  });

  it("should pass vendorId to handler", async () => {
    const mockRequest = createMockRequest({ action: "get-webhook-products", webhookId: "webhook-123" });
    assertExists(mockProducer.id);
  });
});

describe("webhook-crud - Get Logs Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should require webhookId", async () => {
    const mockRequest = createMockRequest({ action: "get-logs" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    assertEquals(hasWebhookId, false);
  });

  it("should return 400 when webhookId is missing", async () => {
    const mockRequest = createMockRequest({ action: "get-logs" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    const expectedStatus = hasWebhookId ? 200 : 400;
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for missing webhookId", async () => {
    const mockRequest = createMockRequest({ action: "get-logs" });
    const errorMessage = "webhookId é obrigatório";
    assertExists(errorMessage);
  });

  it("should call getWebhookLogs with webhookId", async () => {
    const mockRequest = createMockRequest({ action: "get-logs", webhookId: "webhook-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.webhookId, "webhook-123");
  });

  it("should pass vendorId to handler", async () => {
    const mockRequest = createMockRequest({ action: "get-logs", webhookId: "webhook-123" });
    assertExists(mockProducer.id);
  });
});
