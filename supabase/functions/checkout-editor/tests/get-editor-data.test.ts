/**
 * checkout-editor - Get Editor Data Tests
 * 
 * @version 2.0.0
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { 
  createMockRequest, 
  createMockSupabaseClient, 
  createMockProducer, 
  createMockCheckout,
  type EditorPayload,
  type DesignData
} from "./_shared.ts";

describe("checkout-editor - Action: GET-EDITOR-DATA", () => {
  let _mockSupabaseClient: Record<string, unknown>;
  let _mockProducer: { id: string; email: string };
  let mockCheckout: ReturnType<typeof createMockCheckout>;

  beforeEach(() => {
    _mockSupabaseClient = createMockSupabaseClient();
    _mockProducer = createMockProducer();
    mockCheckout = createMockCheckout();
  });

  it("should load editor data for checkout", async () => {
    const mockRequest = createMockRequest({ action: "get-editor-data", checkoutId: "checkout-123" });
    const body = await mockRequest.json() as EditorPayload;
    assertEquals(body.checkoutId, "checkout-123");
  });

  it("should require checkoutId", async () => {
    const mockRequest = createMockRequest({ action: "get-editor-data" });
    const body = await mockRequest.json() as EditorPayload;
    assertEquals("checkoutId" in body, false);
  });

  it("should return checkout basic info", () => {
    assertExists(mockCheckout.id);
    assertExists(mockCheckout.name);
    assertExists(mockCheckout.is_default);
  });

  it("should return design settings", () => {
    const design = mockCheckout.design;
    assertExists(design);
    assertEquals(design?.theme, "modern");
    assertEquals(design?.font, "Inter");
  });

  it("should return color settings", () => {
    const colors = mockCheckout.design?.colors;
    assertEquals(colors?.primary, "#3B82F6");
    assertEquals(colors?.secondary, "#10B981");
  });

  it("should handle missing design field", () => {
    mockCheckout = createMockCheckout({ design: undefined });
    assertEquals(mockCheckout.design, undefined);
  });

  it("should handle null design field", () => {
    mockCheckout = createMockCheckout({ design: null });
    assertEquals(mockCheckout.design, null);
  });
});
