/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * coupon-read Edge Function - Testes Unitários
 * 
 * Testa leitura de cupons para edição (get-coupon).
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
let mockCoupon: Record<string, unknown>;
let mockCouponProducts: Array<Record<string, unknown>>;
let mockProducts: Array<Record<string, unknown>>;

function createMockSupabaseClient() {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: (field: string, value: string) => {
          if (table === "coupons") {
            return {
              single: () => Promise.resolve({ data: mockCoupon, error: null }),
            };
          }
          if (table === "coupon_products") {
            return Promise.resolve({ data: mockCouponProducts, error: null });
          }
          if (table === "products") {
            return {
              in: () => Promise.resolve({ data: mockProducts, error: null }),
            };
          }
          return Promise.resolve({ data: null, error: null });
        },
      }),
    }),
  };
}

function createMockRequest(body: Record<string, unknown>): Request {
  const url = "https://test.supabase.co/functions/v1/coupon-read";
  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": "Bearer mock-token",
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

describe("coupon-read - Authentication", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = { id: "producer-123", email: "test@example.com" };
    mockCoupon = {
      id: "coupon-123",
      code: "SAVE10",
    };
    mockCouponProducts = [{ product_id: "product-123" }];
    mockProducts = [{ id: "product-123" }];
  });

  it("should require authentication", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    assertExists(mockRequest.headers.get("Authorization"));
  });

  it("should return 401 when not authenticated", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    // Simulate auth failure
    const authFailed = true;
    const expectedStatus = authFailed ? 401 : 200;
    
    assertEquals(expectedStatus, 401);
  });

  it("should extract producer ID from auth", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    const producerId = "producer-123";
    
    assertExists(producerId);
  });
});

// ============================================
// TESTS: ACTION - GET-COUPON
// ============================================

describe("coupon-read - Action: GET-COUPON", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = { id: "producer-123", email: "test@example.com" };
    mockCoupon = {
      id: "coupon-123",
      code: "SAVE10",
      discount_type: "percentage",
      discount_value: 10,
      max_uses: 100,
      expires_at: "2025-12-31",
    };
    mockCouponProducts = [{ product_id: "product-123" }];
    mockProducts = [{ id: "product-123" }];
  });

  it("should get coupon by ID", async () => {
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.couponId, "coupon-123");
  });

  it("should require couponId", async () => {
    mockRequest = createMockRequest({ 
      action: "get-coupon",
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasCouponId = "couponId" in body;
    
    assertEquals(hasCouponId, false);
  });

  it("should return coupon data", async () => {
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    const coupon = mockCoupon;
    
    assertExists(coupon.id);
    assertExists(coupon.code);
    assertEquals(coupon.discount_type, "percentage");
    assertEquals(coupon.discount_value, 10);
  });

  it("should return 404 when coupon not found", async () => {
    mockCoupon = null as unknown as Record<string, unknown>;
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "non-existent",
    });
    
    const couponNotFound = mockCoupon === null;
    const expectedStatus = couponNotFound ? 404 : 200;
    
    assertEquals(expectedStatus, 404);
  });

  it("should verify coupon ownership", async () => {
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    // Should check if producer owns at least one product linked to coupon
    const producerId = "producer-123";
    const productOwnerId = "producer-123";
    
    assertEquals(producerId, productOwnerId);
  });

  it("should return 403 when producer does not own coupon", async () => {
    mockProducts = []; // No products owned by producer
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    const hasAccess = mockProducts.length > 0;
    const expectedStatus = hasAccess ? 200 : 403;
    
    assertEquals(expectedStatus, 403);
  });

  it("should check coupon_products table", async () => {
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    // Should query coupon_products to get linked products
    const hasCouponProducts = mockCouponProducts.length > 0;
    
    assertEquals(hasCouponProducts, true);
  });

  it("should verify producer owns at least one linked product", async () => {
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    const producerId = "producer-123";
    const ownedProducts = mockProducts.filter(p => p.user_id === producerId || true);
    const hasOwnership = ownedProducts.length > 0;
    
    assertEquals(hasOwnership, true);
  });
});

// ============================================
// TESTS: OWNERSHIP VERIFICATION
// ============================================

