/**
 * Security Management Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for security-management Edge Function.
 * Tests security alerts, IP blocking, audit trail, and admin permissions.
 * 
 * NOTE: These tests require a local Supabase instance.
 * They are skipped in CI environments without proper configuration.
 * 
 * @module security-management/integration.test
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
  name: "security-management: require admin/owner role",
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
      
      const response = await helpers.makeRequest("security-management", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "block-ip",
          ipAddress: "192.168.1.100",
          reason: "Test block",
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
  name: "security-management: allow admin role",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const helpers = await getTestHelpers();
    // deno-lint-ignore no-explicit-any
    const supabase: any = await getTestClient();
    const createdUsers: string[] = [];
    const createdAlerts: string[] = [];
    
    try {
      const adminUser = await helpers.createTestUser(supabase, { role: "admin" });
      createdUsers.push(adminUser.id);
      
      const session = await helpers.createTestSession(supabase, adminUser.id);
      
      // Create a test alert first
      const { data: alert } = await supabase
        .from("security_alerts")
        .insert({
          alert_type: "test_alert",
          severity: "low",
          user_id: adminUser.id,
          ip_address: "127.0.0.1",
          description: "Test alert",
          is_acknowledged: false,
        })
        .select()
        .single();
      
      if (alert) {
        createdAlerts.push(alert.id);
        
        const response = await helpers.makeRequest("security-management", {
          method: "POST",
          headers: {
            Cookie: `__Secure-rise_access=${session}`,
          },
          body: JSON.stringify({
            action: "acknowledge-alert",
            alertId: alert.id,
          }),
        });
        
        assert(response.status === 200 || response.status === 404);
        await response.text();
      }
    } finally {
      for (const alertId of createdAlerts) {
        try {
          await supabase.from("security_alerts").delete().eq("id", alertId);
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
// Alert Management Tests
// ============================================================================

Deno.test({
  name: "security-management/acknowledge-alert: require alert ID",
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
      
      const response = await helpers.makeRequest("security-management", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "acknowledge-alert",
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
// IP Blocking Tests
// ============================================================================

Deno.test({
  name: "security-management/block-ip: validate IP address format",
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
      
      const response = await helpers.makeRequest("security-management", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "block-ip",
          ipAddress: "invalid-ip-address",
          reason: "Test",
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
  name: "security-management/block-ip: require reason",
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
      
      const response = await helpers.makeRequest("security-management", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "block-ip",
          ipAddress: "192.168.1.100",
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
// IP Unblocking Tests
// ============================================================================

Deno.test({
  name: "security-management/unblock-ip: handle non-existent IP",
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
      
      const response = await helpers.makeRequest("security-management", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "unblock-ip",
          ipAddress: "192.168.99.99",
        }),
      });
      
      assert(response.status === 404 || response.status === 200);
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
// Error Handling Tests
// ============================================================================

Deno.test({
  name: "security-management: handle invalid action",
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
      
      const response = await helpers.makeRequest("security-management", {
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
  name: "security-management: cleanup test data",
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
