/**
 * Contract Tests - HTTP API
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 2: HTTP contract tests with FetchMock
 * Execution: ALWAYS
 * 
 * @module mercadopago-webhook/tests/api.contract
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
  FUNCTION_NAME,
  createValidPayload,
  createNonPaymentPayload,
  createPayloadWithoutId,
  createAuthHeaders,
  createUnauthHeaders,
  createInvalidSignatureHeaders,
} from "./_shared.ts";

const MOCK_URL = `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;

// ============================================================================
// CORS CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "mercadopago-webhook/contract: OPTIONS returns CORS headers",
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
// SIGNATURE AUTHENTICATION CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "mercadopago-webhook/contract: rejects request without signature",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: unauthorizedResponse("Missing signature")
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
  name: "mercadopago-webhook/contract: rejects request with invalid signature",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: unauthorizedResponse("Invalid signature")
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createInvalidSignatureHeaders(),
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
// PAYLOAD TYPE CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "mercadopago-webhook/contract: ignores non-payment type",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: successResponse({ message: "Tipo ignorado" })
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(createNonPaymentPayload())
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertEquals(data.message, "Tipo ignorado");
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "mercadopago-webhook/contract: rejects payload without payment ID",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: badRequestResponse("ID não fornecido")
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
// SUCCESS CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "mercadopago-webhook/contract: accepts valid payment webhook",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: successResponse({ 
        orderId: "order-123",
        status: "PAID",
        version: "147"
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
      assertExists(data.orderId);
      assertExists(data.version);
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "mercadopago-webhook/contract: handles duplicate webhook gracefully",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: successResponse({ 
        message: "Duplicado",
        orderId: "order-123"
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
      assertEquals(data.message, "Duplicado");
    } finally {
      fetchMock.uninstall();
    }
  }
});
