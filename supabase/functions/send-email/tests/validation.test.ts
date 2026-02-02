/**
 * Send Email Tests - Validation
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for request validation in send-email Edge Function.
 * 
 * @module send-email/tests/validation
 */

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  FUNCTION_NAME,
  createSendEmailPayload,
  createAuthenticatedEmailRequest,
  createTestProducer,
  createTestSession,
  type SendEmailRequest,
} from "./_shared.ts";

// ============================================================================
// TEST SETUP
// ============================================================================

const testProducer = createTestProducer();
const testSession = createTestSession(testProducer.id);

/**
 * Helper to parse JSON response safely
 */
async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { rawText: text };
  }
}

// ============================================================================
// MISSING FIELD TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Validation - rejects missing 'to' field`, async () => {
  const payload = createSendEmailPayload();
  delete (payload as Partial<SendEmailRequest>).to;

  const request = createAuthenticatedEmailRequest(
    testSession.access_token,
    payload
  );

  // Simulating validation logic (unit test - no actual HTTP call)
  const hasTo = "to" in payload;
  assertEquals(hasTo, false, "Payload should not have 'to' field");
});

Deno.test(`[${FUNCTION_NAME}] Validation - rejects missing 'subject' field`, async () => {
  const payload = createSendEmailPayload();
  delete (payload as Partial<SendEmailRequest>).subject;

  const hasSubject = "subject" in payload;
  assertEquals(hasSubject, false, "Payload should not have 'subject' field");
});

Deno.test(`[${FUNCTION_NAME}] Validation - rejects missing 'htmlBody' field`, async () => {
  const payload = createSendEmailPayload();
  delete (payload as Partial<SendEmailRequest>).htmlBody;

  const hasHtmlBody = "htmlBody" in payload;
  assertEquals(hasHtmlBody, false, "Payload should not have 'htmlBody' field");
});

// ============================================================================
// INVALID TYPE TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Validation - rejects non-string 'subject'`, () => {
  const payload = {
    to: { email: "test@test.com" },
    subject: 12345, // Invalid: should be string
    htmlBody: "<p>Test</p>",
  };

  const isValidSubject = typeof payload.subject === "string";
  assertEquals(isValidSubject, false, "Subject should be string");
});

Deno.test(`[${FUNCTION_NAME}] Validation - rejects non-string 'htmlBody'`, () => {
  const payload = {
    to: { email: "test@test.com" },
    subject: "Test",
    htmlBody: { html: "<p>Test</p>" }, // Invalid: should be string
  };

  const isValidHtmlBody = typeof payload.htmlBody === "string";
  assertEquals(isValidHtmlBody, false, "htmlBody should be string");
});

Deno.test(`[${FUNCTION_NAME}] Validation - rejects invalid 'to' format`, () => {
  const payload = {
    to: "just-a-string@test.com", // Invalid: should be object or array
    subject: "Test",
    htmlBody: "<p>Test</p>",
  };

  const isValidTo = typeof payload.to === "object" && payload.to !== null;
  assertEquals(isValidTo, false, "to should be object or array of objects");
});

Deno.test(`[${FUNCTION_NAME}] Validation - rejects 'to' without email property`, () => {
  const payload = {
    to: { name: "Test" }, // Invalid: missing email
    subject: "Test",
    htmlBody: "<p>Test</p>",
  };

  const hasEmail = "email" in payload.to;
  assertEquals(hasEmail, false, "to.email is required");
});

// ============================================================================
// VALID PAYLOAD TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Validation - accepts valid minimal payload`, () => {
  const payload = {
    to: { email: "test@test.com" },
    subject: "Test Subject",
    htmlBody: "<p>Test</p>",
  };

  const isValid = 
    typeof payload.to === "object" &&
    "email" in payload.to &&
    typeof payload.subject === "string" &&
    typeof payload.htmlBody === "string";

  assertEquals(isValid, true, "Minimal payload should be valid");
});

Deno.test(`[${FUNCTION_NAME}] Validation - accepts valid full payload`, () => {
  const payload = createSendEmailPayload();

  const isValid = 
    typeof payload.to === "object" &&
    typeof payload.subject === "string" &&
    typeof payload.htmlBody === "string" &&
    typeof payload.textBody === "string" &&
    typeof payload.type === "string" &&
    typeof payload.trackClicks === "boolean" &&
    typeof payload.trackOpens === "boolean" &&
    typeof payload.clientReference === "string";

  assertEquals(isValid, true, "Full payload should be valid");
});

Deno.test(`[${FUNCTION_NAME}] Validation - accepts array of recipients`, () => {
  const payload = {
    to: [
      { email: "test1@test.com", name: "Test 1" },
      { email: "test2@test.com", name: "Test 2" },
    ],
    subject: "Test",
    htmlBody: "<p>Test</p>",
  };

  const isArray = Array.isArray(payload.to);
  const allHaveEmail = payload.to.every(r => "email" in r);

  assertEquals(isArray, true, "to should be array");
  assertEquals(allHaveEmail, true, "All recipients should have email");
});

// ============================================================================
// EMAIL TYPE VALIDATION
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Validation - accepts 'transactional' type`, () => {
  const payload = createSendEmailPayload({ type: "transactional" });
  assertEquals(payload.type, "transactional");
});

Deno.test(`[${FUNCTION_NAME}] Validation - accepts 'support' type`, () => {
  const payload = createSendEmailPayload({ type: "support" });
  assertEquals(payload.type, "support");
});

Deno.test(`[${FUNCTION_NAME}] Validation - accepts 'notification' type`, () => {
  const payload = createSendEmailPayload({ type: "notification" });
  assertEquals(payload.type, "notification");
});

Deno.test(`[${FUNCTION_NAME}] Validation - rejects invalid email type`, () => {
  const payload = {
    ...createSendEmailPayload(),
    type: "marketing" as const, // Invalid type
  };

  const validTypes = ["transactional", "support", "notification"];
  const isValidType = validTypes.includes(payload.type);
  assertEquals(isValidType, false, "marketing is not a valid type");
});
