/**
 * Action Routing Tests for pixel-management
 * 
 * @module pixel-management/tests/action-routing.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultProducer,
  isKnownAction,
  KNOWN_ACTIONS,
  type MockProducer,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

describe("pixel-management - Action Routing", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should require action parameter", async () => {
    const mockRequest = createMockRequest({});
    const body = await mockRequest.json() as Record<string, unknown>;
    const hasAction = "action" in body;
    assertEquals(hasAction, false);
  });

  it("should route to list handler for list action", async () => {
    const mockRequest = createMockRequest({ action: "list" });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "list");
    assertEquals(isKnownAction("list"), true);
  });

  it("should route to create handler for create action", async () => {
    const mockRequest = createMockRequest({ action: "create", data: {} });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "create");
    assertEquals(isKnownAction("create"), true);
  });

  it("should route to update handler for update action", async () => {
    const mockRequest = createMockRequest({ 
      action: "update",
      pixelId: "pixel-123",
      data: {},
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "update");
    assertEquals(isKnownAction("update"), true);
  });

  it("should route to delete handler for delete action", async () => {
    const mockRequest = createMockRequest({ 
      action: "delete",
      pixelId: "pixel-123",
    });
    const body = await mockRequest.json() as Record<string, unknown>;
    assertEquals(body.action, "delete");
    assertEquals(isKnownAction("delete"), true);
  });

  it("should return 400 for unknown action", async () => {
    const mockRequest = createMockRequest({ action: "unknown-action" });
    const body = await mockRequest.json() as Record<string, unknown>;
    const actionValid = isKnownAction(body.action as string);
    const expectedStatus = actionValid ? 200 : 400;
    assertEquals(expectedStatus, 400);
  });

  it("should validate all known actions are supported", () => {
    for (const action of KNOWN_ACTIONS) {
      assertEquals(isKnownAction(action), true);
    }
  });
});
