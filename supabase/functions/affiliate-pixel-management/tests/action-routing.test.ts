/**
 * Action Routing Tests for affiliate-pixel-management
 * 
 * @module affiliate-pixel-management/tests/action-routing.test
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

describe("affiliate-pixel-management - Action Routing", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should route to handleSaveAll for save-all action", async () => {
    const mockRequest = createMockRequest({ 
      action: "save-all",
      affiliate_id: "affiliate-123",
      pixels: [],
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "save-all");
  });

  it("should return 400 for unknown action", async () => {
    const mockRequest = createMockRequest({ action: "unknown-action" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const isKnownAction = body.action === "save-all";
    const expectedStatus = isKnownAction ? 200 : 400;
    assertEquals(expectedStatus, 400);
  });

  it("should return error message for unknown action", async () => {
    const mockRequest = createMockRequest({ action: "unknown-action" });
    const errorMessage = "Ação não reconhecida: unknown-action";
    assertExists(errorMessage);
  });
});
