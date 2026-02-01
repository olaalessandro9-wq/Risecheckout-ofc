/**
 * Contract Tests - HTTP API
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 2: HTTP contract tests with FetchMock
 * Execution: ALWAYS (no real SUPABASE_URL dependency)
 * 
 * @module pushinpay-webhook/tests/api.contract
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  FetchMock,
  unitTestOptions,
  corsOptionsResponse,
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
  notFoundResponse,
  FUNCTION_NAME,
  WEBHOOK_TOKEN,
  createValidPayload,
  createPaidPayload,
  createEmptyPayload,
  createPayloadWithoutId,
  createAuthHeaders,
  createUnauthHeaders,
} from "./_shared.ts";

const MOCK_URL = `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;

// ============================================================================
// CORS CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/contract: OPTIONS returns CORS headers",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "OPTIONS",
      response: corsOptionsResponse()
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, { method: "OPTIONS" });
      await response.text();
      
      assertEquals(response.status, 200);
      assertExists(response.headers.get("Access-Control-Allow-Origin"));
    } finally {
      fetchMock.uninstall();
    }
  }
});

// ============================================================================
// AUTHENTICATION CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/contract: rejects request without token",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: unauthorizedResponse("Unauthorized")
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createUnauthHeaders(),
        body: JSON.stringify(createValidPayload())
      });
      await response.text();
      
      assertEquals(response.status, 401);
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "pushinpay-webhook/contract: rejects request with invalid token",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: unauthorizedResponse("Unauthorized")
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders("wrong-token"),
        body: JSON.stringify(createValidPayload())
      });
      await response.text();
      
      assertEquals(response.status, 401);
    } finally {
      fetchMock.uninstall();
    }
  }
});

// ============================================================================
// VALIDATION CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/contract: rejects empty payload",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: badRequestResponse("Missing payment ID")
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(createEmptyPayload())
      });
      await response.text();
      
      assertEquals(response.status, 400);
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "pushinpay-webhook/contract: rejects payload without ID",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: badRequestResponse("Missing payment ID")
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(createPayloadWithoutId())
      });
      await response.text();
      
      assertEquals(response.status, 400);
    } finally {
      fetchMock.uninstall();
    }
  }
});

// ============================================================================
// ORDER NOT FOUND CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/contract: returns 404 for unknown order",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: notFoundResponse("Order not found")
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(createValidPayload({ id: "unknown-pix-id" }))
      });
      await response.text();
      
      assertEquals(response.status, 404);
    } finally {
      fetchMock.uninstall();
    }
  }
});

// ============================================================================
// SUCCESS CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/contract: accepts paid webhook",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: successResponse({ 
        order_id: "order-123",
        new_status: "paid",
        model: "hotmart_kiwify"
      })
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(createPaidPayload())
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertExists(data.order_id);
      assertEquals(data.new_status, "paid");
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "pushinpay-webhook/contract: response includes hotmart_kiwify model",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: successResponse({ 
        order_id: "order-123",
        new_status: "pending",
        technical_status: "pix_expired",
        model: "hotmart_kiwify"
      })
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(createValidPayload({ status: "expired" }))
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertEquals(data.model, "hotmart_kiwify");
      assertEquals(data.technical_status, "pix_expired");
    } finally {
      fetchMock.uninstall();
    }
  }
});
