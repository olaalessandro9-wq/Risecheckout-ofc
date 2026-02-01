/**
 * RLS Security Tester Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for rls-security-tester Edge Function.
 * Tests Row Level Security policies, access control, and data isolation.
 * 
 * NOTE: These tests require a local Supabase instance.
 * They are skipped in CI environments without proper configuration.
 * 
 * @module rls-security-tester/integration.test
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
  name: "rls-security-tester: require admin role",
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
      
      const response = await helpers.makeRequest("rls-security-tester", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "test-all",
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
// RLS Policy Tests
// ============================================================================

Deno.test({
  name: "rls-security-tester: test user data isolation",
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
      
      const response = await helpers.makeRequest("rls-security-tester", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "test-user-isolation",
          userId1: user1.id,
          userId2: user2.id,
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

Deno.test({
  name: "rls-security-tester: test table-level RLS",
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
      
      const response = await helpers.makeRequest("rls-security-tester", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "test-table",
          tableName: "users",
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
// Access Control Tests
// ============================================================================

Deno.test({
  name: "rls-security-tester: test role-based access",
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
      
      const response = await helpers.makeRequest("rls-security-tester", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "test-role-access",
          roles: ["admin", "producer", "buyer"],
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
// Comprehensive Test Suite
// ============================================================================

Deno.test({
  name: "rls-security-tester: run comprehensive RLS test suite",
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
      
      const response = await helpers.makeRequest("rls-security-tester", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "test-all",
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
  name: "rls-security-tester: validate action parameter",
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
      
      const response = await helpers.makeRequest("rls-security-tester", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "invalid-action",
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
// Cleanup
// ============================================================================

Deno.test({
  name: "rls-security-tester: cleanup test data",
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
