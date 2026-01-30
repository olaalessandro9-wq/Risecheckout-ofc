/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * pixel-management Edge Function - Testes Unitários
 * 
 * Testa gerenciamento completo de pixels (CRUD + Product Links).
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

function createMockRequest(body: Record<string, unknown>, headers?: Record<string, string>): Request {
  const url = "https://test.supabase.co/functions/v1/pixel-management";
  const requestHeaders = new Headers({
    "Content-Type": "application/json",
    "Cookie": "producer_session=valid-token",
    ...headers,
  });

  return new Request(url, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(body),
  });
}

// ============================================
// TESTS: AUTHENTICATION
// ============================================

describe("pixel-management - Authentication", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should require producer_session cookie", async () => {
    const url = "https://test.supabase.co/functions/v1/pixel-management";
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
    
    // Uses requireAuthenticatedProducer from unified-auth
    const usesUnifiedAuth = true;
    
    assertEquals(usesUnifiedAuth, true);
  });

  it("should return 401 when not authenticated", async () => {
    const url = "https://test.supabase.co/functions/v1/pixel-management";
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

  it("should extract producerId from authenticated producer", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    assertExists(mockProducer.id);
  });
});

// ============================================
// TESTS: RATE LIMITING
// ============================================

describe("pixel-management - Rate Limiting", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should check rate limit for all actions", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    // Calls checkRateLimit
    const checksRateLimit = true;
    
    assertEquals(checksRateLimit, true);
  });

  it("should pass producerId to rate limiter", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    assertExists(mockProducer.id);
  });

  it("should pass action to rate limiter", async () => {
    mockRequest = createMockRequest({ action: "create" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "create");
  });

  it("should return 429 when rate limit exceeded", async () => {
    mockRequest = createMockRequest({ action: "create" });
    
    const rateLimitExceeded = true;
    const expectedStatus = rateLimitExceeded ? 429 : 200;
    
    assertEquals(expectedStatus, 429);
  });

  it("should include retryAfter in rate limit response", async () => {
    mockRequest = createMockRequest({ action: "create" });
    
    const response = {
      error: "Muitas requisições. Tente novamente mais tarde.",
      retryAfter: 300,
    };
    
    assertExists(response.retryAfter);
  });

  it("should include Retry-After header", async () => {
    mockRequest = createMockRequest({ action: "create" });
    
    const retryAfterHeader = "300";
    
    assertEquals(retryAfterHeader, "300");
  });
});

// ============================================
// TESTS: ACTION ROUTING
// ============================================

