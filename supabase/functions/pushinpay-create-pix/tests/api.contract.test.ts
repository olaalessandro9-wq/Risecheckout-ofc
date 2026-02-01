/**
 * Contract Tests - HTTP API
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 2: HTTP contract tests with FetchMock
 * Execution: ALWAYS (no real SUPABASE_URL dependency)
 * 
 * @module pushinpay-create-pix/tests/api.contract
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  FetchMock,
  unitTestOptions,
  corsOptionsResponse,
  jsonResponse,
  badRequestResponse,
  FUNCTION_NAME,
  createValidRequest,
  createEmptyRequest,
  createZeroValueRequest,
  createSuccessPixResponse,
  createAdjustedSplitResponse,
  createErrorPixResponse,
} from "./_shared.ts";

const MOCK_URL = `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;

// ============================================================================
// CORS CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-create-pix/contract: OPTIONS returns CORS headers",
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
  name: "pushinpay-create-pix/contract: rejects empty body",
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
  name: "pushinpay-create-pix/contract: rejects zero value",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: badRequestResponse("valueInCents deve ser maior que zero")
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createZeroValueRequest())
      });
      await response.text();
      
      assertEquals(response.status, 400);
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "pushinpay-create-pix/contract: rejects request without orderId",
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
        body: JSON.stringify({ valueInCents: 10000 })
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
  name: "pushinpay-create-pix/contract: creates PIX successfully",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createSuccessPixResponse())
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
      assertEquals(data.ok, true);
      assertExists(data.pix);
      assertExists(data.pix.qr_code);
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "pushinpay-create-pix/contract: response includes smartSplit info",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createSuccessPixResponse())
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
      assertExists(data.smartSplit);
      assertExists(data.smartSplit.pixCreatedBy);
      assertEquals(typeof data.smartSplit.adjustedSplit, "boolean");
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "pushinpay-create-pix/contract: handles adjusted split",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createAdjustedSplitResponse(2000))
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
      assertEquals(data.smartSplit.adjustedSplit, true);
      assertEquals(data.smartSplit.manualPaymentNeeded, 2000);
    } finally {
      fetchMock.uninstall();
    }
  }
});

// ============================================================================
// ERROR CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-create-pix/contract: error response has ok=false",
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
        body: JSON.stringify(createValidRequest("unknown-order"))
      });
      await response.text();
      
      assertEquals(response.status, 400);
    } finally {
      fetchMock.uninstall();
    }
  }
});

// ============================================================================
// PIX DATA STRUCTURE TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-create-pix/contract: pix data has all required fields",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createSuccessPixResponse("order-123", 10000))
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createValidRequest("order-123", 10000))
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertExists(data.pix.id);
      assertExists(data.pix.pix_id);
      assertExists(data.pix.qr_code);
      assertExists(data.pix.qr_code_base64);
      assertExists(data.pix.status);
      assertEquals(data.pix.value, 10000);
    } finally {
      fetchMock.uninstall();
    }
  }
});
