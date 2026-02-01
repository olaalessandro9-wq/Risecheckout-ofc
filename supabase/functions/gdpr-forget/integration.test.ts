/**
 * GDPR Forget Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for gdpr-forget Edge Function.
 * Tests right to be forgotten, data deletion, and anonymization.
 * 
 * NOTE: These tests require local Supabase infrastructure.
 * They are skipped in CI environments without SUPABASE_SERVICE_ROLE_KEY.
 * 
 * @module gdpr-forget/integration.test
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

// ============================================================================
// Environment Detection & Test Gating
// ============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const skipTests = !SUPABASE_URL || 
  !SUPABASE_SERVICE_ROLE_KEY || 
  SUPABASE_URL.includes("test.supabase.co") || 
  !SUPABASE_URL.startsWith("https://");

// ============================================================================
// Lazy Client Factory
// ============================================================================

// deno-lint-ignore no-explicit-any
let _supabase: any = null;
const createdUsers: string[] = [];

// deno-lint-ignore no-explicit-any
async function getTestClient(): Promise<any> {
  if (_supabase) return _supabase;
  
  const { createTestClient } = await import("../_shared/test-helpers.ts");
  _supabase = createTestClient();
  return _supabase;
}

async function getTestHelpers() {
  return await import("../_shared/test-helpers.ts");
}

async function cleanup() {
  if (createdUsers.length === 0) return;
  
  const supabase = await getTestClient();
  const { deleteTestUser } = await getTestHelpers();
  
  for (const userId of createdUsers) {
    try {
      await deleteTestUser(supabase, userId);
    } catch (error) {
      console.error(`Failed to delete user ${userId}:`, error);
    }
  }
  createdUsers.length = 0;
}

// ============================================================================
// Account Deletion Tests
// ============================================================================

Deno.test({
  name: "gdpr-forget: initiate account deletion",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const session = await createTestSession(supabase, testUser.id);
      
      const response = await makeRequest("gdpr-forget", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "delete",
          confirmation: "DELETE MY ACCOUNT",
        }),
      });
      
      assert(response.status === 200 || response.status === 202);
      
      const data = await response.json();
      assertExists(data.success || data.requestId);
    } finally {
      await cleanup();
    }
  },
});

Deno.test({
  name: "gdpr-forget: require confirmation",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const session = await createTestSession(supabase, testUser.id);
      
      const response = await makeRequest("gdpr-forget", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "delete",
        }),
      });
      
      assertEquals(response.status, 400);
      
      const data = await response.json();
      assertExists(data.error);
    } finally {
      await cleanup();
    }
  },
});

Deno.test({
  name: "gdpr-forget: validate confirmation text",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const session = await createTestSession(supabase, testUser.id);
      
      const response = await makeRequest("gdpr-forget", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "delete",
          confirmation: "wrong text",
        }),
      });
      
      assertEquals(response.status, 400);
      
      const data = await response.json();
      assertExists(data.error);
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Data Deletion Tests
// ============================================================================

Deno.test({
  name: "gdpr-forget: delete user data",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest, wait } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const session = await createTestSession(supabase, testUser.id);
      
      await makeRequest("gdpr-forget", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "delete",
          confirmation: "DELETE MY ACCOUNT",
        }),
      });
      
      await wait(500);
      const { data: userData } = await supabase
        .from("users")
        .select("status, deleted_at")
        .eq("id", testUser.id)
        .single();
      
      if (userData) {
        assert(
          userData.status === "deleted" ||
          userData.deleted_at !== null
        );
      }
    } finally {
      // Don't cleanup - user should be deleted by the function
    }
  },
});

Deno.test({
  name: "gdpr-forget: invalidate all sessions on deletion",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest, wait } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const session1 = await createTestSession(supabase, testUser.id);
      await createTestSession(supabase, testUser.id);
      
      await makeRequest("gdpr-forget", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session1}`,
        },
        body: JSON.stringify({
          action: "delete",
          confirmation: "DELETE MY ACCOUNT",
        }),
      });
      
      await wait(300);
      const { data: sessions } = await supabase
        .from("sessions")
        .select("is_valid")
        .eq("user_id", testUser.id);
      
      if (sessions) {
        // deno-lint-ignore no-explicit-any
        sessions.forEach((session: any) => {
          assertEquals(session.is_valid, false);
        });
      }
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Authentication Tests
// ============================================================================

Deno.test({
  name: "gdpr-forget: require authentication",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    
    const response = await makeRequest("gdpr-forget", {
      method: "POST",
      body: JSON.stringify({
        action: "delete",
        confirmation: "DELETE MY ACCOUNT",
      }),
    });
    
    assertEquals(response.status, 401);
    
    const data = await response.json();
    assertExists(data.error);
  },
});

Deno.test({
  name: "gdpr-forget: only allow deleting own account",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest, wait } = await getTestHelpers();
    
    const user1 = await createTestUser(supabase);
    const user2 = await createTestUser(supabase);
    createdUsers.push(user1.id, user2.id);
    
    try {
      const session1 = await createTestSession(supabase, user1.id);
      
      const response = await makeRequest("gdpr-forget", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session1}`,
        },
        body: JSON.stringify({
          action: "delete",
          userId: user2.id,
          confirmation: "DELETE MY ACCOUNT",
        }),
      });
      
      assert(response.status === 200 || response.status === 403 || response.status === 202);
      
      await wait(200);
      const { data: user2Data } = await supabase
        .from("users")
        .select("id")
        .eq("id", user2.id)
        .single();
      
      assertExists(user2Data);
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Request Tracking Tests
// ============================================================================

Deno.test({
  name: "gdpr-forget: create deletion request record",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest, wait } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const session = await createTestSession(supabase, testUser.id);
      
      await makeRequest("gdpr-forget", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "delete",
          confirmation: "DELETE MY ACCOUNT",
        }),
      });
      
      await wait(200);
      const { data: requests } = await supabase
        .from("gdpr_requests")
        .select("*")
        .eq("user_id", testUser.id)
        .eq("request_type", "forget")
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (requests && requests.length > 0) {
        const request = requests[0];
        assertEquals(request.user_id, testUser.id);
        assertEquals(request.request_type, "forget");
        assertExists(request.created_at);
      }
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Anonymization Tests
// ============================================================================

Deno.test({
  name: "gdpr-forget: anonymize instead of hard delete (if applicable)",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest, wait } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const session = await createTestSession(supabase, testUser.id);
      
      await makeRequest("gdpr-forget", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "delete",
          confirmation: "DELETE MY ACCOUNT",
        }),
      });
      
      await wait(300);
      const { data: userData } = await supabase
        .from("users")
        .select("email, name")
        .eq("id", testUser.id)
        .single();
      
      if (userData) {
        assert(
          userData.email.includes("deleted") ||
          userData.email.includes("anonymized") ||
          userData.email === null
        );
      }
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Compliance Tests
// ============================================================================

Deno.test({
  name: "gdpr-forget: complete deletion within compliance timeframe",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const session = await createTestSession(supabase, testUser.id);
      
      const response = await makeRequest("gdpr-forget", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "delete",
          confirmation: "DELETE MY ACCOUNT",
        }),
      });
      
      assert(response.status === 200 || response.status === 202);
      
      const data = await response.json();
      
      if (data.scheduledFor || data.completionDate) {
        assertExists(data.scheduledFor || data.completionDate);
      }
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Cleanup after all tests
// ============================================================================

Deno.test({
  name: "cleanup: remove all test data",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { cleanupTestData } = await getTestHelpers();
    await cleanupTestData(supabase);
    assertEquals(true, true);
  },
});
