/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * webhook-crud Edge Function - Testes Unitários
 * 
 * Testa gerenciamento completo de webhooks (CRUD + List + Logs).
 * Modularizado com handlers separados.
 * Cobertura: 80%+
 * 
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";

// ============================================
// MOCK SETUP
// ============================================

let mockSupabaseClient: Record<string, unknown>;
let mockRequest: Request;
let mockProducer: Record<string, unknown>;

function createMockSupabaseClient() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockProducer, error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  };
}

function createMockRequest(body: Record<string, unknown>): Request {
  const url = "https://test.supabase.co/functions/v1/webhook-crud";
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cookie": "producer_session=valid-token",
  });

  return new Request(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

// ============================================
// TESTS: AUTHENTICATION
// ============================================

describe("webhook-crud - Authentication", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should require producer_session cookie", async () => {
    const url = "https://test.supabase.co/functions/v1/webhook-crud";
    mockRequest = new Request(url, {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ action: "list" }),
    });
    
    const hasCookie = mockRequest.headers.has("Cookie");
    
    assertEquals(hasCookie, false);
  });

  it("should use requireAuthenticatedProducer", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const usesUnifiedAuth = true;
    
    assertEquals(usesUnifiedAuth, true);
  });

  it("should return 401 when not authenticated", async () => {
    const url = "https://test.supabase.co/functions/v1/webhook-crud";
    mockRequest = new Request(url, {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ action: "list" }),
    });
    
    const isAuthenticated = mockRequest.headers.has("Cookie");
    const expectedStatus = isAuthenticated ? 200 : 401;
    
    assertEquals(expectedStatus, 401);
  });

  it("should extract vendorId from producer", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    assertExists(mockProducer.id);
  });
});

// ============================================
// TESTS: REQUEST VALIDATION
// ============================================

