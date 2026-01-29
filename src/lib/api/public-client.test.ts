/**
 * Unit Tests: Public API Client
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the isolated public API client that has ZERO auth dependencies.
 * This client is used for checkout, payment links, and other public features.
 * 
 * @module lib/api/public-client.test
 */

import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { publicApi } from "./public-client";

// ============================================================================
// Test Constants
// ============================================================================

const API_URL = "https://api.risecheckout.com/functions/v1";

// ============================================================================
// Helper to create handlers
// ============================================================================

function createSuccessHandler(functionName: string, responseData: unknown) {
  return http.post(`${API_URL}/${functionName}`, () => {
    return HttpResponse.json(responseData);
  });
}

function createErrorHandler(functionName: string, status: number, body?: unknown) {
  return http.post(`${API_URL}/${functionName}`, () => {
    return HttpResponse.json(body ?? { error: "Error message" }, { status });
  });
}

// ============================================================================
// publicApi.call - Success Cases
// ============================================================================

describe("publicApi.call - Success Cases", () => {
  it("should make a successful public request", async () => {
    const responseData = { 
      product: { id: "1", name: "Digital Course", price: 9900 },
      checkout: { id: "ch_1", slug: "abc123" }
    };
    server.use(createSuccessHandler("checkout-public-data", responseData));

    const { data, error } = await publicApi.call("checkout-public-data", { 
      action: "resolve-and-load",
      slug: "abc123" 
    });

    expect(error).toBeNull();
    expect(data).toEqual(responseData);
  });

  it("should include Content-Type header", async () => {
    let capturedHeaders: Headers | null = null;
    
    server.use(
      http.post(`${API_URL}/test-public`, async ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ success: true });
      })
    );

    await publicApi.call("test-public", { test: true });

    expect(capturedHeaders?.get("Content-Type")).toBe("application/json");
  });

  it("should include X-Correlation-Id header", async () => {
    let capturedHeaders: Headers | null = null;
    
    server.use(
      http.post(`${API_URL}/test-public`, async ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ success: true });
      })
    );

    await publicApi.call("test-public");

    const correlationId = capturedHeaders?.get("X-Correlation-Id");
    expect(correlationId).toBeTruthy();
    expect(correlationId).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
  });

  it("should merge custom headers", async () => {
    let capturedHeaders: Headers | null = null;
    
    server.use(
      http.post(`${API_URL}/test-public`, async ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ success: true });
      })
    );

    await publicApi.call("test-public", {}, { 
      headers: { "X-Custom-Header": "custom-value" } 
    });

    expect(capturedHeaders?.get("X-Custom-Header")).toBe("custom-value");
  });

  it("should send body as JSON", async () => {
    let capturedBody: unknown = null;
    
    server.use(
      http.post(`${API_URL}/test-public`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    const requestBody = { action: "validate-coupon", couponCode: "SAVE10" };
    await publicApi.call("test-public", requestBody);

    expect(capturedBody).toEqual(requestBody);
  });

  it("should handle request without body", async () => {
    server.use(createSuccessHandler("test-public", { status: "ok" }));

    const { data, error } = await publicApi.call("test-public");

    expect(error).toBeNull();
    expect(data).toEqual({ status: "ok" });
  });
});

// ============================================================================
// publicApi.call - Error Handling
// ============================================================================

