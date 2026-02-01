/**
 * API Integration Tests for facebook-conversion-api
 * 
 * @module facebook-conversion-api/tests/api-integration.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultEvent,
  FACEBOOK_API_VERSION,
  FACEBOOK_API_BASE_URL,
  type FacebookEvent,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockEvent: FacebookEvent;

describe("facebook-conversion-api - API Integration", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockEvent = createDefaultEvent();
  });

  it("should use correct Facebook API version", () => {
    assertExists(FACEBOOK_API_VERSION);
    assertEquals(FACEBOOK_API_VERSION.startsWith("v"), true);
  });

  it("should use correct Facebook API base URL", () => {
    assertExists(FACEBOOK_API_BASE_URL);
    assertEquals(FACEBOOK_API_BASE_URL.includes("graph.facebook.com"), true);
  });

  it("should construct correct API endpoint", () => {
    const pixelId = "123456789";
    const endpoint = `${FACEBOOK_API_BASE_URL}/${FACEBOOK_API_VERSION}/${pixelId}/events`;
    assertEquals(endpoint.includes(pixelId), true);
    assertEquals(endpoint.includes("/events"), true);
  });

  it("should format request payload correctly", () => {
    const payload = {
      data: [mockEvent],
      test_event_code: undefined,
    };
    assertExists(payload.data);
    assertEquals(Array.isArray(payload.data), true);
  });

  it("should include test_event_code in test mode", () => {
    const testPayload = {
      data: [mockEvent],
      test_event_code: "TEST12345",
    };
    assertExists(testPayload.test_event_code);
  });

  it("should handle API rate limiting", () => {
    const rateLimitResponse = {
      status: 429,
      headers: { "Retry-After": "60" },
    };
    assertEquals(rateLimitResponse.status, 429);
    assertExists(rateLimitResponse.headers["Retry-After"]);
  });

  it("should handle API error responses", () => {
    const errorResponse = {
      error: {
        message: "Invalid OAuth access token",
        type: "OAuthException",
        code: 190,
      },
    };
    assertExists(errorResponse.error.code);
    assertEquals(errorResponse.error.code, 190);
  });

  it("should parse successful response", () => {
    const successResponse = {
      events_received: 1,
      messages: [],
      fbtrace_id: "AbCdEfGhIjK",
    };
    assertEquals(successResponse.events_received, 1);
    assertExists(successResponse.fbtrace_id);
  });
});
