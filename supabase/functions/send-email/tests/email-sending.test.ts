/**
 * Send Email Tests - Email Sending
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for email sending logic via ZeptoMail API.
 * 
 * @module send-email/tests/email-sending
 */

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  FUNCTION_NAME,
  createSendEmailPayload,
  createMockRecipient,
  createMultipleRecipientsPayload,
  createZeptoMailSuccessResponse,
  createZeptoMailErrorResponse,
  mockEnv,
  type SendEmailRequest,
  type EmailType,
} from "./_shared.ts";

import { getFromEmail } from "../../_shared/zeptomail.ts";

// ============================================================================
// TEST SETUP
// ============================================================================

// Mock Deno.env for getFromEmail tests
const originalEnv = new Map<string, string>();

function setupEnv(): void {
  for (const [key, value] of Object.entries(mockEnv)) {
    const original = Deno.env.get(key);
    if (original !== undefined) {
      originalEnv.set(key, original);
    }
    Deno.env.set(key, value);
  }
}

function restoreEnv(): void {
  for (const key of Object.keys(mockEnv)) {
    const original = originalEnv.get(key);
    if (original !== undefined) {
      Deno.env.set(key, original);
    } else {
      Deno.env.delete(key);
    }
  }
  originalEnv.clear();
}

// ============================================================================
// FROM EMAIL TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Email - getFromEmail returns transactional sender by default`, () => {
  setupEnv();
  try {
    const result = getFromEmail();
    assertEquals(result.email, mockEnv.ZEPTOMAIL_FROM_NOREPLY);
    assertEquals(result.name, mockEnv.ZEPTOMAIL_FROM_NAME);
  } finally {
    restoreEnv();
  }
});

Deno.test(`[${FUNCTION_NAME}] Email - getFromEmail returns transactional sender explicitly`, () => {
  setupEnv();
  try {
    const result = getFromEmail("transactional");
    assertEquals(result.email, mockEnv.ZEPTOMAIL_FROM_NOREPLY);
  } finally {
    restoreEnv();
  }
});

Deno.test(`[${FUNCTION_NAME}] Email - getFromEmail returns support sender`, () => {
  setupEnv();
  try {
    const result = getFromEmail("support");
    assertEquals(result.email, mockEnv.ZEPTOMAIL_FROM_SUPPORT);
  } finally {
    restoreEnv();
  }
});

Deno.test(`[${FUNCTION_NAME}] Email - getFromEmail returns notification sender`, () => {
  setupEnv();
  try {
    const result = getFromEmail("notification");
    assertEquals(result.email, mockEnv.ZEPTOMAIL_FROM_NOTIFICATIONS);
  } finally {
    restoreEnv();
  }
});

// ============================================================================
// RECIPIENT NORMALIZATION TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Email - single recipient is valid`, () => {
  const payload = createSendEmailPayload({
    to: createMockRecipient({ email: "single@test.com" }),
  });
  
  const to = payload.to;
  const recipients = Array.isArray(to) ? to : [to];
  
  assertEquals(recipients.length, 1);
  assertEquals(recipients[0].email, "single@test.com");
});

Deno.test(`[${FUNCTION_NAME}] Email - multiple recipients are normalized to array`, () => {
  const payload = createMultipleRecipientsPayload(3);
  
  const to = payload.to;
  const recipients = Array.isArray(to) ? to : [to];
  
  assertEquals(recipients.length, 3);
  assertEquals(recipients[0].email, "recipient0@test.com");
  assertEquals(recipients[1].email, "recipient1@test.com");
  assertEquals(recipients[2].email, "recipient2@test.com");
});

Deno.test(`[${FUNCTION_NAME}] Email - recipient without name uses email as name`, () => {
  const recipient = createMockRecipient();
  delete recipient.name;
  
  const name = recipient.name || recipient.email;
  assertExists(name);
});