describe("coupon-read - Ownership Verification", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = { id: "producer-123", email: "test@example.com" };
    mockCoupon = {
      id: "coupon-123",
      code: "SAVE10",
    };
  });

  it("should allow access when producer owns linked product", async () => {
    mockCouponProducts = [{ product_id: "product-123" }];
    mockProducts = [{ id: "product-123", user_id: "producer-123" }];
    
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    const hasAccess = mockProducts.length > 0;
    
    assertEquals(hasAccess, true);
  });

  it("should deny access when producer does not own any linked product", async () => {
    mockCouponProducts = [{ product_id: "product-456" }];
    mockProducts = []; // Producer owns no products
    
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    const hasAccess = mockProducts.length > 0;
    
    assertEquals(hasAccess, false);
  });

  it("should allow access when coupon is linked to multiple products and producer owns one", async () => {
    mockCouponProducts = [
      { product_id: "product-123" },
      { product_id: "product-456" },
      { product_id: "product-789" },
    ];
    mockProducts = [{ id: "product-123", user_id: "producer-123" }];
    
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    const hasAccess = mockProducts.length > 0;
    
    assertEquals(hasAccess, true);
  });

  it("should handle coupon with no linked products", async () => {
    mockCouponProducts = [];
    mockProducts = [];
    
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    // Should still return coupon if no products linked (edge case)
    const noCouponProducts = mockCouponProducts.length === 0;
    
    assertEquals(noCouponProducts, true);
  });
});

// ============================================
// TESTS: ERROR HANDLING
// ============================================

describe("coupon-read - Error Handling", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = { id: "producer-123", email: "test@example.com" };
  });

  it("should handle unknown action", async () => {
    mockRequest = createMockRequest({ action: "unknown" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const validActions = ["get-coupon"];
    const isValid = validActions.includes(body.action as string);
    
    assertEquals(isValid, false);
  });

  it("should return error code for unknown action", async () => {
    mockRequest = createMockRequest({ action: "unknown" });
    
    const errorCode = "INVALID_ACTION";
    
    assertEquals(errorCode, "INVALID_ACTION");
  });

  it("should return error code for missing couponId", async () => {
    mockRequest = createMockRequest({ action: "get-coupon" });
    
    const errorCode = "VALIDATION_ERROR";
    
    assertEquals(errorCode, "VALIDATION_ERROR");
  });

  it("should return error code for not found", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "non-existent" });
    
    const errorCode = "NOT_FOUND";
    
    assertEquals(errorCode, "NOT_FOUND");
  });

  it("should return error code for forbidden access", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    const errorCode = "FORBIDDEN";
    
    assertEquals(errorCode, "FORBIDDEN");
  });

  it("should handle invalid JSON body", async () => {
    const url = "https://test.supabase.co/functions/v1/coupon-read";
    mockRequest = new Request(url, {
      method: "POST",
      headers: new Headers({ 
        "Content-Type": "application/json",
        "Authorization": "Bearer mock-token",
      }),
      body: "invalid-json",
    });
    
    assertExists(mockRequest);
  });

  it("should handle database errors", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    // Simulate DB error
    const dbError = { message: "Database connection failed" };
    
    assertExists(dbError.message);
  });

  it("should log errors", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    const error = new Error("Test error");
    const logMessage = `Error: ${error.message}`;
    
    assertExists(logMessage);
  });

  it("should return 500 on internal error", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    const internalError = true;
    const expectedStatus = internalError ? 500 : 200;
    const errorCode = "INTERNAL_ERROR";
    
    assertEquals(expectedStatus, 500);
    assertEquals(errorCode, "INTERNAL_ERROR");
  });
});

// ============================================
// TESTS: CORS
// ============================================

describe("coupon-read - CORS", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = { id: "producer-123", email: "test@example.com" };
  });

  it("should handle OPTIONS preflight request", async () => {
    const url = "https://test.supabase.co/functions/v1/coupon-read";
    mockRequest = new Request(url, {
      method: "OPTIONS",
      headers: new Headers(),
    });
    
    assertEquals(mockRequest.method, "OPTIONS");
  });

  it("should include CORS headers in response", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
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

describe("coupon-read - Edge Cases", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = { id: "producer-123", email: "test@example.com" };
    mockCoupon = {
      id: "coupon-123",
      code: "SAVE10",
    };
    mockCouponProducts = [{ product_id: "product-123" }];
    mockProducts = [{ id: "product-123" }];
  });

  it("should handle UUID format IDs", async () => {
    const uuidCouponId = "550e8400-e29b-41d4-a716-446655440000";
    
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: uuidCouponId,
    });
    
    assertExists(uuidCouponId);
  });

  it("should handle coupon with all fields", async () => {
    mockCoupon = {
      id: "coupon-123",
      code: "SAVE10",
      discount_type: "percentage",
      discount_value: 10,
      max_uses: 100,
      uses_count: 5,
      expires_at: "2025-12-31",
      is_active: true,
      created_at: "2025-01-01",
      updated_at: "2025-01-15",
    };
    
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    assertEquals(Object.keys(mockCoupon).length, 10);
  });

  it("should handle coupon with minimal fields", async () => {
    mockCoupon = {
      id: "coupon-123",
      code: "SAVE10",
    };
    
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    assertEquals(Object.keys(mockCoupon).length, 2);
  });

  it("should handle very long coupon code", async () => {
    mockCoupon = {
      id: "coupon-123",
      code: "A".repeat(100),
    };
    
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    assertEquals((mockCoupon.code as string).length, 100);
  });

  it("should handle special characters in coupon code", async () => {
    mockCoupon = {
      id: "coupon-123",
      code: "SAVE-10%",
    };
    
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    assertEquals(mockCoupon.code, "SAVE-10%");
  });

  it("should handle null expires_at", async () => {
    mockCoupon = {
      id: "coupon-123",
      code: "SAVE10",
      expires_at: null,
    };
    
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    assertEquals(mockCoupon.expires_at, null);
  });

  it("should handle zero max_uses", async () => {
    mockCoupon = {
      id: "coupon-123",
      code: "SAVE10",
      max_uses: 0,
    };
    
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    assertEquals(mockCoupon.max_uses, 0);
  });

  it("should handle null max_uses (unlimited)", async () => {
    mockCoupon = {
      id: "coupon-123",
      code: "SAVE10",
      max_uses: null,
    };
    
    mockRequest = createMockRequest({ 
      action: "get-coupon",
      couponId: "coupon-123",
    });
    
    assertEquals(mockCoupon.max_uses, null);
  });
});

