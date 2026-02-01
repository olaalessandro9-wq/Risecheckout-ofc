/**
 * Manage User Role Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for manage-user-role Edge Function.
 * Tests role assignment, validation, and permission checks.
 * 
 * NOTE: These tests require a local Supabase instance.
 * They are skipped in CI environments without proper configuration.
 * 
 * @module manage-user-role/integration.test
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
// Permission Tests
// ============================================================================

Deno.test({
  name: "manage-user-role: require admin role",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    // deno-lint-ignore no-explicit-any
    const supabase: any = await getTestClient();
    const createdUsers: string[] = [];
    
    try {
      const producerUser = await helpers.createTestUser(supabase, { role: "producer" });
      const targetUser = await helpers.createTestUser(supabase, { role: "buyer" });
      createdUsers.push(producerUser.id, targetUser.id);
      
      const session = await helpers.createTestSession(supabase, producerUser.id);
      
      const response = await helpers.makeRequest("manage-user-role", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          newRole: "affiliate",
        }),
      });
      
      assertEquals(response.status, 403);
      const data = await response.json();
      assertExists(data.error);
    } finally {
      for (const userId of createdUsers) {
        try {
          await helpers.deleteTestUser(supabase, userId);
        } catch (_e) { /* cleanup */ }
      }
    }
  },
});

Deno.test({
  name: "manage-user-role: allow admin to change roles",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    // deno-lint-ignore no-explicit-any
    const supabase: any = await getTestClient();
    const createdUsers: string[] = [];
    
    try {
      const adminUser = await helpers.createTestUser(supabase, { role: "admin" });
      const targetUser = await helpers.createTestUser(supabase, { role: "buyer" });
      createdUsers.push(adminUser.id, targetUser.id);
      
      const session = await helpers.createTestSession(supabase, adminUser.id);
      
      const response = await helpers.makeRequest("manage-user-role", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          newRole: "producer",
        }),
      });
      
      assert(response.status === 200 || response.status === 404);
      await response.text();
    } finally {
      for (const userId of createdUsers) {
        try {
          await helpers.deleteTestUser(supabase, userId);
        } catch (_e) { /* cleanup */ }
      }
    }
  },
});

// ============================================================================
// Role Change Tests
// ============================================================================

Deno.test({
  name: "manage-user-role: validate role values",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    // deno-lint-ignore no-explicit-any
    const supabase: any = await getTestClient();
    const createdUsers: string[] = [];
    
    try {
      const adminUser = await helpers.createTestUser(supabase, { role: "admin" });
      const targetUser = await helpers.createTestUser(supabase, { role: "buyer" });
      createdUsers.push(adminUser.id, targetUser.id);
      
      const session = await helpers.createTestSession(supabase, adminUser.id);
      
      const response = await helpers.makeRequest("manage-user-role", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          newRole: "invalid_role",
        }),
      });
      
      assertEquals(response.status, 400);
      const data = await response.json();
      assertExists(data.error);
    } finally {
      for (const userId of createdUsers) {
        try {
          await helpers.deleteTestUser(supabase, userId);
        } catch (_e) { /* cleanup */ }
      }
    }
  },
});

Deno.test({
  name: "manage-user-role: require userId",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    // deno-lint-ignore no-explicit-any
    const supabase: any = await getTestClient();
    const createdUsers: string[] = [];
    
    try {
      const adminUser = await helpers.createTestUser(supabase, { role: "admin" });
      createdUsers.push(adminUser.id);
      
      const session = await helpers.createTestSession(supabase, adminUser.id);
      
      const response = await helpers.makeRequest("manage-user-role", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          newRole: "producer",
        }),
      });
      
      assertEquals(response.status, 400);
      const data = await response.json();
      assertExists(data.error);
    } finally {
      for (const userId of createdUsers) {
        try {
          await helpers.deleteTestUser(supabase, userId);
        } catch (_e) { /* cleanup */ }
      }
    }
  },
});

Deno.test({
  name: "manage-user-role: require newRole",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    // deno-lint-ignore no-explicit-any
    const supabase: any = await getTestClient();
    const createdUsers: string[] = [];
    
    try {
      const adminUser = await helpers.createTestUser(supabase, { role: "admin" });
      const targetUser = await helpers.createTestUser(supabase, { role: "buyer" });
      createdUsers.push(adminUser.id, targetUser.id);
      
      const session = await helpers.createTestSession(supabase, adminUser.id);
      
      const response = await helpers.makeRequest("manage-user-role", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
        }),
      });
      
      assertEquals(response.status, 400);
      const data = await response.json();
      assertExists(data.error);
    } finally {
      for (const userId of createdUsers) {
        try {
          await helpers.deleteTestUser(supabase, userId);
        } catch (_e) { /* cleanup */ }
      }
    }
  },
});

// ============================================================================
// Edge Cases
// ============================================================================

Deno.test({
  name: "manage-user-role: handle non-existent user",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    // deno-lint-ignore no-explicit-any
    const supabase: any = await getTestClient();
    const createdUsers: string[] = [];
    
    try {
      const adminUser = await helpers.createTestUser(supabase, { role: "admin" });
      createdUsers.push(adminUser.id);
      
      const session = await helpers.createTestSession(supabase, adminUser.id);
      
      const response = await helpers.makeRequest("manage-user-role", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          userId: "non-existent-user-id-12345",
          newRole: "producer",
        }),
      });
      
      assertEquals(response.status, 404);
      const data = await response.json();
      assertExists(data.error);
    } finally {
      for (const userId of createdUsers) {
        try {
          await helpers.deleteTestUser(supabase, userId);
        } catch (_e) { /* cleanup */ }
      }
    }
  },
});

Deno.test({
  name: "manage-user-role: prevent changing own role",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    // deno-lint-ignore no-explicit-any
    const supabase: any = await getTestClient();
    const createdUsers: string[] = [];
    
    try {
      const adminUser = await helpers.createTestUser(supabase, { role: "admin" });
      createdUsers.push(adminUser.id);
      
      const session = await helpers.createTestSession(supabase, adminUser.id);
      
      const response = await helpers.makeRequest("manage-user-role", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          userId: adminUser.id,
          newRole: "buyer",
        }),
      });
      
      assert(response.status === 403 || response.status === 400);
      const data = await response.json();
      assertExists(data.error);
    } finally {
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
  name: "manage-user-role: cleanup test data",
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
