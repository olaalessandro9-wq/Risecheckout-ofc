/**
 * Send Email Tests - Shared Utilities
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Type-safe factories and mocks for send-email Edge Function tests.
 * 
 * @module send-email/tests/_shared
 * @version 1.0.0
 */

import type { MockUser, MockSession } from "../../_shared/testing/types.ts";
import { 
  createMockUser, 
  createMockSession,
  createMockRequest,
  generatePrefixedId,
} from "../../_shared/testing/mod.ts";

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "send-email";
export const FUNCTION_URL = "https://test.supabase.co/functions/v1/send-email";

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface EmailRecipient {
  email: string;
  name?: string;
}

export type EmailType = "transactional" | "support" | "notification";

export interface SendEmailRequest {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  type?: EmailType;
  trackClicks?: boolean;
  trackOpens?: boolean;
  clientReference?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: unknown;
}

// ============================================================================
// ZEPTOMAIL MOCK TYPES
// ============================================================================

export interface ZeptoMailResponse {
  data: Array<{ message_id: string }>;
  request_id: string;
}

export interface ZeptoMailError {
  error: {
    code: string;
    message: string;
  };
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

/**
 * Creates a valid email recipient
 */
export function createMockRecipient(
  overrides: Partial<EmailRecipient> = {}
): EmailRecipient {
  return {
    email: `recipient-${Date.now()}@test.com`,
    name: "Test Recipient",
    ...overrides,
  };
}

/**
 * Creates a valid send email request payload
 */
export function createSendEmailPayload(
  overrides: Partial<SendEmailRequest> = {}
): SendEmailRequest {
  return {
    to: createMockRecipient(),
    subject: "Test Email Subject",
    htmlBody: "<h1>Test Email</h1><p>This is a test email.</p>",
    textBody: "Test Email\n\nThis is a test email.",
    type: "transactional",
    trackClicks: true,
    trackOpens: true,
    clientReference: generatePrefixedId("email"),
    ...overrides,
  };
}

/**
 * Creates a request with multiple recipients
 */
export function createMultipleRecipientsPayload(
  count: number = 3
): SendEmailRequest {
  const recipients: EmailRecipient[] = [];
  for (let i = 0; i < count; i++) {
    recipients.push(createMockRecipient({ 
      email: `recipient${i}@test.com`,
      name: `Recipient ${i}`,
    }));
  }
  return createSendEmailPayload({ to: recipients });
}

// ============================================================================
// MOCK RESPONSES
// ============================================================================

/**
 * Creates a successful ZeptoMail API response
 */
export function createZeptoMailSuccessResponse(): ZeptoMailResponse {
  return {
    data: [{ message_id: `zepto_${generatePrefixedId("msg")}` }],
    request_id: generatePrefixedId("req"),
  };
}

/**
 * Creates a failed ZeptoMail API response
 */
export function createZeptoMailErrorResponse(
  code: string = "INVALID_REQUEST",
  message: string = "Invalid request"
): ZeptoMailError {
  return {
    error: { code, message },
  };
}

// ============================================================================
// AUTH HELPERS
// ============================================================================

/**
 * Creates a mock producer user for testing
 */
export function createTestProducer(
  overrides: Partial<MockUser> = {}
): MockUser {
  return createMockUser({
    role: "user",
    name: "Test Producer",
    ...overrides,
  });
}

/**
 * Creates a mock session for authenticated requests
 */
export function createTestSession(userId: string): MockSession {
  return createMockSession(userId);
}

// ============================================================================
// HTTP REQUEST FACTORIES
// ============================================================================

/**
 * Creates a mock request with session cookie
 */
export function createAuthenticatedEmailRequest(
  sessionToken: string,
  payload: SendEmailRequest,
  overrides: Partial<{ method: string; headers: Record<string, string> }> = {}
): Request {
  return createMockRequest({
    method: "POST",
    url: FUNCTION_URL,
    headers: {
      "Cookie": `__Secure-rise_access=${sessionToken}`,
      "Origin": "https://risecheckout.com",
      ...overrides.headers,
    },
    body: payload,
  });
}

/**
 * Creates an unauthenticated request
 */
export function createUnauthenticatedEmailRequest(
  payload: SendEmailRequest
): Request {
  return createMockRequest({
    method: "POST",
    url: FUNCTION_URL,
    headers: {
      "Origin": "https://risecheckout.com",
    },
    body: payload,
  });
}

/**
 * Creates a request with invalid origin (CORS test)
 */
export function createInvalidOriginRequest(
  payload: SendEmailRequest
): Request {
  return createMockRequest({
    method: "POST",
    url: FUNCTION_URL,
    headers: {
      "Origin": "https://malicious-site.com",
    },
    body: payload,
  });
}

// ============================================================================
// SUPABASE MOCK HELPERS
// ============================================================================

export interface MockRateLimitRecord {
  identifier: string;
  action: string;
  attempts: number;
  first_attempt_at: string;
  last_attempt_at: string;
  blocked_until: string | null;
}

/**
 * Creates a mock rate limit record
 */
export function createMockRateLimitRecord(
  identifier: string,
  attempts: number = 1,
  blocked: boolean = false
): MockRateLimitRecord {
  const now = new Date();
  return {
    identifier,
    action: "SEND_EMAIL",
    attempts,
    first_attempt_at: now.toISOString(),
    last_attempt_at: now.toISOString(),
    blocked_until: blocked 
      ? new Date(now.getTime() + 3600000).toISOString() 
      : null,
  };
}

// ============================================================================
// ENVIRONMENT MOCK
// ============================================================================

/**
 * Mock environment variables for tests
 */
export const mockEnv = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  ZEPTOMAIL_API_KEY: "Zoho-enczapikey test-api-key",
  ZEPTOMAIL_FROM_NOREPLY: "naoresponda@risecheckout.com",
  ZEPTOMAIL_FROM_SUPPORT: "suporte@risecheckout.com",
  ZEPTOMAIL_FROM_NOTIFICATIONS: "notificacoes@risecheckout.com",
  ZEPTOMAIL_FROM_NAME: "Rise Checkout",
};

/**
 * Sets up mock environment variables
 */
export function setupMockEnv(): void {
  for (const [key, value] of Object.entries(mockEnv)) {
    Deno.env.set(key, value);
  }
}

/**
 * Clears mock environment variables
 */
export function clearMockEnv(): void {
  for (const key of Object.keys(mockEnv)) {
    Deno.env.delete(key);
  }
}