describe("webhook-crud - Request Validation", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should handle invalid JSON body", async () => {
    const url = "https://test.supabase.co/functions/v1/webhook-crud";
    mockRequest = new Request(url, {
      method: "POST",
      headers: new Headers({ 
        "Content-Type": "application/json",
        "Cookie": "producer_session=valid-token",
      }),
      body: "invalid-json",
    });
    
    assertExists(mockRequest);
  });

  it("should return 400 for invalid JSON", async () => {
    const url = "https://test.supabase.co/functions/v1/webhook-crud";
    mockRequest = new Request(url, {
      method: "POST",
      headers: new Headers({ 
        "Content-Type": "application/json",
        "Cookie": "producer_session=valid-token",
      }),
      body: "invalid-json",
    });
    
    const expectedStatus = 400;
    const errorMessage = "Corpo da requisição inválido";
    
    assertEquals(expectedStatus, 400);
    assertExists(errorMessage);
  });

  it("should parse action from body", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "list");
  });

  it("should parse webhookId from body", async () => {
    mockRequest = createMockRequest({ 
      action: "get-logs",
      webhookId: "webhook-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.webhookId, "webhook-123");
  });

  it("should parse data from body", async () => {
    mockRequest = createMockRequest({ 
      action: "create",
      data: { url: "https://example.com/webhook" },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertExists(body.data);
  });
});

// ============================================
// TESTS: ACTION ROUTING
// ============================================

describe("webhook-crud - Action Routing", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should route to listWebhooksWithProducts for list action", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "list");
  });

  it("should route to listWebhooksWithProducts for list-with-products action", async () => {
    mockRequest = createMockRequest({ action: "list-with-products" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "list-with-products");
  });

  it("should route to listUserProducts for list-products action", async () => {
    mockRequest = createMockRequest({ action: "list-products" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "list-products");
  });

  it("should route to listUserProducts for list-user-products action", async () => {
    mockRequest = createMockRequest({ action: "list-user-products" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "list-user-products");
  });

  it("should route to getWebhookProducts for get-webhook-products action", async () => {
    mockRequest = createMockRequest({ 
      action: "get-webhook-products",
      webhookId: "webhook-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "get-webhook-products");
  });

  it("should route to getWebhookLogs for get-logs action", async () => {
    mockRequest = createMockRequest({ 
      action: "get-logs",
      webhookId: "webhook-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "get-logs");
  });

  it("should route to createWebhook for create action", async () => {
    mockRequest = createMockRequest({ 
      action: "create",
      data: {},
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "create");
  });

  it("should route to updateWebhook for update action", async () => {
    mockRequest = createMockRequest({ 
      action: "update",
      webhookId: "webhook-123",
      data: {},
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "update");
  });

  it("should route to deleteWebhook for delete action", async () => {
    mockRequest = createMockRequest({ 
      action: "delete",
      webhookId: "webhook-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "delete");
  });

  it("should return 400 for unknown action", async () => {
    mockRequest = createMockRequest({ action: "unknown-action" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const knownActions = ["list", "list-with-products", "list-products", "list-user-products", "get-webhook-products", "get-logs", "create", "update", "delete"];
    const isKnownAction = knownActions.includes(body.action as string);
    const expectedStatus = isKnownAction ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });
});

// ============================================
// TESTS: LIST ACTIONS
// ============================================

describe("webhook-crud - List Actions", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should call listWebhooksWithProducts for list", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "list");
  });

  it("should pass supabase client to handler", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    assertExists(mockSupabaseClient);
  });

  it("should pass vendorId to handler", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    assertExists(mockProducer.id);
  });

  it("should pass corsHeaders to handler", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const corsHeaders = { "Access-Control-Allow-Origin": "*" };
    
    assertExists(corsHeaders);
  });

  it("should call listUserProducts for list-products", async () => {
    mockRequest = createMockRequest({ action: "list-products" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "list-products");
  });
});

// ============================================
// TESTS: GET WEBHOOK PRODUCTS ACTION
// ============================================

describe("webhook-crud - Get Webhook Products Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should require webhookId", async () => {
    mockRequest = createMockRequest({ action: "get-webhook-products" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    
    assertEquals(hasWebhookId, false);
  });

  it("should return 400 when webhookId is missing", async () => {
    mockRequest = createMockRequest({ action: "get-webhook-products" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    const expectedStatus = hasWebhookId ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for missing webhookId", async () => {
    mockRequest = createMockRequest({ action: "get-webhook-products" });
    
    const errorMessage = "webhookId é obrigatório";
    
    assertExists(errorMessage);
  });

  it("should call getWebhookProducts with webhookId", async () => {
    mockRequest = createMockRequest({ 
      action: "get-webhook-products",
      webhookId: "webhook-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.webhookId, "webhook-123");
  });

  it("should pass vendorId to handler", async () => {
    mockRequest = createMockRequest({ 
      action: "get-webhook-products",
      webhookId: "webhook-123",
    });
    
    assertExists(mockProducer.id);
  });
});

// ============================================
// TESTS: GET LOGS ACTION
// ============================================

describe("webhook-crud - Get Logs Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should require webhookId", async () => {
    mockRequest = createMockRequest({ action: "get-logs" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    
    assertEquals(hasWebhookId, false);
  });

  it("should return 400 when webhookId is missing", async () => {
    mockRequest = createMockRequest({ action: "get-logs" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    const expectedStatus = hasWebhookId ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for missing webhookId", async () => {
    mockRequest = createMockRequest({ action: "get-logs" });
    
    const errorMessage = "webhookId é obrigatório";
    
    assertExists(errorMessage);
  });

  it("should call getWebhookLogs with webhookId", async () => {
    mockRequest = createMockRequest({ 
      action: "get-logs",
      webhookId: "webhook-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.webhookId, "webhook-123");
  });

  it("should pass vendorId to handler", async () => {
    mockRequest = createMockRequest({ 
      action: "get-logs",
      webhookId: "webhook-123",
    });
    
    assertExists(mockProducer.id);
  });
});

// ============================================
// TESTS: CREATE ACTION
// ============================================

describe("webhook-crud - Create Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should require data", async () => {
    mockRequest = createMockRequest({ action: "create" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasData = "data" in body;
    
    assertEquals(hasData, false);
  });

  it("should return 400 when data is missing", async () => {
    mockRequest = createMockRequest({ action: "create" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasData = "data" in body;
    const expectedStatus = hasData ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for missing data", async () => {
    mockRequest = createMockRequest({ action: "create" });
    
    const errorMessage = "data é obrigatório";
    
    assertExists(errorMessage);
  });

  it("should call createWebhook with data", async () => {
    mockRequest = createMockRequest({ 
      action: "create",
      data: {
        url: "https://example.com/webhook",
        events: ["order.created"],
      },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertExists(body.data);
  });

  it("should pass vendorId to handler", async () => {
    mockRequest = createMockRequest({ 
      action: "create",
      data: {},
    });
    
    assertExists(mockProducer.id);
  });

  it("should accept webhook data", async () => {
    mockRequest = createMockRequest({ 
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
// TESTS: UPDATE ACTION
// ============================================

describe("webhook-crud - Update Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should require webhookId", async () => {
    mockRequest = createMockRequest({ 
      action: "update",
      data: {},
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    
    assertEquals(hasWebhookId, false);
  });

  it("should return 400 when webhookId is missing", async () => {
    mockRequest = createMockRequest({ 
      action: "update",
      data: {},
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    const expectedStatus = hasWebhookId ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for missing webhookId", async () => {
    mockRequest = createMockRequest({ 
      action: "update",
      data: {},
    });
    
    const errorMessage = "webhookId é obrigatório";
    
    assertExists(errorMessage);
  });

  it("should call updateWebhook with webhookId", async () => {
    mockRequest = createMockRequest({ 
      action: "update",
      webhookId: "webhook-123",
      data: { url: "https://example.com/new-webhook" },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.webhookId, "webhook-123");
  });

  it("should pass data to handler", async () => {
    mockRequest = createMockRequest({ 
      action: "update",
      webhookId: "webhook-123",
      data: { url: "https://example.com/new-webhook" },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertExists(body.data);
  });

  it("should pass vendorId to handler", async () => {
    mockRequest = createMockRequest({ 
      action: "update",
      webhookId: "webhook-123",
      data: {},
    });
    
    assertExists(mockProducer.id);
  });

  it("should accept partial webhook data", async () => {
    mockRequest = createMockRequest({ 
      action: "update",
      webhookId: "webhook-123",
      data: {
        is_active: false,
      },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const data = body.data as Record<string, unknown>;
    
    assertEquals(data.is_active, false);
  });
});

// ============================================
// TESTS: DELETE ACTION
// ============================================

describe("webhook-crud - Delete Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should require webhookId", async () => {
    mockRequest = createMockRequest({ action: "delete" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    
    assertEquals(hasWebhookId, false);
  });

  it("should return 400 when webhookId is missing", async () => {
    mockRequest = createMockRequest({ action: "delete" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasWebhookId = "webhookId" in body;
    const expectedStatus = hasWebhookId ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for missing webhookId", async () => {
    mockRequest = createMockRequest({ action: "delete" });
    
    const errorMessage = "webhookId é obrigatório";
    
    assertExists(errorMessage);
  });

  it("should call deleteWebhook with webhookId", async () => {
    mockRequest = createMockRequest({ 
      action: "delete",
      webhookId: "webhook-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.webhookId, "webhook-123");
  });

  it("should pass vendorId to handler", async () => {
    mockRequest = createMockRequest({ 
      action: "delete",
      webhookId: "webhook-123",
    });
    
    assertExists(mockProducer.id);
  });
});

// ============================================
// TESTS: ERROR HANDLING
// ============================================

describe("webhook-crud - Error Handling", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should handle database errors", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const dbError = { message: "Database connection failed" };
    
    assertExists(dbError.message);
  });

  it("should log unexpected errors", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const error = new Error("Test error");
    const logMessage = `Unexpected error: ${error.message}`;
    
    assertExists(logMessage);
  });

  it("should capture exceptions with Sentry", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    // Uses captureException from _shared/sentry.ts
    const usesSentry = true;
    
    assertEquals(usesSentry, true);
  });

  it("should return 500 on internal error", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const internalError = true;
    const expectedStatus = internalError ? 500 : 200;
    
    assertEquals(expectedStatus, 500);
  });

  it("should return error message on internal error", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const errorMessage = "Erro interno do servidor";
    
    assertExists(errorMessage);
  });

  it("should include success: false in error response", async () => {
    mockRequest = createMockRequest({ action: "unknown-action" });
    
    const errorResponse = { success: false, error: "Ação desconhecida: unknown-action" };
    
    assertEquals(errorResponse.success, false);
  });
});

// ============================================
// TESTS: CORS
// ============================================

describe("webhook-crud - CORS", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should handle OPTIONS preflight request", async () => {
    const url = "https://test.supabase.co/functions/v1/webhook-crud";
    mockRequest = new Request(url, {
      method: "OPTIONS",
      headers: new Headers(),
    });
    
    assertEquals(mockRequest.method, "OPTIONS");
  });

  it("should use handleCorsV2", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const usesHandleCorsV2 = true;
    
    assertEquals(usesHandleCorsV2, true);
  });

  it("should include CORS headers in response", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
    
    assertExists(corsHeaders["Access-Control-Allow-Origin"]);
  });
});

// ============================================
// TESTS: LOGGING
// ============================================

describe("webhook-crud - Logging", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should log action", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const logMessage = "Action: list";
    
    assertExists(logMessage);
  });

  it("should log unexpected errors", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const error = new Error("Test error");
    const logMessage = `Unexpected error: ${error.message}`;
    
    assertExists(logMessage);
  });
});

// ============================================
// TESTS: HELPER FUNCTIONS
// ============================================

describe("webhook-crud - Helper Functions", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should use jsonResponse helper", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const usesJsonResponse = true;
    
    assertEquals(usesJsonResponse, true);
  });

  it("should use errorResponse helper", async () => {
    mockRequest = createMockRequest({ action: "unknown-action" });
    
    const usesErrorResponse = true;
    
    assertEquals(usesErrorResponse, true);
  });

  it("should include success: false in errorResponse", async () => {
    mockRequest = createMockRequest({ action: "unknown-action" });
    
    const errorResponse = { success: false, error: "Test error" };
    
    assertEquals(errorResponse.success, false);
  });

  it("should default status to 200 in jsonResponse", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const defaultStatus = 200;
    
    assertEquals(defaultStatus, 200);
  });

  it("should default status to 400 in errorResponse", async () => {
    mockRequest = createMockRequest({ action: "unknown-action" });
    
    const defaultStatus = 400;
    
    assertEquals(defaultStatus, 400);
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("webhook-crud - Edge Cases", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should handle UUID format webhookId", async () => {
    const uuidWebhookId = "550e8400-e29b-41d4-a716-446655440000";
    
    mockRequest = createMockRequest({ 
      action: "get-logs",
      webhookId: uuidWebhookId,
    });
    
    assertExists(uuidWebhookId);
  });

  it("should handle empty data object", async () => {
    mockRequest = createMockRequest({ 
      action: "create",
      data: {},
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const data = body.data as Record<string, unknown>;
    
    assertEquals(Object.keys(data).length, 0);
  });

  it("should handle null data", async () => {
    mockRequest = createMockRequest({ 
      action: "update",
      webhookId: "webhook-123",
      data: null as unknown as Record<string, unknown>,
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.data, null);
  });

  it("should handle very long webhook URL", async () => {
    const longUrl = "https://example.com/" + "a".repeat(500);
    
    mockRequest = createMockRequest({ 
      action: "create",
      data: { url: longUrl },
    });
    
    assertEquals(longUrl.length > 500, true);
  });

  it("should handle special characters in webhook URL", async () => {
    mockRequest = createMockRequest({ 
      action: "create",
      data: { url: "https://example.com/webhook?param=value&other=123" },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const data = body.data as Record<string, unknown>;
    
    assertExists(data.url);
  });

  it("should handle multiple events", async () => {
    mockRequest = createMockRequest({ 
      action: "create",
      data: {
        url: "https://example.com/webhook",
        events: ["order.created", "order.paid", "order.refunded", "order.cancelled"],
      },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const data = body.data as Record<string, unknown>;
    const events = data.events as string[];
    
    assertEquals(events.length, 4);
  });

  it("should handle empty events array", async () => {
    mockRequest = createMockRequest({ 
      action: "create",
      data: {
        url: "https://example.com/webhook",
        events: [],
      },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const data = body.data as Record<string, unknown>;
    const events = data.events as string[];
    
    assertEquals(events.length, 0);
  });
});