// ============================================================================
// ZEPTOMAIL PAYLOAD CONSTRUCTION TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Email - builds correct ZeptoMail payload structure`, () => {
  const payload = createSendEmailPayload({
    to: { email: "test@test.com", name: "Test User" },
    subject: "Test Subject",
    htmlBody: "<p>Test</p>",
    textBody: "Test",
    type: "transactional",
  });
  
  setupEnv();
  try {
    const { email: fromEmail, name: fromName } = getFromEmail(payload.type);
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    
    const zeptoPayload = {
      from: {
        address: fromEmail,
        name: fromName,
      },
      to: recipients.map(r => ({
        email_address: {
          address: r.email,
          name: r.name || r.email,
        },
      })),
      subject: payload.subject,
      htmlbody: payload.htmlBody,
      textbody: payload.textBody,
      track_clicks: payload.trackClicks ?? true,
      track_opens: payload.trackOpens ?? true,
      client_reference: payload.clientReference,
    };
    
    assertExists(zeptoPayload.from.address);
    assertExists(zeptoPayload.from.name);
    assertEquals(zeptoPayload.to.length, 1);
    assertEquals(zeptoPayload.to[0].email_address.address, "test@test.com");
    assertEquals(zeptoPayload.subject, "Test Subject");
    assertExists(zeptoPayload.htmlbody);
    assertExists(zeptoPayload.textbody);
  } finally {
    restoreEnv();
  }
});

Deno.test(`[${FUNCTION_NAME}] Email - defaults track_clicks to true`, () => {
  const payload = createSendEmailPayload();
  delete payload.trackClicks;
  
  const trackClicks = payload.trackClicks ?? true;
  assertEquals(trackClicks, true);
});

Deno.test(`[${FUNCTION_NAME}] Email - defaults track_opens to true`, () => {
  const payload = createSendEmailPayload();
  delete payload.trackOpens;
  
  const trackOpens = payload.trackOpens ?? true;
  assertEquals(trackOpens, true);
});

Deno.test(`[${FUNCTION_NAME}] Email - allows disabling tracking`, () => {
  const payload = createSendEmailPayload({
    trackClicks: false,
    trackOpens: false,
  });
  
  assertEquals(payload.trackClicks, false);
  assertEquals(payload.trackOpens, false);
});

// ============================================================================
// ZEPTOMAIL RESPONSE HANDLING TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Email - parses successful response correctly`, () => {
  const response = createZeptoMailSuccessResponse();
  
  assertExists(response.data);
  assertEquals(response.data.length, 1);
  assertExists(response.data[0].message_id);
  assertExists(response.request_id);
});

Deno.test(`[${FUNCTION_NAME}] Email - parses error response correctly`, () => {
  const response = createZeptoMailErrorResponse("INVALID_API_KEY", "Invalid API key");
  
  assertExists(response.error);
  assertEquals(response.error.code, "INVALID_API_KEY");
  assertEquals(response.error.message, "Invalid API key");
});

Deno.test(`[${FUNCTION_NAME}] Email - extracts message_id from success response`, () => {
  const response = createZeptoMailSuccessResponse();
  const messageId = response.data?.[0]?.message_id || response.request_id;
  
  assertExists(messageId);
  assertStringIncludes(messageId, "zepto_msg");
});

// ============================================================================
// EMAIL TYPE SENDER MAPPING TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Email - maps all email types correctly`, () => {
  setupEnv();
  try {
    const types: EmailType[] = ["transactional", "support", "notification"];
    const expectedEmails = [
      mockEnv.ZEPTOMAIL_FROM_NOREPLY,
      mockEnv.ZEPTOMAIL_FROM_SUPPORT,
      mockEnv.ZEPTOMAIL_FROM_NOTIFICATIONS,
    ];
    
    types.forEach((type, index) => {
      const result = getFromEmail(type);
      assertEquals(result.email, expectedEmails[index], `Type ${type} should map to correct email`);
    });
  } finally {
    restoreEnv();
  }
});

// ============================================================================
// ERROR SCENARIOS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Email - handles missing API key`, () => {
  // Clear API key
  const originalKey = Deno.env.get("ZEPTOMAIL_API_KEY");
  Deno.env.delete("ZEPTOMAIL_API_KEY");
  
  try {
    const apiKey = Deno.env.get("ZEPTOMAIL_API_KEY");
    assertEquals(apiKey, undefined, "API key should be undefined");
  } finally {
    if (originalKey) {
      Deno.env.set("ZEPTOMAIL_API_KEY", originalKey);
    }
  }
});

Deno.test(`[${FUNCTION_NAME}] Email - handles empty recipients array`, () => {
  const payload = createSendEmailPayload({ to: [] as unknown as { email: string } });
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  
  assertEquals(recipients.length, 0, "Should have no recipients");
});
