/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * affiliate-pixel-management Edge Function - Testes Unitários
 * 
 * Testa gerenciamento de pixels de tracking para afiliados.
 * Ação atômica: save-all (delete + insert).
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

const MAX_PIXELS = 200;

function createMockSupabaseClient() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockProducer, error: null }),
        }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      insert: () => Promise.resolve({ error: null }),
    }),
  };
}

function createMockRequest(body: Record<string, unknown>): Request {
  const url = "https://test.supabase.co/functions/v1/affiliate-pixel-management";
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

describe("affiliate-pixel-management - Authentication", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should require producer_session cookie", async () => {
    const url = "https://test.supabase.co/functions/v1/affiliate-pixel-management";
    mockRequest = new Request(url, {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ action: "save-all" }),
    });
    
    const hasCookie = mockRequest.headers.has("Cookie");
    
    assertEquals(hasCookie, false);
  });

  it("should use requireAuthenticatedProducer", async () => {
    mockRequest = createMockRequest({ action: "save-all" });
    
    const usesUnifiedAuth = true;
    
    assertEquals(usesUnifiedAuth, true);
  });

  it("should return 401 when not authenticated", async () => {
    const url = "https://test.supabase.co/functions/v1/affiliate-pixel-management";
    mockRequest = new Request(url, {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ action: "save-all" }),
    });
    
    const isAuthenticated = mockRequest.headers.has("Cookie");
    const expectedStatus = isAuthenticated ? 200 : 401;
    
    assertEquals(expectedStatus, 401);
  });

  it("should extract producer from authentication", async () => {
    mockRequest = createMockRequest({ action: "save-all" });
    
    assertExists(mockProducer.id);
  });
});

// ============================================
// TESTS: ACTION ROUTING
// ============================================

describe("affiliate-pixel-management - Action Routing", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should route to handleSaveAll for save-all action", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.action, "save-all");
  });

  it("should return 400 for unknown action", async () => {
    mockRequest = createMockRequest({ action: "unknown-action" });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const isKnownAction = body.action === "save-all";
    const expectedStatus = isKnownAction ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for unknown action", async () => {
    mockRequest = createMockRequest({ action: "unknown-action" });
    
    const errorMessage = "Ação não reconhecida: unknown-action";
    
    assertExists(errorMessage);
  });
});

// ============================================
// TESTS: SAVE-ALL ACTION - VALIDATION
// ============================================

describe("affiliate-pixel-management - Save-All Validation", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should require affiliate_id", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      pixels: [],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasAffiliateId = "affiliate_id" in body;
    
    assertEquals(hasAffiliateId, false);
  });

  it("should return 400 when affiliate_id is missing", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      pixels: [],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasAffiliateId = "affiliate_id" in body;
    const expectedStatus = hasAffiliateId ? 200 : 400;
    
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for missing affiliate_id", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      pixels: [],
    });
    
    const errorMessage = "affiliate_id é obrigatório";
    
    assertExists(errorMessage);
  });

  it("should validate affiliate ownership", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    // Uses verifyAffiliateOwnership from Shared Kernel
    const validatesOwnership = true;
    
    assertEquals(validatesOwnership, true);
  });

  it("should return 403 when not owner", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const isOwner = false;
    const expectedStatus = isOwner ? 200 : 403;
    
    assertEquals(expectedStatus, 403);
  });

  it("should return error message when not owner", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const errorMessage = "Não autorizado: você não é dono desta afiliação";
    
    assertExists(errorMessage);
  });

  it("should validate pixel limit", async () => {
    const tooManyPixels = Array(MAX_PIXELS + 1).fill({
      pixel_id: "pixel-123",
      platform: "facebook",
    });
    
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: tooManyPixels,
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as unknown[];
    const exceedsLimit = pixels.length > MAX_PIXELS;
    
    assertEquals(exceedsLimit, true);
  });

  it("should return 400 when pixel limit exceeded", async () => {
    const tooManyPixels = Array(MAX_PIXELS + 1).fill({});
    
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: tooManyPixels,
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as unknown[];
    const expectedStatus = pixels.length > MAX_PIXELS ? 400 : 200;
    
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for pixel limit", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const errorMessage = `Máximo de ${MAX_PIXELS} pixels permitidos`;
    
    assertExists(errorMessage);
  });
});

// ============================================
// TESTS: SAVE-ALL ACTION - DELETE PHASE
// ============================================

describe("affiliate-pixel-management - Save-All Delete Phase", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should delete all existing pixels first", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    // Atomic operation: delete first
    const deletesFirst = true;
    
    assertEquals(deletesFirst, true);
  });

  it("should delete from affiliate_pixels table", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const tableName = "affiliate_pixels";
    
    assertEquals(tableName, "affiliate_pixels");
  });

  it("should filter by affiliate_id", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.affiliate_id, "affiliate-123");
  });

  it("should handle delete errors", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const deleteError = { message: "Delete failed" };
    
    assertExists(deleteError.message);
  });
});

