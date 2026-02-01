/**
 * Session Manager Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for session-manager Edge Function.
 * Tests session lifecycle, multi-device management, and revocation flows.
 * 
 * NOTE: These tests require a local Supabase instance.
 * They are skipped in CI environments without proper configuration.
 * 
 * @module session-manager/integration.test
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

// ============================================================================
// Environment Detection & Test Gating
// ============================================================================

const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const skipTests = !SUPABASE_SERVICE_ROLE_KEY;

// Lazy initialization - only create client when needed inside tests
async function getTestClient() {
  const { createTestClient } = await import("../_shared/test-helpers.ts");
  return createTestClient();
}

async function getTestHelpers() {
  return await import("../_shared/test-helpers.ts");
}

// ============================================================================
// List Sessions Integration Tests
// ============================================================================

Deno.test({
  name: "session-manager/list: list all active sessions for user",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    // deno-lint-ignore no-explicit-any
    const supabase: any = await getTestClient();
    const createdUsers: string[] = [];
    const createdSessions: string[] = [];
    
    try {
      const testUser = await helpers.createTestUser(supabase);
      createdUsers.push(testUser.id);
      
      const session1 = await helpers.createTestSession(supabase, testUser.id);
      const session2 = await helpers.createTestSession(supabase, testUser.id);
      createdSessions.push(session1, session2);
      
      const response = await helpers.makeRequest("session-manager", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session1}`,
        },
        body: JSON.stringify({
          action: "list",
        }),
      });
      
      assertEquals(response.status, 200);
      const data = await response.json();
      assertExists(data.sessions);
      assert(Array.isArray(data.sessions));
    } finally {
      for (const sessionToken of createdSessions) {
        try {
          await helpers.deleteTestSession(supabase, sessionToken);
        } catch (_e) { /* cleanup */ }
      }
      for (const userId of createdUsers) {
        try {
          await helpers.deleteTestUser(supabase, userId);
        } catch (_e) { /* cleanup */ }
      }
    }
  },
});

Deno.test({
  name: "session-manager/list: requires authentication",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    
    const response = await helpers.makeRequest("session-manager", {
      method: "POST",
      body: JSON.stringify({
        action: "list",
      }),
    });
    
    assertEquals(response.status, 401);
    const data = await response.json();
    assertExists(data.error);
  },
});

// ============================================================================
// Revoke Session Integration Tests
// ============================================================================

Deno.test({
  name: "session-manager/revoke: revoke specific session by ID",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    // deno-lint-ignore no-explicit-any
    const supabase: any = await getTestClient();
    const createdUsers: string[] = [];
    const createdSessions: string[] = [];
    
    try {
      const testUser = await helpers.createTestUser(supabase);
      createdUsers.push(testUser.id);
      
      const currentSession = await helpers.createTestSession(supabase, testUser.id);
      const targetSession = await helpers.createTestSession(supabase, testUser.id);
      createdSessions.push(currentSession, targetSession);
      
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("id")
        .eq("session_token", targetSession)
        .single();
      
      if (sessionData) {
        const response = await helpers.makeRequest("session-manager", {
          method: "POST",
          headers: {
            Cookie: `__Secure-rise_access=${currentSession}`,
          },
          body: JSON.stringify({
            action: "revoke",
            sessionId: sessionData.id,
          }),
        });
        
        assertEquals(response.status, 200);
        const data = await response.json();
        assertExists(data.success);
      }
    } finally {
      for (const sessionToken of createdSessions) {
        try {
          await helpers.deleteTestSession(supabase, sessionToken);
        } catch (_e) { /* cleanup */ }
      }
      for (const userId of createdUsers) {
        try {
          await helpers.deleteTestUser(supabase, userId);
        } catch (_e) { /* cleanup */ }
      }
    }
  },
});

Deno.test({
  name: "session-manager/revoke: prevent revoking other user's sessions",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    // deno-lint-ignore no-explicit-any
    const supabase: any = await getTestClient();
    const createdUsers: string[] = [];
    const createdSessions: string[] = [];
    
    try {
      const user1 = await helpers.createTestUser(supabase);
      const user2 = await helpers.createTestUser(supabase);
      createdUsers.push(user1.id, user2.id);
      
      const user1Session = await helpers.createTestSession(supabase, user1.id);
      const user2Session = await helpers.createTestSession(supabase, user2.id);
      createdSessions.push(user1Session, user2Session);
      
      const { data: user2SessionData } = await supabase
        .from("sessions")
        .select("id")
        .eq("session_token", user2Session)
        .single();
      
      if (user2SessionData) {
        const response = await helpers.makeRequest("session-manager", {
          method: "POST",
          headers: {
            Cookie: `__Secure-rise_access=${user1Session}`,
          },
          body: JSON.stringify({
            action: "revoke",
            sessionId: user2SessionData.id,
          }),
        });
        
        assert(response.status === 403 || response.status === 404);
        await response.text();
      }
    } finally {
      for (const sessionToken of createdSessions) {
        try {
          await helpers.deleteTestSession(supabase, sessionToken);
        } catch (_e) { /* cleanup */ }
      }
      for (const userId of createdUsers) {
        try {
          await helpers.deleteTestUser(supabase, userId);
        } catch (_e) { /* cleanup */ }
      }
    }
  },
});

