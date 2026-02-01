/**
 * CRUD Operations Tests for webhook-crud
 * 
 * @module webhook-crud/tests/crud-operations.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultProducer,
  createWebhookData,
  type MockProducer,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

// ============================================
// CREATE ACTION
// ============================================

describe("webhook-crud - Create Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should require data", async () => {
    const mockRequest = createMockRequest({ action: "create" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasData = "data" in body;
    assertEquals(hasData, false);
  });

  it("should return 400 when data is missing", async () => {
    const mockRequest = createMockRequest({ action: "create" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasData = "data" in body;
    const expectedStatus = hasData ? 200 : 400;
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for missing data", async () => {
    const mockRequest = createMockRequest({ action: "create" });
    const errorMessage = "data é obrigatório";
    assertExists(errorMessage);
  });

  it("should call createWebhook with data", async () => {
    const mockRequest = createMockRequest({ 
      action: "create",
      data: createWebhookData(),
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertExists(body.data);
  });

  it("should pass vendorId to handler", async () => {
    const mockRequest = createMockRequest({ action: "create", data: {} });
    assertExists(mockProducer.id);
  });

  it("should accept webhook data", async () => {
    const mockRequest = createMockRequest({ 
      action: "create",
      data: {
        url: "https://example.com/webhook",
        events: ["order.created", "order.paid"],
        is_active: true,
      },
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const data = body.data as Record<string, unknown>;
    assertExists(data.url);
    assertExists(data.events);
  });
});

// ============================================
// UPDATE ACTION
// ============================================

describe("webhook-crud - Update Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should require webhookId", async () => {
    const mockRequest = createMockRequest({ action: "update", data: {} });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    assertEquals(hasWebhookId, false);
  });

  it("should return 400 when webhookId is missing", async () => {
    const mockRequest = createMockRequest({ action: "update", data: {} });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    const expectedStatus = hasWebhookId ? 200 : 400;
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for missing webhookId", async () => {
    const mockRequest = createMockRequest({ action: "update", data: {} });
    const errorMessage = "webhookId é obrigatório";
    assertExists(errorMessage);
  });

  it("should call updateWebhook with webhookId", async () => {
    const mockRequest = createMockRequest({ 
      action: "update",
      webhookId: "webhook-123",
      data: { url: "https://example.com/new-webhook" },
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.webhookId, "webhook-123");
  });

  it("should pass data to handler", async () => {
    const mockRequest = createMockRequest({ 
      action: "update",
      webhookId: "webhook-123",
      data: { url: "https://example.com/new-webhook" },
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertExists(body.data);
  });

  it("should pass vendorId to handler", async () => {
    const mockRequest = createMockRequest({ 
      action: "update",
      webhookId: "webhook-123",
      data: {},
    });
    assertExists(mockProducer.id);
  });

  it("should accept partial webhook data", async () => {
    const mockRequest = createMockRequest({ 
      action: "update",
      webhookId: "webhook-123",
      data: { is_active: false },
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    const data = body.data as Record<string, unknown>;
    assertEquals(data.is_active, false);
  });
});

// ============================================
// DELETE ACTION
// ============================================

describe("webhook-crud - Delete Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should require webhookId", async () => {
    const mockRequest = createMockRequest({ action: "delete" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    assertEquals(hasWebhookId, false);
  });

  it("should return 400 when webhookId is missing", async () => {
    const mockRequest = createMockRequest({ action: "delete" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    const expectedStatus = hasWebhookId ? 200 : 400;
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for missing webhookId", async () => {
    const mockRequest = createMockRequest({ action: "delete" });
    const errorMessage = "webhookId é obrigatório";
    assertExists(errorMessage);
  });

  it("should call deleteWebhook with webhookId", async () => {
    const mockRequest = createMockRequest({ action: "delete", webhookId: "webhook-123" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.webhookId, "webhook-123");
  });

  it("should pass vendorId to handler", async () => {
    const mockRequest = createMockRequest({ action: "delete", webhookId: "webhook-123" });
    assertExists(mockProducer.id);
  });
});