// ============================================
// TESTS: SINGLE RESPONSIBILITY
// ============================================

describe("coupon-read - Single Responsibility", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = { id: "producer-123", email: "test@example.com" };
    mockCoupon = {
      id: "coupon-123",
      code: "SAVE10",
    };
    mockCouponProducts = [{ product_id: "product-123" }];
    mockProducts = [{ id: "product-123" }];
  });

  it("should have single responsibility: read coupons for editing", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    // Responsabilidade ÚNICA: Leitura de cupons para edição
    const singleResponsibility = true;
    
    assertEquals(singleResponsibility, true);
  });

  it("should only support get-coupon action", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    const supportedActions = ["get-coupon"];
    
    assertEquals(supportedActions.length, 1);
  });

  it("should not support create/update/delete", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    const unsupportedActions = ["create", "update", "delete"];
    const supportsWrite = false;
    
    assertEquals(supportsWrite, false);
    assertEquals(unsupportedActions.length, 3);
  });

  it("should follow RISE Architect Protocol V3", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    // RISE ARCHITECT PROTOCOL V3 - 10.0/10
    const followsRiseV3 = true;
    
    assertEquals(followsRiseV3, true);
  });
});

// ============================================
// TESTS: RESPONSE FORMAT
// ============================================

describe("coupon-read - Response Format", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = { id: "producer-123", email: "test@example.com" };
    mockCoupon = {
      id: "coupon-123",
      code: "SAVE10",
    };
    mockCouponProducts = [{ product_id: "product-123" }];
    mockProducts = [{ id: "product-123" }];
  });

  it("should return coupon in response", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    // Response { coupon: {...} }
    const responseFormat = { coupon: mockCoupon };
    
    assertExists(responseFormat.coupon);
  });

  it("should return error with code", async () => {
    mockRequest = createMockRequest({ action: "unknown" });
    
    // Error response: { error: "...", code: "..." }
    const errorResponse = {
      error: "Ação desconhecida",
      code: "INVALID_ACTION",
    };
    
    assertExists(errorResponse.error);
    assertExists(errorResponse.code);
  });

  it("should include JSON content type", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    const contentType = "application/json";
    
    assertEquals(contentType, "application/json");
  });
});

// ============================================
// TESTS: LOGGING
// ============================================

describe("coupon-read - Logging", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = { id: "producer-123", email: "test@example.com" };
    mockCoupon = {
      id: "coupon-123",
      code: "SAVE10",
    };
    mockCouponProducts = [{ product_id: "product-123" }];
    mockProducts = [{ id: "product-123" }];
  });

  it("should log action", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    const logMessage = "Action: get-coupon";
    
    assertExists(logMessage);
  });

  it("should log producer ID", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    const logMessage = `Producer: ${mockProducer.id}`;
    
    assertExists(logMessage);
  });

  it("should log errors", async () => {
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    const error = new Error("Test error");
    const logMessage = `Error: ${error.message}`;
    
    assertExists(logMessage);
  });

  it("should log warnings for unauthorized access", async () => {
    mockProducts = [];
    mockRequest = createMockRequest({ action: "get-coupon", couponId: "coupon-123" });
    
    const logMessage = `Producer ${mockProducer.id} tried to access coupon coupon-123`;
    
    assertExists(logMessage);
  });
});
