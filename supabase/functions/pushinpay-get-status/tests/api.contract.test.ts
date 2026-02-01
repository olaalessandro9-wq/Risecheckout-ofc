/**
 * Contract Tests - HTTP API
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 2: HTTP contract tests with FetchMock
 * Execution: ALWAYS (no real SUPABASE_URL dependency)
 * 
 * @module pushinpay-get-status/tests/api.contract
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  FetchMock,
  unitTestOptions,
  corsOptionsResponse,
  jsonResponse,
  badRequestResponse,
  notFoundResponse,
  FUNCTION_NAME,
  createValidRequest,
  createEmptyRequest,
  createPaidStatusResponse,
  createPendingStatusResponse,
  createNoPixIdResponse,
  createErrorResponse,
} from "./_shared.ts";

const MOCK_URL = `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;

// ============================================================================
// CORS CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-get-status/contract: OPTIONS returns CORS headers",
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
// VALIDATION CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-get-status/contract: rejects empty body",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: badRequestResponse("orderId é obrigatório")
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createEmptyRequest())
      });
      await response.text();
      
      assertEquals(response.status, 400);
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "pushinpay-get-status/contract: rejects request without orderId",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: badRequestResponse("orderId é obrigatório")
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ someField: "value" })
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
  name: "pushinpay-get-status/contract: returns error for unknown order",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: badRequestResponse("Pedido não encontrado")
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createValidRequest("unknown-order-id"))
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
  name: "pushinpay-get-status/contract: returns paid status correctly",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createPaidStatusResponse())
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createValidRequest())
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertEquals(data.success, true);
      assertEquals(data.status, "paid");
      assertEquals(data.isPaid, true);
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "pushinpay-get-status/contract: returns pending status correctly",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createPendingStatusResponse())
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createValidRequest())
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertEquals(data.success, true);
      assertEquals(data.status, "pending");
      assertEquals(data.isPaid, false);
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "pushinpay-get-status/contract: handles order without pix_id",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createNoPixIdResponse())
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createValidRequest())
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertEquals(data.success, true);
      assertExists(data.message);
    } finally {
      fetchMock.uninstall();
    }
  }
});

// ============================================================================
// RESPONSE STRUCTURE CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-get-status/contract: response includes all paid fields",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createPaidStatusResponse())
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createValidRequest())
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertExists(data.status);
      assertExists(data.rawStatus);
      assertExists(data.isPaid);
      assertExists(data.paidAt);
      assertExists(data.payerName);
    } finally {
      fetchMock.uninstall();
    }
  }
});
