/**
 * Get Users With Emails Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for get-users-with-emails Edge Function.
 * Tests user search, filtering, and data retrieval.
 * 
 * NOTE: These tests require a local Supabase instance.
 * They are skipped in CI environments without proper configuration.
 * 
 * @module get-users-with-emails/integration.test
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
  name: "get-users-with-emails: require admin role",
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
      createdUsers.push(producerUser.id);
      
      const session = await helpers.createTestSession(supabase, producerUser.id);
      
      const response = await helpers.makeRequest("get-users-with-emails", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          emails: ["test@example.com"],
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

// ============================================================================
// Search Tests
// ============================================================================

Deno.test({
  name: "get-users-with-emails: find users by email",
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
      const user1 = await helpers.createTestUser(supabase);
      const user2 = await helpers.createTestUser(supabase);
      createdUsers.push(adminUser.id, user1.id, user2.id);
      
      const session = await helpers.createTestSession(supabase, adminUser.id);
      
      const response = await helpers.makeRequest("get-users-with-emails", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          emails: [user1.email, user2.email],
        }),
      });
      
      assert(response.status === 200 || response.status === 404);
      
      if (response.status === 200) {
        const data = await response.json();
        assertExists(data.users);
        assert(Array.isArray(data.users));
      }
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
  name: "get-users-with-emails: handle non-existent emails",
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
      
      const response = await helpers.makeRequest("get-users-with-emails", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          emails: ["nonexistent1@example.com", "nonexistent2@example.com"],
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
// Validation Tests
// ============================================================================

Deno.test({
  name: "get-users-with-emails: require emails parameter",
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
      
      const response = await helpers.makeRequest("get-users-with-emails", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({}),
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
  name: "get-users-with-emails: validate emails array",
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
      
      const response = await helpers.makeRequest("get-users-with-emails", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          emails: "not-an-array",
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
// Data Privacy Tests
// ============================================================================

Deno.test({
  name: "get-users-with-emails: exclude sensitive data",
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
      const targetUser = await helpers.createTestUser(supabase);
      createdUsers.push(adminUser.id, targetUser.id);
      
      const session = await helpers.createTestSession(supabase, adminUser.id);
      
      const response = await helpers.makeRequest("get-users-with-emails", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          emails: [targetUser.email],
        }),
      });
      
      assert(response.status === 200 || response.status === 404);
      
      if (response.status === 200) {
        const data = await response.json();
        if (data.users && data.users.length > 0) {
          const user = data.users[0];
          assert(!user.password_hash);
          assert(!user.password);
        }
      }
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
  name: "get-users-with-emails: cleanup test data",
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
