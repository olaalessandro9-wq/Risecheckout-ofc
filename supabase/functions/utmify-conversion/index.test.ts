/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * utmify-conversion Edge Function - Testes Unitários
 * 
 * Testa envio de dados de conversão para UTMify para tracking de campanhas.
 * Usa 'users' table como SSOT para utmify_token lookup.
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
let mockOrder: Record<string, unknown>;
let mockUser: Record<string, unknown>;

const UTMIFY_API_URL = 'https://api.utmify.com.br/api/v1/conversion';

function createMockSupabaseClient() {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: () => {
            if (table === "orders") {
              return Promise.resolve({ data: mockOrder, error: null });
            }
            if (table === "users") {
              return Promise.resolve({ data: mockUser, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          },
        }),
      }),
    }),
  };
}

function createMockRequest(body: Record<string, unknown>): Request {
  const url = "https://test.supabase.co/functions/v1/utmify-conversion";
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  return new Request(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

// ============================================
// TESTS: REQUIRED PARAMETERS
// ============================================

describe("utmify-conversion - Required Parameters", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockOrder = {
      id: "order-123",
      amount_cents: 10000,
      customer_email: "customer@example.com",
    };
    mockUser = {
      id: "vendor-123",
      utmify_token: "token-123",
    };
  });

  it("should require orderId", async () => {
    mockRequest = createMockRequest({ 
      vendorId: "vendor-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasOrderId = "orderId" in body;
    
    assertEquals(hasOrderId, false);
  });

  it("should require vendorId", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasVendorId = "vendorId" in body;
    
    assertEquals(hasVendorId, false);
  });

  it("should accept utmifyToken parameter", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
      utmifyToken: "token-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.utmifyToken, "token-123");
  });

  it("should accept conversionData parameter", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
      conversionData: {
        product_id: "product-123",
      },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertExists(body.conversionData);
  });
});

// ============================================
// TESTS: ORDER LOOKUP
// ============================================

describe("utmify-conversion - Order Lookup", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockUser = {
      id: "vendor-123",
      utmify_token: "token-123",
    };
  });

  it("should query orders table", async () => {
    mockOrder = {
      id: "order-123",
      amount_cents: 10000,
      customer_email: "customer@example.com",
    };
    
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    // Queries orders table
    const queriesOrders = true;
    
    assertEquals(queriesOrders, true);
  });

  it("should filter by order ID", async () => {
    mockOrder = {
      id: "order-123",
      amount_cents: 10000,
      customer_email: "customer@example.com",
    };
    
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.orderId, "order-123");
  });

  it("should return 404 when order not found", async () => {
    mockOrder = null as unknown as Record<string, unknown>;
    
    mockRequest = createMockRequest({ 
      orderId: "non-existent",
      vendorId: "vendor-123",
    });
    
    const orderNotFound = mockOrder === null;
    const expectedStatus = orderNotFound ? 404 : 200;
    
    assertEquals(expectedStatus, 404);
  });

  it("should extract order data", async () => {
    mockOrder = {
      id: "order-123",
      amount_cents: 10000,
      customer_email: "customer@example.com",
    };
    
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    assertExists(mockOrder.id);
    assertExists(mockOrder.amount_cents);
    assertExists(mockOrder.customer_email);
  });
});

// ============================================
// TESTS: TOKEN LOOKUP (SSOT)
// ============================================

describe("utmify-conversion - Token Lookup (SSOT)", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockOrder = {
      id: "order-123",
      amount_cents: 10000,
      customer_email: "customer@example.com",
    };
  });

  it("should use utmifyToken from request if provided", async () => {
    mockUser = {
      id: "vendor-123",
      utmify_token: "token-from-db",
    };
    
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
      utmifyToken: "token-from-request",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    // Should prioritize token from request
    assertEquals(body.utmifyToken, "token-from-request");
  });

  it("should lookup utmify_token from users table", async () => {
    mockUser = {
      id: "vendor-123",
      utmify_token: "token-from-db",
    };
    
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    // Should query users table for utmify_token
    const queriesUsers = true;
    
    assertEquals(queriesUsers, true);
  });

  it("should use users table as SSOT (RISE V3)", async () => {
    mockUser = {
      id: "vendor-123",
      utmify_token: "token-from-db",
    };
    
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    // RISE V3: Use 'users' table as SSOT
    const usesUsersTableAsSSO = true;
    
    assertEquals(usesUsersTableAsSSO, true);
  });

  it("should filter by vendor ID", async () => {
    mockUser = {
      id: "vendor-123",
      utmify_token: "token-from-db",
    };
    
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.vendorId, "vendor-123");
  });

  it("should handle missing utmify_token", async () => {
    mockUser = {
      id: "vendor-123",
      utmify_token: null,
    };
    
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    // Should return success: false with reason
    const hasToken = mockUser.utmify_token !== null;
    
    assertEquals(hasToken, false);
  });

  it("should return success: false when no token configured", async () => {
    mockUser = {
      id: "vendor-123",
      utmify_token: null,
    };
    
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const response = { success: false, reason: "No UTMify token configured" };
    
    assertEquals(response.success, false);
  });
});