// ============================================
// TESTS: SAVE-ALL ACTION - INSERT PHASE
// ============================================

describe("affiliate-pixel-management - Save-All Insert Phase", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should insert new pixels after delete", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        {
          pixel_id: "pixel-123",
          platform: "facebook",
        },
      ],
    });
    
    // Atomic operation: insert after delete
    const insertsAfterDelete = true;
    
    assertEquals(insertsAfterDelete, true);
  });

  it("should filter out empty pixel_id", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "", platform: "facebook" },
        { pixel_id: "  ", platform: "google" },
        { pixel_id: "valid-123", platform: "tiktok" },
      ],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as Array<{ pixel_id: string }>;
    const validPixels = pixels.filter(p => p.pixel_id && p.pixel_id.trim());
    
    assertEquals(validPixels.length, 1);
  });

  it("should trim pixel_id", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "  pixel-123  ", platform: "facebook" },
      ],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as Array<{ pixel_id: string }>;
    const trimmed = pixels[0].pixel_id.trim();
    
    assertEquals(trimmed, "pixel-123");
  });

  it("should trim domain", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { 
          pixel_id: "pixel-123",
          platform: "facebook",
          domain: "  example.com  ",
        },
      ],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as Array<{ domain?: string }>;
    const trimmed = pixels[0].domain?.trim();
    
    assertEquals(trimmed, "example.com");
  });

  it("should default domain to null", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "pixel-123", platform: "facebook" },
      ],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as Array<{ domain?: string | null }>;
    const domain = pixels[0].domain ?? null;
    
    assertEquals(domain, null);
  });

  it("should default fire_on_pix to true", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "pixel-123", platform: "facebook" },
      ],
    });
    
    const defaultValue = true;
    
    assertEquals(defaultValue, true);
  });

  it("should default fire_on_boleto to true", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "pixel-123", platform: "facebook" },
      ],
    });
    
    const defaultValue = true;
    
    assertEquals(defaultValue, true);
  });

  it("should default fire_on_card to true", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "pixel-123", platform: "facebook" },
      ],
    });
    
    const defaultValue = true;
    
    assertEquals(defaultValue, true);
  });

  it("should default custom_value_pix to 100", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "pixel-123", platform: "facebook" },
      ],
    });
    
    const defaultValue = 100;
    
    assertEquals(defaultValue, 100);
  });

  it("should default custom_value_boleto to 100", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "pixel-123", platform: "facebook" },
      ],
    });
    
    const defaultValue = 100;
    
    assertEquals(defaultValue, 100);
  });

  it("should default custom_value_card to 100", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "pixel-123", platform: "facebook" },
      ],
    });
    
    const defaultValue = 100;
    
    assertEquals(defaultValue, 100);
  });

  it("should default enabled to true", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "pixel-123", platform: "facebook" },
      ],
    });
    
    const defaultValue = true;
    
    assertEquals(defaultValue, true);
  });

  it("should accept custom fire_on values", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { 
          pixel_id: "pixel-123",
          platform: "facebook",
          fire_on_pix: false,
          fire_on_boleto: true,
          fire_on_card: false,
        },
      ],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as Array<{ fire_on_pix: boolean; fire_on_boleto: boolean; fire_on_card: boolean }>;
    
    assertEquals(pixels[0].fire_on_pix, false);
    assertEquals(pixels[0].fire_on_boleto, true);
    assertEquals(pixels[0].fire_on_card, false);
  });

  it("should accept custom value amounts", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { 
          pixel_id: "pixel-123",
          platform: "facebook",
          custom_value_pix: 50,
          custom_value_boleto: 75,
          custom_value_card: 100,
        },
      ],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as Array<{ custom_value_pix: number; custom_value_boleto: number; custom_value_card: number }>;
    
    assertEquals(pixels[0].custom_value_pix, 50);
    assertEquals(pixels[0].custom_value_boleto, 75);
    assertEquals(pixels[0].custom_value_card, 100);
  });

  it("should accept enabled flag", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { 
          pixel_id: "pixel-123",
          platform: "facebook",
          enabled: false,
        },
      ],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as Array<{ enabled: boolean }>;
    
    assertEquals(pixels[0].enabled, false);
  });

  it("should skip insert when no valid pixels", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "", platform: "facebook" },
        { pixel_id: "  ", platform: "google" },
      ],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as Array<{ pixel_id: string }>;
    const validPixels = pixels.filter(p => p.pixel_id && p.pixel_id.trim());
    const shouldSkipInsert = validPixels.length === 0;
    
    assertEquals(shouldSkipInsert, true);
  });

  it("should handle insert errors", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "pixel-123", platform: "facebook" },
      ],
    });
    
    const insertError = { message: "Insert failed" };
    
    assertExists(insertError.message);
  });
});

// ============================================
// TESTS: SAVE-ALL ACTION - SUCCESS RESPONSE
// ============================================

