/**
 * Unit Tests: API Client
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the main API client including:
 * - Successful requests
 * - Error handling
 * - Timeout behavior
 * - Retry on 401
 * - Correlation ID generation
 * 
 * @module lib/api/client.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { api } from "./client";

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
// api.call - Success Cases
// ============================================================================

describe("api.call - Success Cases", () => {
  it("should make a successful request and return data", async () => {
    const responseData = { items: [{ id: "1", name: "Product 1" }], total: 1 };
    server.use(createSuccessHandler("products-api", responseData));

    const { data, error } = await api.call("products-api", { action: "list" });

    expect(error).toBeNull();
    expect(data).toEqual(responseData);
  });

  it("should include Content-Type header", async () => {
    let capturedHeaders: Headers | null = null;
    
    server.use(
      http.post(`${API_URL}/test-function`, async ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ success: true });
      })
    );

    await api.call("test-function", { test: true });

    expect(capturedHeaders?.get("Content-Type")).toBe("application/json");
  });

  it("should include X-Correlation-Id header", async () => {
    let capturedHeaders: Headers | null = null;
    
    server.use(
      http.post(`${API_URL}/test-function`, async ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ success: true });
      })
    );

    await api.call("test-function");

    const correlationId = capturedHeaders?.get("X-Correlation-Id");
    expect(correlationId).toBeTruthy();
    expect(correlationId).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
  });

  it("should merge custom headers", async () => {
    let capturedHeaders: Headers | null = null;
    
    server.use(
      http.post(`${API_URL}/test-function`, async ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ success: true });
      })
    );

    await api.call("test-function", {}, { 
      headers: { "X-Custom-Header": "custom-value" } 
    });

    expect(capturedHeaders?.get("X-Custom-Header")).toBe("custom-value");
  });

  it("should send body as JSON", async () => {
    let capturedBody: unknown = null;
    
    server.use(
      http.post(`${API_URL}/test-function`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    const requestBody = { action: "create", params: { name: "Test" } };
    await api.call("test-function", requestBody);

    expect(capturedBody).toEqual(requestBody);
  });

  it("should handle request without body", async () => {
    server.use(createSuccessHandler("test-function", { success: true }));

    const { data, error } = await api.call("test-function");

    expect(error).toBeNull();
    expect(data).toEqual({ success: true });
  });
});

// ============================================================================
// api.call - Error Handling
// ============================================================================

describe("api.call - Error Handling", () => {
  it("should return error for 400 Bad Request", async () => {
    server.use(createErrorHandler("test-function", 400, { error: "Invalid input" }));

    const { data, error } = await api.call("test-function");

    expect(data).toBeNull();
    expect(error?.code).toBe("VALIDATION_ERROR");
    expect(error?.message).toBe("Invalid input");
  });

  it("should return error for 401 Unauthorized (public call)", async () => {
    server.use(createErrorHandler("test-function", 401, { error: "Unauthorized" }));

    const { data, error } = await api.call("test-function", {}, { public: true });

    expect(data).toBeNull();
    expect(error?.code).toBe("UNAUTHORIZED");
  });

  it("should return error for 403 Forbidden", async () => {
    server.use(createErrorHandler("test-function", 403, { error: "Access denied" }));

    const { data, error } = await api.call("test-function");

    expect(data).toBeNull();
    expect(error?.code).toBe("FORBIDDEN");
  });

  it("should return error for 404 Not Found", async () => {
    server.use(createErrorHandler("test-function", 404, { error: "Not found" }));

    const { data, error } = await api.call("test-function");

    expect(data).toBeNull();
    expect(error?.code).toBe("NOT_FOUND");
  });

  it("should return error for 429 Rate Limited", async () => {
    server.use(createErrorHandler("test-function", 429, { error: "Too many requests" }));

    const { data, error } = await api.call("test-function");

    expect(data).toBeNull();
    expect(error?.code).toBe("RATE_LIMITED");
  });

  it("should return error for 500 Internal Server Error", async () => {
    server.use(createErrorHandler("test-function", 500, { error: "Server error" }));

    const { data, error } = await api.call("test-function");

    expect(data).toBeNull();
    expect(error?.code).toBe("INTERNAL_ERROR");
  });

  it("should handle response with no JSON body", async () => {
    server.use(
      http.post(`${API_URL}/test-function`, () => {
        return new HttpResponse("Internal Server Error", { status: 500 });
      })
    );

    const { data, error } = await api.call("test-function");

    expect(data).toBeNull();
    expect(error?.code).toBe("INTERNAL_ERROR");
  });
});

// ============================================================================
// api.call - Network Errors
// ============================================================================

describe("api.call - Network Errors", () => {
  it("should handle network failure", async () => {
    server.use(
      http.post(`${API_URL}/test-function`, () => {
        return HttpResponse.error();
      })
    );

    const { data, error } = await api.call("test-function");

    expect(data).toBeNull();
    expect(error).not.toBeNull();
    // Network errors can be NETWORK_ERROR or UNKNOWN depending on the error type
    expect(["NETWORK_ERROR", "UNKNOWN"]).toContain(error?.code);
  });

  it("should handle timeout", async () => {
    // Create a handler that delays response
    server.use(
      http.post(`${API_URL}/test-function`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json({ success: true });
      })
    );

    const { data, error } = await api.call("test-function", {}, { timeout: 50 });

    expect(data).toBeNull();
    expect(error?.code).toBe("TIMEOUT");
  });
});

// ============================================================================
// api.publicCall
// ============================================================================

describe("api.publicCall", () => {
  it("should make a public request successfully", async () => {
    const responseData = { product: { id: "1", name: "Product" } };
    server.use(createSuccessHandler("checkout-public", responseData));

    const { data, error } = await api.publicCall("checkout-public", { slug: "abc" });

    expect(error).toBeNull();
    expect(data).toEqual(responseData);
  });

  it("should not retry on 401 for public calls", async () => {
    let callCount = 0;
    
    server.use(
      http.post(`${API_URL}/checkout-public`, () => {
        callCount++;
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      })
    );

    const { error } = await api.publicCall("checkout-public", { slug: "abc" });

    expect(error?.code).toBe("UNAUTHORIZED");
    expect(callCount).toBe(1); // Should not retry
  });

  it("should handle errors correctly", async () => {
    server.use(createErrorHandler("checkout-public", 404, { error: "Product not found" }));

    const { data, error } = await api.publicCall("checkout-public", { slug: "invalid" });

    expect(data).toBeNull();
    expect(error?.code).toBe("NOT_FOUND");
    expect(error?.message).toBe("Product not found");
  });
});

// ============================================================================
// Correlation ID Format
// ============================================================================

describe("Correlation ID", () => {
  it("should generate unique correlation IDs for each request", async () => {
    const correlationIds: string[] = [];
    
    server.use(
      http.post(`${API_URL}/test-function`, async ({ request }) => {
        const id = request.headers.get("X-Correlation-Id");
        if (id) correlationIds.push(id);
        return HttpResponse.json({ success: true });
      })
    );

    await api.call("test-function");
    await api.call("test-function");
    await api.call("test-function");

    expect(correlationIds.length).toBe(3);
    expect(new Set(correlationIds).size).toBe(3); // All unique
  });

  it("should have correlation ID in expected format", async () => {
    let correlationId: string | null = null;
    
    server.use(
      http.post(`${API_URL}/test-function`, async ({ request }) => {
        correlationId = request.headers.get("X-Correlation-Id");
        return HttpResponse.json({ success: true });
      })
    );

    await api.call("test-function");

    expect(correlationId).toBeTruthy();
    // Format: base36timestamp-base36random
    expect(correlationId).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
  });
});

// ============================================================================
// Request URL Construction
// ============================================================================

describe("Request URL", () => {
  it("should construct correct URL for function", async () => {
    let capturedUrl: string | null = null;
    
    server.use(
      http.post(`${API_URL}/:functionName`, async ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true });
      })
    );

    await api.call("my-edge-function");

    expect(capturedUrl).toBe(`${API_URL}/my-edge-function`);
  });
});