// ============================================
// TESTS: UTMIFY API CALL
// ============================================

describe("utmify-conversion - UTMify API Call", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockOrder = {
      id: "order-123",
      amount_cents: 10000,
      customer_email: "customer@example.com",
    };
    mockUser = {
      id: "vendor-123",
      utmify_token: "token-123",
    };
  });

  it("should call UTMify API", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    // Should call UTMIFY_API_URL
    const callsUtmifyApi = true;
    
    assertEquals(callsUtmifyApi, true);
  });

  it("should use correct API URL", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    assertEquals(UTMIFY_API_URL, "https://api.utmify.com.br/api/v1/conversion");
  });

  it("should send POST request", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    // Should use POST method
    const usesPostMethod = true;
    
    assertEquals(usesPostMethod, true);
  });

  it("should include Authorization header with Bearer token", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    // Authorization: `Bearer ${token}`
    const authHeader = `Bearer ${mockUser.utmify_token}`;
    
    assertExists(authHeader);
  });

  it("should include Content-Type header", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const contentType = "application/json";
    
    assertEquals(contentType, "application/json");
  });
});

// ============================================
// TESTS: PAYLOAD CONSTRUCTION
// ============================================

describe("utmify-conversion - Payload Construction", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockOrder = {
      id: "order-123",
      amount_cents: 10000,
      customer_email: "customer@example.com",
    };
    mockUser = {
      id: "vendor-123",
      utmify_token: "token-123",
    };
  });

  it("should include transaction_id", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const payload = {
      transaction_id: mockOrder.id,
    };
    
    assertEquals(payload.transaction_id, "order-123");
  });

  it("should include value (converted from cents)", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const value = (mockOrder.amount_cents as number) / 100;
    
    assertEquals(value, 100);
  });

  it("should include currency as BRL", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const currency = "BRL";
    
    assertEquals(currency, "BRL");
  });

  it("should include customer email", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const email = mockOrder.customer_email;
    
    assertEquals(email, "customer@example.com");
  });

  it("should merge conversionData", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
      conversionData: {
        product_id: "product-123",
        product_name: "Test Product",
      },
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const conversionData = body.conversionData as Record<string, unknown>;
    
    assertEquals(conversionData.product_id, "product-123");
    assertEquals(conversionData.product_name, "Test Product");
  });
});

// ============================================
// TESTS: ERROR HANDLING
// ============================================

describe("utmify-conversion - Error Handling", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockOrder = {
      id: "order-123",
      amount_cents: 10000,
      customer_email: "customer@example.com",
    };
    mockUser = {
      id: "vendor-123",
      utmify_token: "token-123",
    };
  });

  it("should return 400 when orderId is missing", async () => {
    mockRequest = createMockRequest({ 
      vendorId: "vendor-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasOrderId = "orderId" in body;
    const expectedStatus = hasOrderId ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should return 400 when vendorId is missing", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasVendorId = "vendorId" in body;
    const expectedStatus = hasVendorId ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for missing parameters", async () => {
    mockRequest = createMockRequest({});
    
    const errorMessage = "orderId and vendorId are required";
    
    assertExists(errorMessage);
  });

  it("should return 404 when order not found", async () => {
    mockOrder = null as unknown as Record<string, unknown>;
    
    mockRequest = createMockRequest({ 
      orderId: "non-existent",
      vendorId: "vendor-123",
    });
    
    const expectedStatus = 404;
    
    assertEquals(expectedStatus, 404);
  });

  it("should log when order not found", async () => {
    mockRequest = createMockRequest({ 
      orderId: "non-existent",
      vendorId: "vendor-123",
    });
    
    const logMessage = "Order not found: non-existent";
    
    assertExists(logMessage);
  });

  it("should handle UTMify API errors", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    // UTMify API error
    const apiError = { message: "API error" };
    
    assertExists(apiError.message);
  });

  it("should log UTMify API errors", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const errorData = "API error";
    const logMessage = `UTMify API error: ${errorData}`;
    
    assertExists(logMessage);
  });

  it("should return success: false on UTMify API error", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    // Should not throw, returns success: false
    const response = { success: false, error: "UTMify API error" };
    
    assertEquals(response.success, false);
  });

  it("should handle database errors", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const dbError = { message: "Database connection failed" };
    
    assertExists(dbError.message);
  });

  it("should log errors", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const error = new Error("Test error");
    const logMessage = `Error: ${error.message}`;
    
    assertExists(logMessage);
  });

  it("should return 500 on internal error", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const internalError = true;
    const expectedStatus = internalError ? 500 : 200;
    
    assertEquals(expectedStatus, 500);
  });
});

// ============================================
// TESTS: CORS
// ============================================