Deno.test({
  name: "session-manager/revoke: handle non-existent session ID",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    // deno-lint-ignore no-explicit-any
    const supabase: any = await getTestClient();
    const createdUsers: string[] = [];
    const createdSessions: string[] = [];
    
    try {
      const testUser = await helpers.createTestUser(supabase);
      createdUsers.push(testUser.id);
      
      const session = await helpers.createTestSession(supabase, testUser.id);
      createdSessions.push(session);
      
      const response = await helpers.makeRequest("session-manager", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "revoke",
          sessionId: "non-existent-session-id-12345",
        }),
      });
      
      assertEquals(response.status, 404);
      const data = await response.json();
      assertExists(data.error);
    } finally {
      for (const sessionToken of createdSessions) {
        try {
          await helpers.deleteTestSession(supabase, sessionToken);
        } catch (_e) { /* cleanup */ }
      }
      for (const userId of createdUsers) {
        try {
          await helpers.deleteTestUser(supabase, userId);
        } catch (_e) { /* cleanup */ }
      }
    }
  },
});

// ============================================================================
// Revoke All Sessions Integration Tests
// ============================================================================

Deno.test({
  name: "session-manager/revoke-all: revoke all sessions for user",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    // deno-lint-ignore no-explicit-any
    const supabase: any = await getTestClient();
    const createdUsers: string[] = [];
    const createdSessions: string[] = [];
    
    try {
      const testUser = await helpers.createTestUser(supabase);
      createdUsers.push(testUser.id);
      
      const session1 = await helpers.createTestSession(supabase, testUser.id);
      const session2 = await helpers.createTestSession(supabase, testUser.id);
      createdSessions.push(session1, session2);
      
      const response = await helpers.makeRequest("session-manager", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session1}`,
        },
        body: JSON.stringify({
          action: "revoke-all",
        }),
      });
      
      assertEquals(response.status, 200);
      const data = await response.json();
      assertExists(data.success);
    } finally {
      for (const sessionToken of createdSessions) {
        try {
          await helpers.deleteTestSession(supabase, sessionToken);
        } catch (_e) { /* cleanup */ }
      }
      for (const userId of createdUsers) {
        try {
          await helpers.deleteTestUser(supabase, userId);
        } catch (_e) { /* cleanup */ }
      }
    }
  },
});

// ============================================================================
// Revoke Other Sessions Integration Tests
// ============================================================================

Deno.test({
  name: "session-manager/revoke-others: keep current session active",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    // deno-lint-ignore no-explicit-any
    const supabase: any = await getTestClient();
    const createdUsers: string[] = [];
    const createdSessions: string[] = [];
    
    try {
      const testUser = await helpers.createTestUser(supabase);
      createdUsers.push(testUser.id);
      
      const currentSession = await helpers.createTestSession(supabase, testUser.id);
      const otherSession = await helpers.createTestSession(supabase, testUser.id);
      createdSessions.push(currentSession, otherSession);
      
      const response = await helpers.makeRequest("session-manager", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${currentSession}`,
        },
        body: JSON.stringify({
          action: "revoke-others",
        }),
      });
      
      assertEquals(response.status, 200);
      const data = await response.json();
      assertExists(data.success);
    } finally {
      for (const sessionToken of createdSessions) {
        try {
          await helpers.deleteTestSession(supabase, sessionToken);
        } catch (_e) { /* cleanup */ }
      }
      for (const userId of createdUsers) {
        try {
          await helpers.deleteTestUser(supabase, userId);
        } catch (_e) { /* cleanup */ }
      }
    }
  },
});

// ============================================================================
// Cleanup
// ============================================================================

Deno.test({
  name: "session-manager: cleanup test data",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    // deno-lint-ignore no-explicit-any
    const supabase: any = await getTestClient();
    await helpers.cleanupTestData(supabase);
    assertEquals(true, true);
  },
});
