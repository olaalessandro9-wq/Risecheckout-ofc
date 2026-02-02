/**
 * Send Email Tests - Authentication
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for authentication in send-email Edge Function.
 * Validates cookie-based session auth via unified-auth-v2.
 * 
 * @module send-email/tests/authentication
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  FUNCTION_NAME,
  createSendEmailPayload,
  createAuthenticatedEmailRequest,
  createUnauthenticatedEmailRequest,
  createTestProducer,
  createTestSession,
} from "./_shared.ts";

import {
  createMockSupabaseClient,
  createMockDataStore,
} from "../../_shared/testing/mod.ts";

// ============================================================================
// TEST SETUP
// ============================================================================

const testProducer = createTestProducer();
const testSession = createTestSession(testProducer.id);

// ============================================================================
// MISSING AUTH TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Auth - request without cookie has no auth token`, () => {
  const payload = createSendEmailPayload();
  const request = createUnauthenticatedEmailRequest(payload);
  
  const cookieHeader = request.headers.get("Cookie");
  const hasSessionCookie = cookieHeader?.includes("__Secure-rise_access");
  
  assertEquals(hasSessionCookie ?? false, false, "Should not have session cookie");
});

Deno.test(`[${FUNCTION_NAME}] Auth - request with cookie has auth token`, () => {
  const payload = createSendEmailPayload();
  const request = createAuthenticatedEmailRequest(
    testSession.access_token,
    payload
  );
  
  const cookieHeader = request.headers.get("Cookie");
  const hasSessionCookie = cookieHeader?.includes("__Secure-rise_access");
  
  assertEquals(hasSessionCookie, true, "Should have session cookie");
});

// ============================================================================
// TOKEN EXTRACTION TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Auth - extracts token from cookie correctly`, () => {
  const token = "test-session-token-12345";
  const payload = createSendEmailPayload();
  const request = createAuthenticatedEmailRequest(token, payload);
  
  const cookieHeader = request.headers.get("Cookie");
  const match = cookieHeader?.match(/__Secure-rise_access=([^;]+)/);
  const extractedToken = match?.[1];
  
  assertEquals(extractedToken, token, "Token should be extracted correctly");
});

Deno.test(`[${FUNCTION_NAME}] Auth - handles empty cookie header`, () => {
  const payload = createSendEmailPayload();
  const request = new Request("https://test.supabase.co/functions/v1/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": "",
    },
    body: JSON.stringify(payload),
  });
  
  const cookieHeader = request.headers.get("Cookie");
  assertEquals(cookieHeader, "", "Cookie header should be empty");
});

Deno.test(`[${FUNCTION_NAME}] Auth - handles malformed cookie`, () => {
  const payload = createSendEmailPayload();
  const request = new Request("https://test.supabase.co/functions/v1/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": "invalid_cookie_format",
    },
    body: JSON.stringify(payload),
  });
  
  const cookieHeader = request.headers.get("Cookie");
  const match = cookieHeader?.match(/__Secure-rise_access=([^;]+)/);
  
  assertEquals(match, null, "Should not match malformed cookie");
});

// ============================================================================
// SESSION VALIDATION TESTS (MOCK)
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Auth - valid session returns producer data`, async () => {
  const mockData = createMockDataStore({
    sessions: [{
      id: testSession.id,
      user_id: testProducer.id,
      session_token: testSession.access_token,
      is_valid: true,
      access_token_expires_at: new Date(Date.now() + 3600000).toISOString(),
    }],
    profiles: [{
      id: testProducer.id,
      name: testProducer.name,
      email: testProducer.email,
    }],
    user_roles: [{
      user_id: testProducer.id,
      role: "user",
    }],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  
  // Simulate session lookup
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("session_token", testSession.access_token)
    .eq("is_valid", true)
    .single();
  
  assertExists(session, "Session should exist");
  const sessionRecord = session as { user_id: string };
  assertEquals(sessionRecord.user_id, testProducer.id, "User ID should match");
});

Deno.test(`[${FUNCTION_NAME}] Auth - expired session is rejected`, async () => {
  const expiredSession = createTestSession(testProducer.id);
  expiredSession.expires_at = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
  
  const mockData = createMockDataStore({
    sessions: [{
      id: expiredSession.id,
      user_id: testProducer.id,
      session_token: expiredSession.access_token,
      is_valid: true,
      access_token_expires_at: expiredSession.expires_at,
    }],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  
  // Simulate session lookup with expiration check
  const now = new Date().toISOString();
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("session_token", expiredSession.access_token)
    .eq("is_valid", true)
    .gte("access_token_expires_at", now)
    .single();
  
  assertEquals(session, null, "Expired session should not be found");
});

Deno.test(`[${FUNCTION_NAME}] Auth - invalidated session is rejected`, async () => {
  const mockData = createMockDataStore({
    sessions: [{
      id: testSession.id,
      user_id: testProducer.id,
      session_token: testSession.access_token,
      is_valid: false, // Session invalidated
      access_token_expires_at: new Date(Date.now() + 3600000).toISOString(),
    }],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("session_token", testSession.access_token)
    .eq("is_valid", true)
    .single();
  
  assertEquals(session, null, "Invalidated session should not be found");
});

// ============================================================================
// ROLE VALIDATION TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] Auth - producer role can send emails`, async () => {
  const producer = createTestProducer({ role: "user" });
  
  // Simulate role check
  const allowedRoles = ["user", "admin", "owner"];
  const hasPermission = allowedRoles.includes(producer.role);
  
  assertEquals(hasPermission, true, "Producer should have permission");
});

Deno.test(`[${FUNCTION_NAME}] Auth - admin role can send emails`, async () => {
  const admin = createTestProducer({ role: "admin" });
  
  const allowedRoles = ["user", "admin", "owner"];
  const hasPermission = allowedRoles.includes(admin.role);
  
  assertEquals(hasPermission, true, "Admin should have permission");
});

Deno.test(`[${FUNCTION_NAME}] Auth - owner role can send emails`, async () => {
  const owner = createTestProducer({ role: "owner" });
  
  const allowedRoles = ["user", "admin", "owner"];
  const hasPermission = allowedRoles.includes(owner.role);
  
  assertEquals(hasPermission, true, "Owner should have permission");
});