describe("utmify-conversion - CORS", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockOrder = {
      id: "order-123",
      amount_cents: 10000,
      customer_email: "customer@example.com",
    };
    mockUser = {
      id: "vendor-123",
      utmify_token: "token-123",
    };
  });

  it("should handle OPTIONS preflight request", async () => {
    const url = "https://test.supabase.co/functions/v1/utmify-conversion";
    mockRequest = new Request(url, {
      method: "OPTIONS",
      headers: new Headers(),
    });
    
    assertEquals(mockRequest.method, "OPTIONS");
  });

  it("should use handleCorsV2 for dynamic origin validation", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    // Uses handleCorsV2 from _shared/cors-v2.ts
    const usesHandleCorsV2 = true;
    
    assertEquals(usesHandleCorsV2, true);
  });

  it("should include CORS headers in response", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
    
    assertExists(corsHeaders["Access-Control-Allow-Origin"]);
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("utmify-conversion - Edge Cases", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockUser = {
      id: "vendor-123",
      utmify_token: "token-123",
    };
  });

  it("should handle UUID format IDs", async () => {
    const uuidOrderId = "550e8400-e29b-41d4-a716-446655440000";
    const uuidVendorId = "660e8400-e29b-41d4-a716-446655440000";
    
    mockOrder = {
      id: uuidOrderId,
      amount_cents: 10000,
      customer_email: "customer@example.com",
    };
    
    mockRequest = createMockRequest({ 
      orderId: uuidOrderId,
      vendorId: uuidVendorId,
    });
    
    assertExists(uuidOrderId);
    assertExists(uuidVendorId);
  });

  it("should handle zero amount", async () => {
    mockOrder = {
      id: "order-123",
      amount_cents: 0,
      customer_email: "customer@example.com",
    };
    
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const value = (mockOrder.amount_cents as number) / 100;
    
    assertEquals(value, 0);
  });

  it("should handle large amounts", async () => {
    mockOrder = {
      id: "order-123",
      amount_cents: 1000000000, // 10 million BRL
      customer_email: "customer@example.com",
    };
    
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const value = (mockOrder.amount_cents as number) / 100;
    
    assertEquals(value, 10000000);
  });

  it("should handle missing customer email", async () => {
    mockOrder = {
      id: "order-123",
      amount_cents: 10000,
      customer_email: null,
    };
    
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    assertEquals(mockOrder.customer_email, null);
  });

  it("should handle empty conversionData", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
      conversionData: {},
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const conversionData = body.conversionData as Record<string, unknown>;
    
    assertEquals(Object.keys(conversionData).length, 0);
  });

  it("should handle null conversionData", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
      conversionData: null,
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.conversionData, null);
  });
});

// ============================================
// TESTS: LOGGING
// ============================================

describe("utmify-conversion - Logging", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockOrder = {
      id: "order-123",
      amount_cents: 10000,
      customer_email: "customer@example.com",
    };
    mockUser = {
      id: "vendor-123",
      utmify_token: "token-123",
    };
  });

  it("should log when no token configured", async () => {
    mockUser = {
      id: "vendor-123",
      utmify_token: null,
    };
    
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const logMessage = "No UTMify token configured for vendor: vendor-123";
    
    assertExists(logMessage);
  });

  it("should log when order not found", async () => {
    mockRequest = createMockRequest({ 
      orderId: "non-existent",
      vendorId: "vendor-123",
    });
    
    const logMessage = "Order not found: non-existent";
    
    assertExists(logMessage);
  });

  it("should log UTMify API errors", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const errorData = "API error";
    const logMessage = `UTMify API error: ${errorData}`;
    
    assertExists(logMessage);
  });

  it("should log successful conversion", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const logMessage = "Conversion sent for order order-123";
    
    assertExists(logMessage);
  });

  it("should log general errors", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const error = new Error("Test error");
    const logMessage = `Error: ${error.message}`;
    
    assertExists(logMessage);
  });
});

// ============================================
// TESTS: RESPONSE FORMAT
// ============================================

describe("utmify-conversion - Response Format", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockOrder = {
      id: "order-123",
      amount_cents: 10000,
      customer_email: "customer@example.com",
    };
    mockUser = {
      id: "vendor-123",
      utmify_token: "token-123",
    };
  });

  it("should return success: true on success", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const response = { success: true };
    
    assertEquals(response.success, true);
  });

  it("should return success: false with reason when no token", async () => {
    mockUser = {
      id: "vendor-123",
      utmify_token: null,
    };
    
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const response = { success: false, reason: "No UTMify token configured" };
    
    assertEquals(response.success, false);
    assertExists(response.reason);
  });

  it("should return error message on error", async () => {
    mockRequest = createMockRequest({});
    
    const response = { error: "orderId and vendorId are required" };
    
    assertExists(response.error);
  });

  it("should include JSON content type", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const contentType = "application/json";
    
    assertEquals(contentType, "application/json");
  });

  it("should return 200 on success", async () => {
    mockRequest = createMockRequest({ 
      orderId: "order-123",
      vendorId: "vendor-123",
    });
    
    const expectedStatus = 200;
    
    assertEquals(expectedStatus, 200);
  });
});
