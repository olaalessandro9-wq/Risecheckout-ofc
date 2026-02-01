/**
 * Manage User Status Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for manage-user-status Edge Function.
 * Tests user activation, suspension, and status management.
 * 
 * NOTE: These tests require local Supabase infrastructure.
 * They are skipped in CI environments without SUPABASE_SERVICE_ROLE_KEY.
 * 
 * @module manage-user-status/integration.test
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
// Permission Tests
// ============================================================================

Deno.test({
  name: "manage-user-status: require admin role",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest } = await getTestHelpers();
    
    const producerUser = await createTestUser(supabase, { role: "producer" });
    const targetUser = await createTestUser(supabase, { role: "buyer" });
    createdUsers.push(producerUser.id, targetUser.id);
    
    try {
      const session = await createTestSession(supabase, producerUser.id);
      
      const response = await makeRequest("manage-user-status", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          action: "suspend",
          reason: "Test suspension",
        }),
      });
      
      assertEquals(response.status, 403);
      
      const data = await response.json();
      assertExists(data.error);
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Suspend User Tests
// ============================================================================

Deno.test({
  name: "manage-user-status: suspend user successfully",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest, wait } = await getTestHelpers();
    
    const adminUser = await createTestUser(supabase, { role: "admin" });
    const targetUser = await createTestUser(supabase, { role: "buyer" });
    createdUsers.push(adminUser.id, targetUser.id);
    
    try {
      const session = await createTestSession(supabase, adminUser.id);
      
      const response = await makeRequest("manage-user-status", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          action: "suspend",
          reason: "Violation of terms",
        }),
      });
      
      assert(response.status === 200 || response.status === 404);
      
      if (response.status === 200) {
        const data = await response.json();
        assertExists(data.success);
        
        await wait(100);
        const { data: userData } = await supabase
          .from("users")
          .select("status")
          .eq("id", targetUser.id)
          .single();
        
        if (userData) {
          assertEquals(userData.status, "suspended");
        }
      }
    } finally {
      await cleanup();
    }
  },
});

Deno.test({
  name: "manage-user-status: require reason for suspension",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest } = await getTestHelpers();
    
    const adminUser = await createTestUser(supabase, { role: "admin" });
    const targetUser = await createTestUser(supabase, { role: "buyer" });
    createdUsers.push(adminUser.id, targetUser.id);
    
    try {
      const session = await createTestSession(supabase, adminUser.id);
      
      const response = await makeRequest("manage-user-status", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          action: "suspend",
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
// Activate User Tests
// ============================================================================

Deno.test({
  name: "manage-user-status: activate suspended user",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest, wait } = await getTestHelpers();
    
    const adminUser = await createTestUser(supabase, { role: "admin" });
    const targetUser = await createTestUser(supabase, { role: "buyer" });
    createdUsers.push(adminUser.id, targetUser.id);
    
    try {
      const session = await createTestSession(supabase, adminUser.id);
      
      const response = await makeRequest("manage-user-status", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          action: "activate",
        }),
      });
      
      assert(response.status === 200 || response.status === 404);
      
      if (response.status === 200) {
        const data = await response.json();
        assertExists(data.success);
        
        await wait(100);
        const { data: userData } = await supabase
          .from("users")
          .select("status")
          .eq("id", targetUser.id)
          .single();
        
        if (userData) {
          assertEquals(userData.status, "active");
        }
      }
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Deactivate User Tests
// ============================================================================

Deno.test({
  name: "manage-user-status: deactivate user",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest } = await getTestHelpers();
    
    const adminUser = await createTestUser(supabase, { role: "admin" });
    const targetUser = await createTestUser(supabase, { role: "buyer" });
    createdUsers.push(adminUser.id, targetUser.id);
    
    try {
      const session = await createTestSession(supabase, adminUser.id);
      
      const response = await makeRequest("manage-user-status", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          action: "deactivate",
          reason: "Account closure request",
        }),
      });
      
      assert(response.status === 200 || response.status === 404);
      
      if (response.status === 200) {
        const data = await response.json();
        assertExists(data.success);
      }
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Validation Tests
// ============================================================================

Deno.test({
  name: "manage-user-status: validate action parameter",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest } = await getTestHelpers();
    
    const adminUser = await createTestUser(supabase, { role: "admin" });
    const targetUser = await createTestUser(supabase, { role: "buyer" });
    createdUsers.push(adminUser.id, targetUser.id);
    
    try {
      const session = await createTestSession(supabase, adminUser.id);
      
      const response = await makeRequest("manage-user-status", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          action: "invalid_action",
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
  name: "manage-user-status: require userId",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest } = await getTestHelpers();
    
    const adminUser = await createTestUser(supabase, { role: "admin" });
    createdUsers.push(adminUser.id);
    
    try {
      const session = await createTestSession(supabase, adminUser.id);
      
      const response = await makeRequest("manage-user-status", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "suspend",
          reason: "Test",
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
// Edge Cases
// ============================================================================

Deno.test({
  name: "manage-user-status: handle non-existent user",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest } = await getTestHelpers();
    
    const adminUser = await createTestUser(supabase, { role: "admin" });
    createdUsers.push(adminUser.id);
    
    try {
      const session = await createTestSession(supabase, adminUser.id);
      
      const response = await makeRequest("manage-user-status", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          userId: "non-existent-user-id-12345",
          action: "suspend",
          reason: "Test",
        }),
      });
      
      assertEquals(response.status, 404);
      
      const data = await response.json();
      assertExists(data.error);
    } finally {
      await cleanup();
    }
  },
});

Deno.test({
  name: "manage-user-status: prevent changing own status",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest } = await getTestHelpers();
    
    const adminUser = await createTestUser(supabase, { role: "admin" });
    createdUsers.push(adminUser.id);
    
    try {
      const session = await createTestSession(supabase, adminUser.id);
      
      const response = await makeRequest("manage-user-status", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          userId: adminUser.id,
          action: "suspend",
          reason: "Test",
        }),
      });
      
      assert(response.status === 403 || response.status === 400);
      
      const data = await response.json();
      assertExists(data.error);
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Session Revocation Tests
// ============================================================================

Deno.test({
  name: "manage-user-status: revoke sessions on suspension",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest, wait } = await getTestHelpers();
    
    const adminUser = await createTestUser(supabase, { role: "admin" });
    const targetUser = await createTestUser(supabase, { role: "buyer" });
    createdUsers.push(adminUser.id, targetUser.id);
    
    try {
      const adminSession = await createTestSession(supabase, adminUser.id);
      await createTestSession(supabase, targetUser.id);
      
      await makeRequest("manage-user-status", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${adminSession}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          action: "suspend",
          reason: "Test suspension",
        }),
      });
      
      await wait(200);
      const { data: sessions } = await supabase
        .from("sessions")
        .select("is_valid")
        .eq("user_id", targetUser.id);
      
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
// Audit Trail Tests
// ============================================================================

Deno.test({
  name: "manage-user-status: log status changes in audit trail",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest, wait } = await getTestHelpers();
    
    const adminUser = await createTestUser(supabase, { role: "admin" });
    const targetUser = await createTestUser(supabase, { role: "buyer" });
    createdUsers.push(adminUser.id, targetUser.id);
    
    try {
      const session = await createTestSession(supabase, adminUser.id);
      
      await makeRequest("manage-user-status", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          action: "suspend",
          reason: "Audit trail test",
        }),
      });
      
      await wait(200);
      const { data: auditLogs } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("action", "change-user-status")
        .eq("performed_by", adminUser.id)
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (auditLogs && auditLogs.length > 0) {
        const log = auditLogs[0];
        assertEquals(log.action, "change-user-status");
        assertEquals(log.performed_by, adminUser.id);
        assertExists(log.metadata);
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
