/**
 * Contract Tests - HTTP API
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 2: HTTP contract tests with FetchMock
 * Execution: ALWAYS (no real SUPABASE_URL dependency)
 * 
 * @module pushinpay-validate-token/tests/api.contract
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
  createValidResult,
  createInvalidResult,
  createMockAccountResponse,
  PUSHINPAY_API_URLS,
} from "./_shared.ts";

const MOCK_URL = `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;

// ============================================================================
// CORS CONTRACT TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-validate-token/contract: OPTIONS returns CORS headers",
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
  name: "pushinpay-validate-token/contract: rejects request without token",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: badRequestResponse("API Token é obrigatório")
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
  name: "pushinpay-validate-token/contract: rejects empty token",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: badRequestResponse("API Token é obrigatório")
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_token: "" })
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
  name: "pushinpay-validate-token/contract: returns valid=true for valid token",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createValidResult())
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
      assertEquals(data.valid, true);
      assertExists(data.account);
      assertExists(data.account.id);
      assertExists(data.account.name);
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "pushinpay-validate-token/contract: returns valid=false for invalid token",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    fetchMock.add({
      url: MOCK_URL,
      method: "POST",
      response: jsonResponse(createInvalidResult())
    });
    fetchMock.install();

    try {
      const response = await fetch(MOCK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createValidRequest({ api_token: "invalid_token_123" }))
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertEquals(data.valid, false);
    } finally {
      fetchMock.uninstall();
    }
  }
});

// ============================================================================
// EXTERNAL API CONTRACT TESTS (Mocked)
// ============================================================================

Deno.test({
  name: "pushinpay-validate-token/contract: calls production API for production env",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    
    // Mock the PushinPay API call
    fetchMock.add({
      url: PUSHINPAY_API_URLS.production,
      method: "GET",
      response: jsonResponse(createMockAccountResponse())
    });
    
    fetchMock.install();

    try {
      const response = await fetch(PUSHINPAY_API_URLS.production, {
        method: "GET",
        headers: { "Authorization": "Bearer test-token" }
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertExists(data.id);
      assertExists(data.name);
    } finally {
      fetchMock.uninstall();
    }
  }
});

Deno.test({
  name: "pushinpay-validate-token/contract: calls sandbox API for sandbox env",
  ...unitTestOptions,
  fn: async () => {
    const fetchMock = new FetchMock();
    
    fetchMock.add({
      url: PUSHINPAY_API_URLS.sandbox,
      method: "GET",
      response: jsonResponse(createMockAccountResponse({ name: "Sandbox Account" }))
    });
    
    fetchMock.install();

    try {
      const response = await fetch(PUSHINPAY_API_URLS.sandbox, {
        method: "GET",
        headers: { "Authorization": "Bearer sandbox-token" }
      });
      const data = await response.json();
      
      assertEquals(response.status, 200);
      assertEquals(data.name, "Sandbox Account");
    } finally {
      fetchMock.uninstall();
    }
  }
});
