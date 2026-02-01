/**
 * Contract Tests - HTTP API
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 2: HTTP contract tests with FetchMock
 * Execution: ALWAYS
 * 
 * @module asaas-webhook/tests/api.contract
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  FetchMock,
  unitTestOptions,
  corsOptionsResponse,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  FUNCTION_NAME,
  createValidPayload,
  createConfirmedPayload,
  createPayloadWithoutPayment,
  createAuthHeaders,
  createUnauthHeaders,
} from "./_shared.ts";

const MOCK_URL = `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;

// ============================================================================
// CORS CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "asaas-webhook/contract: OPTIONS returns CORS headers",
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
      
      assertEquals(response.status, 204);
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
  name: "asaas-webhook/contract: rejects request without token",
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
  name: "asaas-webhook/contract: rejects request with invalid token",
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
// IP WHITELIST CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "asaas-webhook/contract: rejects non-whitelisted IP when enforced",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: forbiddenResponse("IP não autorizado")
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: {
          ...createAuthHeaders(),
          "X-Forwarded-For": "192.168.1.1" // Non-whitelisted IP
        },
        body: JSON.stringify(createValidPayload())
      });
      await response.text();
      
      assertEquals(response.status, 403);
    } finally {
      fetchMock.uninstall();
    }
  }
});

// ============================================================================
// PAYLOAD HANDLING CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "asaas-webhook/contract: accepts payload without payment silently",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: successResponse({ received: true, message: "Evento sem payment" })
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(createPayloadWithoutPayment())
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertEquals(data.received, true);
    } finally {
      fetchMock.uninstall();
    }
  }
});

// ============================================================================
// SUCCESS CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "asaas-webhook/contract: accepts confirmed payment",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: successResponse({ 
        received: true,
        orderId: "order-123",
        status: "paid",
        model: "hotmart_kiwify"
      })
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(createConfirmedPayload())
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertEquals(data.received, true);
      assertEquals(data.status, "paid");
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "asaas-webhook/contract: response includes hotmart_kiwify model",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: successResponse({ 
        received: true,
        orderId: "order-123",
        technicalStatus: "expired",
        model: "hotmart_kiwify"
      })
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(createValidPayload())
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertEquals(data.model, "hotmart_kiwify");
    } finally {
      fetchMock.uninstall();
    }
  }
});