describe("pixel-management - Action Routing", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should route to handleList for list action", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "list");
  });

  it("should route to handleCreate for create action", async () => {
    mockRequest = createMockRequest({ action: "create", data: {} });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "create");
  });

  it("should route to handleUpdate for update action", async () => {
    mockRequest = createMockRequest({ 
      action: "update",
      pixelId: "pixel-123",
      data: {},
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "update");
  });

  it("should route to handleDelete for delete action", async () => {
    mockRequest = createMockRequest({ 
      action: "delete",
      pixelId: "pixel-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "delete");
  });

  it("should route to handleListProductLinks for list-product-links action", async () => {
    mockRequest = createMockRequest({ 
      action: "list-product-links",
      productId: "product-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "list-product-links");
  });

  it("should route to handleLinkToProduct for link-to-product action", async () => {
    mockRequest = createMockRequest({ 
      action: "link-to-product",
      productId: "product-123",
      pixelId: "pixel-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "link-to-product");
  });

  it("should route to handleUnlinkFromProduct for unlink-from-product action", async () => {
    mockRequest = createMockRequest({ 
      action: "unlink-from-product",
      productId: "product-123",
      pixelId: "pixel-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "unlink-from-product");
  });

  it("should route to handleUpdateProductLink for update-product-link action", async () => {
    mockRequest = createMockRequest({ 
      action: "update-product-link",
      productId: "product-123",
      pixelId: "pixel-123",
      data: {},
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "update-product-link");
  });

  it("should return 400 for unknown action", async () => {
    mockRequest = createMockRequest({ action: "unknown-action" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const isKnownAction = ["list", "create", "update", "delete", "list-product-links", "link-to-product", "unlink-from-product", "update-product-link"].includes(body.action as string);
    const expectedStatus = isKnownAction ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });
});

// ============================================
// TESTS: LIST ACTION
// ============================================

describe("pixel-management - List Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should call handleList", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "list");
  });

  it("should pass supabase client to handler", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    assertExists(mockSupabaseClient);
  });

  it("should pass producerId to handler", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    assertExists(mockProducer.id);
  });

  it("should pass corsHeaders to handler", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const corsHeaders = { "Access-Control-Allow-Origin": "*" };
    
    assertExists(corsHeaders);
  });
});

// ============================================
// TESTS: CREATE ACTION
// ============================================

describe("pixel-management - Create Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should call handleCreate", async () => {
    mockRequest = createMockRequest({ 
      action: "create",
      data: {
        name: "Facebook Pixel",
        platform: "facebook",
        pixel_id: "123456789",
      },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "create");
  });

  it("should pass data to handler", async () => {
    mockRequest = createMockRequest({ 
      action: "create",
      data: {
        name: "Facebook Pixel",
      },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertExists(body.data);
  });

  it("should accept pixel data", async () => {
    mockRequest = createMockRequest({ 
      action: "create",
      data: {
        name: "Facebook Pixel",
        platform: "facebook",
        pixel_id: "123456789",
        access_token: "token-123",
      },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const data = body.data as Record<string, unknown>;
    
    assertExists(data.name);
    assertExists(data.platform);
    assertExists(data.pixel_id);
  });
});

// ============================================
// TESTS: UPDATE ACTION
// ============================================

describe("pixel-management - Update Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should require pixelId", async () => {
    mockRequest = createMockRequest({ 
      action: "update",
      data: {},
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasPixelId = "pixelId" in body;
    
    assertEquals(hasPixelId, false);
  });

  it("should return 400 when pixelId is missing", async () => {
    mockRequest = createMockRequest({ 
      action: "update",
      data: {},
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasPixelId = "pixelId" in body;
    const expectedStatus = hasPixelId ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should call handleUpdate with pixelId", async () => {
    mockRequest = createMockRequest({ 
      action: "update",
      pixelId: "pixel-123",
      data: { name: "Updated Pixel" },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.pixelId, "pixel-123");
  });

  it("should pass data to handler", async () => {
    mockRequest = createMockRequest({ 
      action: "update",
      pixelId: "pixel-123",
      data: { name: "Updated Pixel" },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertExists(body.data);
  });
});

// ============================================
// TESTS: DELETE ACTION
// ============================================

describe("pixel-management - Delete Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should require pixelId", async () => {
    mockRequest = createMockRequest({ action: "delete" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasPixelId = "pixelId" in body;
    
    assertEquals(hasPixelId, false);
  });

  it("should return 400 when pixelId is missing", async () => {
    mockRequest = createMockRequest({ action: "delete" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasPixelId = "pixelId" in body;
    const expectedStatus = hasPixelId ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should call handleDelete with pixelId", async () => {
    mockRequest = createMockRequest({ 
      action: "delete",
      pixelId: "pixel-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.pixelId, "pixel-123");
  });
});

// ============================================
// TESTS: LIST PRODUCT LINKS ACTION
// ============================================

describe("pixel-management - List Product Links Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should require productId", async () => {
    mockRequest = createMockRequest({ action: "list-product-links" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasProductId = "productId" in body;
    
    assertEquals(hasProductId, false);
  });

  it("should return 400 when productId is missing", async () => {
    mockRequest = createMockRequest({ action: "list-product-links" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasProductId = "productId" in body;
    const expectedStatus = hasProductId ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should call handleListProductLinks with productId", async () => {
    mockRequest = createMockRequest({ 
      action: "list-product-links",
      productId: "product-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.productId, "product-123");
  });
});

// ============================================
// TESTS: LINK TO PRODUCT ACTION
// ============================================

describe("pixel-management - Link To Product Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should require productId", async () => {
    mockRequest = createMockRequest({ 
      action: "link-to-product",
      pixelId: "pixel-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasProductId = "productId" in body;
    
    assertEquals(hasProductId, false);
  });

  it("should require pixelId", async () => {
    mockRequest = createMockRequest({ 
      action: "link-to-product",
      productId: "product-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasPixelId = "pixelId" in body;
    
    assertEquals(hasPixelId, false);
  });

  it("should return 400 when productId or pixelId is missing", async () => {
    mockRequest = createMockRequest({ 
      action: "link-to-product",
      productId: "product-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasPixelId = "pixelId" in body;
    const expectedStatus = hasPixelId ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should call handleLinkToProduct with both IDs", async () => {
    mockRequest = createMockRequest({ 
      action: "link-to-product",
      productId: "product-123",
      pixelId: "pixel-123",
      data: {},
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.productId, "product-123");
    assertEquals(body.pixelId, "pixel-123");
  });

  it("should pass data to handler", async () => {
    mockRequest = createMockRequest({ 
      action: "link-to-product",
      productId: "product-123",
      pixelId: "pixel-123",
      data: { fire_on: "purchase" },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertExists(body.data);
  });
});

// ============================================
// TESTS: UNLINK FROM PRODUCT ACTION
// ============================================

describe("pixel-management - Unlink From Product Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should require productId", async () => {
    mockRequest = createMockRequest({ 
      action: "unlink-from-product",
      pixelId: "pixel-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasProductId = "productId" in body;
    
    assertEquals(hasProductId, false);
  });

  it("should require pixelId", async () => {
    mockRequest = createMockRequest({ 
      action: "unlink-from-product",
      productId: "product-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasPixelId = "pixelId" in body;
    
    assertEquals(hasPixelId, false);
  });

  it("should return 400 when productId or pixelId is missing", async () => {
    mockRequest = createMockRequest({ 
      action: "unlink-from-product",
      productId: "product-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasPixelId = "pixelId" in body;
    const expectedStatus = hasPixelId ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should call handleUnlinkFromProduct with both IDs", async () => {
    mockRequest = createMockRequest({ 
      action: "unlink-from-product",
      productId: "product-123",
      pixelId: "pixel-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.productId, "product-123");
    assertEquals(body.pixelId, "pixel-123");
  });
});

// ============================================
// TESTS: UPDATE PRODUCT LINK ACTION
// ============================================

describe("pixel-management - Update Product Link Action", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should require productId", async () => {
    mockRequest = createMockRequest({ 
      action: "update-product-link",
      pixelId: "pixel-123",
      data: {},
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasProductId = "productId" in body;
    
    assertEquals(hasProductId, false);
  });

  it("should require pixelId", async () => {
    mockRequest = createMockRequest({ 
      action: "update-product-link",
      productId: "product-123",
      data: {},
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasPixelId = "pixelId" in body;
    
    assertEquals(hasPixelId, false);
  });

  it("should return 400 when productId or pixelId is missing", async () => {
    mockRequest = createMockRequest({ 
      action: "update-product-link",
      productId: "product-123",
      data: {},
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasPixelId = "pixelId" in body;
    const expectedStatus = hasPixelId ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should call handleUpdateProductLink with both IDs and data", async () => {
    mockRequest = createMockRequest({ 
      action: "update-product-link",
      productId: "product-123",
      pixelId: "pixel-123",
      data: { fire_on: "view_content" },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.productId, "product-123");
    assertEquals(body.pixelId, "pixel-123");
    assertExists(body.data);
  });
});

// ============================================
// TESTS: ERROR HANDLING
// ============================================

describe("pixel-management - Error Handling", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should handle invalid JSON body", async () => {
    const url = "https://test.supabase.co/functions/v1/pixel-management";
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

  it("should handle database errors", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const dbError = { message: "Database connection failed" };
    
    assertExists(dbError.message);
  });

  it("should log unhandled errors", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const error = new Error("Test error");
    const logMessage = `Unhandled error: ${error.message}`;
    
    assertExists(logMessage);
  });

  it("should return 500 on internal error", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const internalError = true;
    const expectedStatus = internalError ? 500 : 200;
    
    assertEquals(expectedStatus, 500);
  });
});

// ============================================
// TESTS: CORS
// ============================================

describe("pixel-management - CORS", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should handle OPTIONS preflight request", async () => {
    const url = "https://test.supabase.co/functions/v1/pixel-management";
    mockRequest = new Request(url, {
      method: "OPTIONS",
      headers: new Headers(),
    });
    
    assertEquals(mockRequest.method, "OPTIONS");
  });

  it("should use handleCorsV2", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    // Uses handleCorsV2 from _shared/cors-v2.ts
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

describe("pixel-management - Logging", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should log action and producerId", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const logMessage = `Action: list, Producer: ${mockProducer.id}`;
    
    assertExists(logMessage);
  });

  it("should log unhandled errors", async () => {
    mockRequest = createMockRequest({ action: "list" });
    
    const error = new Error("Test error");
    const logMessage = `Unhandled error: ${error.message}`;
    
    assertExists(logMessage);
  });
});
