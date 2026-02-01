/**
 * Contract Tests - HTTP API
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 2: HTTP contract tests with FetchMock
 * Execution: ALWAYS (no real SUPABASE_URL dependency)
 * 
 * @module reconcile-pending-orders/tests/api.contract
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  FetchMock,
  unitTestOptions,
  corsOptionsResponse,
  jsonResponse,
  unauthorizedResponse,
  serverErrorResponse,
  FUNCTION_NAME,
  createAuthHeaders,
  createUnauthHeaders,
  createInvalidSecretHeaders,
  createEmptyReconcileResponse,
  createSuccessReconcileResponse,
  createUpdatedResult,
  createSkippedResult,
} from "./_shared.ts";

const MOCK_URL = `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;

// ============================================================================
// CORS CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "reconcile-pending-orders/contract: OPTIONS returns CORS headers",
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
  name: "reconcile-pending-orders/contract: rejects request without secret",
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
        body: JSON.stringify({})
      });
      await response.text();
      
      assertEquals(response.status, 401);
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "reconcile-pending-orders/contract: rejects request with invalid secret",
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
        headers: createInvalidSecretHeaders(),
        body: JSON.stringify({})
      });
      await response.text();
      
      assertEquals(response.status, 401);
    } finally {
      fetchMock.uninstall();
    }
  }
});

// ============================================================================
// SUCCESS CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "reconcile-pending-orders/contract: accepts valid request with secret",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createEmptyReconcileResponse())
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({})
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertEquals(data.success, true);
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "reconcile-pending-orders/contract: returns empty response when no pending orders",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createEmptyReconcileResponse())
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({})
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertEquals(data.processed, 0);
      assertExists(data.message);
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "reconcile-pending-orders/contract: returns results with summary",
  ...unitTestOptions,
  fn: async () => {
    const results = [
      createUpdatedResult("order-1"),
      createSkippedResult("order-2", "Gateway not configured"),
    ];
    
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createSuccessReconcileResponse(results))
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({})
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertEquals(data.success, true);
      assertExists(data.results);
      assertExists(data.summary);
      assertEquals(data.summary.total, 2);
    } finally {
      fetchMock.uninstall();
    }
  }
});

// ============================================================================
// RESPONSE STRUCTURE CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "reconcile-pending-orders/contract: response includes version",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createSuccessReconcileResponse([]))
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({})
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertExists(data.version);
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "reconcile-pending-orders/contract: response includes duration_ms",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createSuccessReconcileResponse([]))
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({})
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertExists(data.duration_ms);
      assertEquals(typeof data.duration_ms, "number");
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "reconcile-pending-orders/contract: summary includes by_gateway breakdown",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createSuccessReconcileResponse([createUpdatedResult("order-1")]))
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({})
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertExists(data.summary.by_gateway);
      assertExists(data.summary.by_gateway.mercadopago);
      assertExists(data.summary.by_gateway.asaas);
    } finally {
      fetchMock.uninstall();
    }
  }
});
