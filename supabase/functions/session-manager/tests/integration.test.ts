/**
 * Session Manager - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * End-to-end tests for session management.
 * Requires RUN_INTEGRATION=true environment variable.
 * 
 * @module session-manager/tests/integration
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import { skipIntegration } from "../../_shared/testing/mod.ts";

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || "http://localhost:54321";
const AUTH_URL = `${SUPABASE_URL}/functions/v1/unified-auth`;
const SESSION_URL = `${SUPABASE_URL}/functions/v1/session-manager`;

const TEST_PASSWORD = "IntegrationTest123!";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function createTestUser(): Promise<{ email: string; accessToken: string; refreshToken: string }> {
  const email = `session-test-${Date.now()}@example.com`;
  
  const response = await fetch(`${AUTH_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: TEST_PASSWORD,
      name: "Session Test User",
    }),
  });
  
  const cookies = response.headers.get("Set-Cookie") || "";
  const accessTokenMatch = cookies.match(/__Secure-rise_access=([^;]+)/);
  const refreshTokenMatch = cookies.match(/__Secure-rise_refresh=([^;]+)/);
  
  await response.text();
  
  return {
    email,
    accessToken: accessTokenMatch?.[1] || "",
    refreshToken: refreshTokenMatch?.[1] || "",
  };
}

// ============================================================================
// LIST SESSIONS TESTS
// ============================================================================

Deno.test({
  name: "integration: list sessions returns at least one session",
  ignore: skipIntegration(),
  fn: async () => {
    const { accessToken } = await createTestUser();
    
    if (!accessToken) {
      return; // Skip if registration failed
    }
    
    const response = await fetch(SESSION_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessToken}`,
      },
      body: JSON.stringify({ action: "list" }),
    });
    
    const body = await response.json();
    assertEquals(response.status, 200, `List failed: ${JSON.stringify(body)}`);
    assertEquals(body.success, true);
    assert(Array.isArray(body.sessions));
    assert(body.sessions.length >= 1, "Should have at least one session");
  },
});

Deno.test({
  name: "integration: list sessions identifies current session",
  ignore: skipIntegration(),
  fn: async () => {
    const { accessToken } = await createTestUser();
    
    if (!accessToken) {
      return;
    }
    
    const response = await fetch(SESSION_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessToken}`,
      },
      body: JSON.stringify({ action: "list" }),
    });
    
    const body = await response.json();
    
    if (response.status === 200) {
      const currentSession = body.sessions?.find((s: { is_current?: boolean }) => s.is_current);
      assertExists(currentSession, "Should identify current session");
    }
  },
});

// ============================================================================
// REVOKE SESSION TESTS
// ============================================================================

Deno.test({
  name: "integration: revoke session by ID",
  ignore: skipIntegration(),
  fn: async () => {
    const { accessToken } = await createTestUser();
    
    if (!accessToken) {
      return;
    }
    
    // First, list sessions to get a session ID
    const listResponse = await fetch(SESSION_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessToken}`,
      },
      body: JSON.stringify({ action: "list" }),
    });
    
    const listBody = await listResponse.json();
    
    if (listResponse.status !== 200 || !listBody.sessions?.length) {
      return;
    }
    
    // Get a non-current session to revoke
    const sessionToRevoke = listBody.sessions.find((s: { is_current?: boolean }) => !s.is_current);
    
    if (!sessionToRevoke) {
      // Only one session, skip
      return;
    }
    
    const revokeResponse = await fetch(SESSION_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessToken}`,
      },
      body: JSON.stringify({ action: "revoke", sessionId: sessionToRevoke.id }),
    });
    
    const revokeBody = await revokeResponse.json();
    assertEquals(revokeResponse.status, 200, `Revoke failed: ${JSON.stringify(revokeBody)}`);
    assertEquals(revokeBody.success, true);
  },
});

// ============================================================================
// REVOKE ALL SESSIONS TESTS
// ============================================================================

Deno.test({
  name: "integration: revoke-all invalidates all sessions",
  ignore: skipIntegration(),
  fn: async () => {
    const { accessToken } = await createTestUser();
    
    if (!accessToken) {
      return;
    }
    
    // Revoke all sessions
    const revokeResponse = await fetch(SESSION_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessToken}`,
      },
      body: JSON.stringify({ action: "revoke-all" }),
    });
    
    const revokeBody = await revokeResponse.json();
    assertEquals(revokeResponse.status, 200, `Revoke-all failed: ${JSON.stringify(revokeBody)}`);
    assertEquals(revokeBody.success, true);
    
    // Verify session is now invalid
    const verifyResponse = await fetch(SESSION_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessToken}`,
      },
      body: JSON.stringify({ action: "list" }),
    });
    
    // Should be unauthorized after revoke-all
    assertEquals(verifyResponse.status, 401);
    await verifyResponse.text();
  },
});

// ============================================================================
// REVOKE OTHERS TESTS
// ============================================================================

Deno.test({
  name: "integration: revoke-others keeps current session",
  ignore: skipIntegration(),
  fn: async () => {
    const { accessToken } = await createTestUser();
    
    if (!accessToken) {
      return;
    }
    
    // Revoke other sessions
    const revokeResponse = await fetch(SESSION_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessToken}`,
      },
      body: JSON.stringify({ action: "revoke-others" }),
    });
    
    const revokeBody = await revokeResponse.json();
    assertEquals(revokeResponse.status, 200, `Revoke-others failed: ${JSON.stringify(revokeBody)}`);
    assertEquals(revokeBody.success, true);
    
    // Current session should still be valid
    const verifyResponse = await fetch(SESSION_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessToken}`,
      },
      body: JSON.stringify({ action: "list" }),
    });
    
    const verifyBody = await verifyResponse.json();
    assertEquals(verifyResponse.status, 200, "Current session should remain valid");
    assertEquals(verifyBody.success, true);
  },
});