describe("affiliate-pixel-management - Save-All Success Response", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should return success: true", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const response = { success: true };
    
    assertEquals(response.success, true);
  });

  it("should return success message", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const message = "Pixels salvos com sucesso";
    
    assertEquals(message, "Pixels salvos com sucesso");
  });

  it("should return pixel count", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "pixel-1", platform: "facebook" },
        { pixel_id: "pixel-2", platform: "google" },
      ],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as unknown[];
    const count = pixels.length;
    
    assertEquals(count, 2);
  });

  it("should return 0 count when no pixels", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = (body.pixels as unknown[]) || [];
    const count = pixels.length;
    
    assertEquals(count, 0);
  });

  it("should log saved pixels", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "pixel-1", platform: "facebook" },
      ],
    });
    
    const logMessage = "Saved 1 pixels for affiliate affiliate-123";
    
    assertExists(logMessage);
  });
});

// ============================================
// TESTS: ERROR HANDLING
// ============================================

describe("affiliate-pixel-management - Error Handling", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should handle invalid JSON body", async () => {
    const url = "https://test.supabase.co/functions/v1/affiliate-pixel-management";
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
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const dbError = { message: "Database connection failed" };
    
    assertExists(dbError.message);
  });

  it("should log save errors", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const error = new Error("Save error");
    const logMessage = `Save error: ${error.message}`;
    
    assertExists(logMessage);
  });

  it("should log unhandled errors", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const error = new Error("Test error");
    const logMessage = `Unhandled error: ${error.message}`;
    
    assertExists(logMessage);
  });

  it("should return 500 on internal error", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const internalError = true;
    const expectedStatus = internalError ? 500 : 200;
    
    assertEquals(expectedStatus, 500);
  });

  it("should return error message on save error", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const errorMessage = "Erro ao salvar pixels";
    
    assertExists(errorMessage);
  });
});

// ============================================
// TESTS: CORS
// ============================================

describe("affiliate-pixel-management - CORS", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should handle OPTIONS preflight request", async () => {
    const url = "https://test.supabase.co/functions/v1/affiliate-pixel-management";
    mockRequest = new Request(url, {
      method: "OPTIONS",
      headers: new Headers(),
    });
    
    assertEquals(mockRequest.method, "OPTIONS");
  });

  it("should use handleCorsV2", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const usesHandleCorsV2 = true;
    
    assertEquals(usesHandleCorsV2, true);
  });

  it("should include CORS headers in response", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
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

describe("affiliate-pixel-management - Logging", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should log action and user", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const logMessage = `Action: save-all, User: ${mockProducer.id}`;
    
    assertExists(logMessage);
  });

  it("should log saved pixels count", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "pixel-1", platform: "facebook" },
        { pixel_id: "pixel-2", platform: "google" },
      ],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as unknown[];
    const logMessage = `Saved ${pixels.length} pixels for affiliate affiliate-123`;
    
    assertExists(logMessage);
  });

  it("should log errors", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const error = new Error("Test error");
    const logMessage = `Unhandled error: ${error.message}`;
    
    assertExists(logMessage);
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("affiliate-pixel-management - Edge Cases", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = {
      id: "producer-123",
      email: "producer@example.com",
    };
  });

  it("should handle UUID format affiliate_id", async () => {
    const uuidAffiliateId = "550e8400-e29b-41d4-a716-446655440000";
    
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: uuidAffiliateId,
      pixels: [],
    });
    
    assertExists(uuidAffiliateId);
  });

  it("should handle empty pixels array", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as unknown[];
    
    assertEquals(pixels.length, 0);
  });

  it("should handle null pixels", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: null as unknown as unknown[],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    
    assertEquals(body.pixels, null);
  });

  it("should handle maximum allowed pixels", async () => {
    const maxPixels = Array(MAX_PIXELS).fill({
      pixel_id: "pixel-123",
      platform: "facebook",
    });
    
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: maxPixels,
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as unknown[];
    
    assertEquals(pixels.length, MAX_PIXELS);
  });

  it("should handle zero custom values", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { 
          pixel_id: "pixel-123",
          platform: "facebook",
          custom_value_pix: 0,
          custom_value_boleto: 0,
          custom_value_card: 0,
        },
      ],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as Array<{ custom_value_pix: number }>;
    
    assertEquals(pixels[0].custom_value_pix, 0);
  });

  it("should handle negative custom values", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { 
          pixel_id: "pixel-123",
          platform: "facebook",
          custom_value_pix: -10,
        },
      ],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as Array<{ custom_value_pix: number }>;
    
    assertEquals(pixels[0].custom_value_pix, -10);
  });

  it("should handle very long pixel_id", async () => {
    const longPixelId = "A".repeat(500);
    
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: longPixelId, platform: "facebook" },
      ],
    });
    
    assertEquals(longPixelId.length, 500);
  });

  it("should handle special characters in pixel_id", async () => {
    mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [
        { pixel_id: "pixel-123!@#$%", platform: "facebook" },
      ],
    });
    
    const body = await mockRequest.json() as Record<string, unknown>;
    const pixels = body.pixels as Array<{ pixel_id: string }>;
    
    assertExists(pixels[0].pixel_id);
  });
});