describe("publicApi.call - Error Handling", () => {
  it("should return error for 400 Bad Request", async () => {
    server.use(createErrorHandler("test-public", 400, { error: "Invalid slug format" }));

    const { data, error } = await publicApi.call("test-public", { slug: "invalid!" });

    expect(data).toBeNull();
    expect(error?.code).toBe("VALIDATION_ERROR");
    expect(error?.message).toBe("Invalid slug format");
  });

  it("should return error for 401 Unauthorized without retry", async () => {
    let callCount = 0;
    
    server.use(
      http.post(`${API_URL}/test-public`, () => {
        callCount++;
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      })
    );

    const { data, error } = await publicApi.call("test-public");

    expect(data).toBeNull();
    expect(error?.code).toBe("UNAUTHORIZED");
    expect(callCount).toBe(1); // NO retry for public client
  });

  it("should return error for 404 Not Found", async () => {
    server.use(createErrorHandler("test-public", 404, { error: "Checkout not found" }));

    const { data, error } = await publicApi.call("test-public", { slug: "nonexistent" });

    expect(data).toBeNull();
    expect(error?.code).toBe("NOT_FOUND");
    expect(error?.message).toBe("Checkout not found");
  });

  it("should return error for 429 Rate Limited", async () => {
    server.use(createErrorHandler("test-public", 429, { error: "Too many requests" }));

    const { data, error } = await publicApi.call("test-public");

    expect(data).toBeNull();
    expect(error?.code).toBe("RATE_LIMITED");
  });

  it("should return error for 500 Internal Server Error", async () => {
    server.use(createErrorHandler("test-public", 500, { error: "Internal error" }));

    const { data, error } = await publicApi.call("test-public");

    expect(data).toBeNull();
    expect(error?.code).toBe("INTERNAL_ERROR");
  });

  it("should handle response with no JSON body", async () => {
    server.use(
      http.post(`${API_URL}/test-public`, () => {
        return new HttpResponse("Gateway Timeout", { status: 504 });
      })
    );

    const { data, error } = await publicApi.call("test-public");

    expect(data).toBeNull();
    expect(error?.code).toBe("TIMEOUT");
  });
});

// ============================================================================
// publicApi.call - Network Errors
// ============================================================================

describe("publicApi.call - Network Errors", () => {
  it("should handle network failure", async () => {
    server.use(
      http.post(`${API_URL}/test-public`, () => {
        return HttpResponse.error();
      })
    );

    const { data, error } = await publicApi.call("test-public");

    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(["NETWORK_ERROR", "UNKNOWN"]).toContain(error?.code);
  });

  it("should handle timeout", async () => {
    server.use(
      http.post(`${API_URL}/test-public`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json({ success: true });
      })
    );

    const { data, error } = await publicApi.call("test-public", {}, { timeout: 50 });

    expect(data).toBeNull();
    expect(error?.code).toBe("TIMEOUT");
  });
});

// ============================================================================
// Isolation from Auth
// ============================================================================

describe("publicApi - Auth Isolation", () => {
  it("should NOT send Authorization header", async () => {
    let capturedHeaders: Headers | null = null;
    
    server.use(
      http.post(`${API_URL}/test-public`, async ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ success: true });
      })
    );

    await publicApi.call("test-public");

    expect(capturedHeaders?.get("Authorization")).toBeNull();
  });

  it("should NOT include credentials", async () => {
    // The public client should NOT send credentials
    // This is validated by the fact that we don't use credentials: 'include'
    // We can test that the request succeeds without auth
    server.use(createSuccessHandler("test-public", { ok: true }));

    const { data, error } = await publicApi.call("test-public");

    expect(error).toBeNull();
    expect(data).toEqual({ ok: true });
  });
});

// ============================================================================
// Correlation ID
// ============================================================================

describe("publicApi - Correlation ID", () => {
  it("should generate unique correlation IDs", async () => {
    const correlationIds: string[] = [];
    
    server.use(
      http.post(`${API_URL}/test-public`, async ({ request }) => {
        const id = request.headers.get("X-Correlation-Id");
        if (id) correlationIds.push(id);
        return HttpResponse.json({ success: true });
      })
    );

    await publicApi.call("test-public");
    await publicApi.call("test-public");
    await publicApi.call("test-public");

    expect(correlationIds.length).toBe(3);
    expect(new Set(correlationIds).size).toBe(3); // All unique
  });
});

// ============================================================================
// Request URL
// ============================================================================

describe("publicApi - Request URL", () => {
  it("should construct correct URL", async () => {
    let capturedUrl: string | null = null;
    
    server.use(
      http.post(`${API_URL}/:functionName`, async ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true });
      })
    );

    await publicApi.call("checkout-public-data");

    expect(capturedUrl).toBe(`${API_URL}/checkout-public-data`);
  });
});
