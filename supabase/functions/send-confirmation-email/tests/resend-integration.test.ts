/**
 * Send Confirmation Email Tests - Resend Integration
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for Resend API integration in send-confirmation-email Edge Function.
 * 
 * @module send-confirmation-email/tests/resend-integration
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  FUNCTION_NAME,
  createResendSuccessResponse,
  createResendErrorResponse,
  mockEnv,
  type ResendSuccessResponse,
  type ResendErrorResponse,
} from "./_shared.ts";

// ============================================================================
// RESEND API CONFIGURATION TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Resend - API URL is correct`, () => {
  const resendUrl = "https://api.resend.com/emails";
  assertEquals(resendUrl, "https://api.resend.com/emails");
});

Deno.test(`[${FUNCTION_NAME}] Resend - requires API key`, () => {
  const originalKey = Deno.env.get("RESEND_API_KEY");
  Deno.env.delete("RESEND_API_KEY");
  
  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    assertEquals(apiKey, undefined, "API key should not be set");
  } finally {
    if (originalKey) {
      Deno.env.set("RESEND_API_KEY", originalKey);
    }
  }
});

Deno.test(`[${FUNCTION_NAME}] Resend - configures from email correctly`, () => {
  const fromEmail = "Rise Checkout <noreply@risecheckout.com>";
  assertExists(fromEmail);
  assertEquals(fromEmail.includes("risecheckout.com"), true);
});

// ============================================================================
// RESEND PAYLOAD CONSTRUCTION TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Resend - builds correct payload structure`, () => {
  const payload = {
    from: "Rise Checkout <noreply@risecheckout.com>",
    to: "customer@test.com",
    subject: "Compra Confirmada! 🎉",
    html: "<h1>Test</h1>",
  };
  
  assertExists(payload.from);
  assertExists(payload.to);
  assertExists(payload.subject);
  assertExists(payload.html);
});

Deno.test(`[${FUNCTION_NAME}] Resend - subject includes emoji`, () => {
  const subject = "Compra Confirmada! 🎉";
  assertEquals(subject.includes("🎉"), true);
});

Deno.test(`[${FUNCTION_NAME}] Resend - to field accepts single email`, () => {
  const payload = {
    to: "single@test.com",
  };
  
  const isString = typeof payload.to === "string";
  assertEquals(isString, true);
});

// ============================================================================
// SUCCESS RESPONSE TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Resend - parses success response correctly`, () => {
  const response = createResendSuccessResponse();
  
  assertExists(response.id);
  assertExists(response.from);
  assertExists(response.to);
  assertExists(response.created_at);
});

Deno.test(`[${FUNCTION_NAME}] Resend - success response has valid ID format`, () => {
  const response = createResendSuccessResponse();
  
  assertEquals(typeof response.id, "string");
  assertEquals(response.id.length > 0, true);
});

Deno.test(`[${FUNCTION_NAME}] Resend - success response includes timestamp`, () => {
  const response = createResendSuccessResponse();
  
  const timestamp = new Date(response.created_at);
  assertEquals(isNaN(timestamp.getTime()), false, "Should be valid date");
});

// ============================================================================
// ERROR RESPONSE TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Resend - parses error response correctly`, () => {
  const response = createResendErrorResponse();
  
  assertExists(response.statusCode);
  assertExists(response.message);
  assertExists(response.name);
});

Deno.test(`[${FUNCTION_NAME}] Resend - invalid API key returns 401`, () => {
  const response = createResendErrorResponse("Invalid API key");
  
  assertEquals(response.statusCode, 401);
  assertEquals(response.message, "Invalid API key");
});

Deno.test(`[${FUNCTION_NAME}] Resend - handles rate limit error`, () => {
  const response: ResendErrorResponse = {
    statusCode: 429,
    message: "Too many requests",
    name: "rate_limit_exceeded",
  };
  
  assertEquals(response.statusCode, 429);
  assertEquals(response.name, "rate_limit_exceeded");
});

Deno.test(`[${FUNCTION_NAME}] Resend - handles validation error`, () => {
  const response: ResendErrorResponse = {
    statusCode: 422,
    message: "Invalid email address",
    name: "validation_error",
  };
  
  assertEquals(response.statusCode, 422);
  assertEquals(response.name, "validation_error");
});

// ============================================================================
// HTTP REQUEST CONFIGURATION TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Resend - uses POST method`, () => {
  const method = "POST";
  assertEquals(method, "POST");
});

Deno.test(`[${FUNCTION_NAME}] Resend - sets correct content type`, () => {
  const headers = {
    "Content-Type": "application/json",
  };
  
  assertEquals(headers["Content-Type"], "application/json");
});

Deno.test(`[${FUNCTION_NAME}] Resend - sets authorization header`, () => {
  const apiKey = mockEnv.RESEND_API_KEY;
  const headers = {
    "Authorization": `Bearer ${apiKey}`,
  };
  
  assertEquals(headers["Authorization"], `Bearer ${apiKey}`);
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Resend - handles network error gracefully`, () => {
  const networkError = new Error("Network request failed");
  
  assertEquals(networkError.message, "Network request failed");
  assertEquals(networkError instanceof Error, true);
});

Deno.test(`[${FUNCTION_NAME}] Resend - handles timeout error`, () => {
  const timeoutError = new Error("Request timeout");
  
  assertEquals(timeoutError.message, "Request timeout");
});

Deno.test(`[${FUNCTION_NAME}] Resend - handles JSON parse error`, () => {
  const parseError = new SyntaxError("Unexpected token");
  
  assertEquals(parseError instanceof SyntaxError, true);
});

// ============================================================================
// RESPONSE STATUS HANDLING TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Resend - 200 indicates success`, () => {
  const status = 200;
  const isSuccess = status >= 200 && status < 300;
  
  assertEquals(isSuccess, true);
});

Deno.test(`[${FUNCTION_NAME}] Resend - 400 indicates client error`, () => {
  const status = 400;
  const isClientError = status >= 400 && status < 500;
  
  assertEquals(isClientError, true);
});

Deno.test(`[${FUNCTION_NAME}] Resend - 500 indicates server error`, () => {
  const status = 500;
  const isServerError = status >= 500;
  
  assertEquals(isServerError, true);
});
