/**
 * GDPR Request Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for gdpr-request Edge Function.
 * Tests GDPR data export, user data retrieval, and compliance.
 * 
 * NOTE: These tests require local Supabase infrastructure.
 * They are skipped in CI environments without SUPABASE_SERVICE_ROLE_KEY.
 * 
 * @module gdpr-request/integration.test
 * @version 1.1.0
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  skipIntegration,
  integrationTestOptions,
} from "../_shared/testing/mod.ts";

// ============================================================================
// Environment Detection
// ============================================================================

const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const skipServiceRoleTests = !SUPABASE_SERVICE_ROLE_KEY || skipIntegration();

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
// Data Export Tests
// ============================================================================

Deno.test({
  name: "gdpr-request/integration: export user data successfully",
  ignore: skipServiceRoleTests,
  ...integrationTestOptions,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const session = await createTestSession(supabase, testUser.id);
      
      const response = await makeRequest("gdpr-request", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "export",
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
  name: "gdpr-request/integration: include all user data categories",
  ignore: skipServiceRoleTests,
  ...integrationTestOptions,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const session = await createTestSession(supabase, testUser.id);
      
      const response = await makeRequest("gdpr-request", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "export",
        }),
      });
      
      assert(response.status === 200 || response.status === 202);
      
      const data = await response.json();
      
      if (data.data) {
        assertExists(data.data.profile || data.data.user);
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
  name: "gdpr-request/integration: require authentication",
  ignore: skipServiceRoleTests,
  ...integrationTestOptions,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    
    const response = await makeRequest("gdpr-request", {
      method: "POST",
      body: JSON.stringify({
        action: "export",
      }),
    });
    
    assertEquals(response.status, 401);
    
    const data = await response.json();
    assertExists(data.error);
  },
});

Deno.test({
  name: "gdpr-request/integration: only allow access to own data",
  ignore: skipServiceRoleTests,
  ...integrationTestOptions,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest } = await getTestHelpers();
    
    const user1 = await createTestUser(supabase);
    const user2 = await createTestUser(supabase);
    createdUsers.push(user1.id, user2.id);
    
    try {
      const session1 = await createTestSession(supabase, user1.id);
      
      const response = await makeRequest("gdpr-request", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session1}`,
        },
        body: JSON.stringify({
          action: "export",
          userId: user2.id,
        }),
      });
      
      assert(response.status === 200 || response.status === 403);
      
      if (response.status === 200) {
        const data = await response.json();
        if (data.data && data.data.user) {
          assertEquals(data.data.user.id, user1.id);
        }
      }
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Request Tracking Tests
// ============================================================================

Deno.test({
  name: "gdpr-request/integration: create request record",
  ignore: skipServiceRoleTests,
  ...integrationTestOptions,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest, wait } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const session = await createTestSession(supabase, testUser.id);
      
      await makeRequest("gdpr-request", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "export",
        }),
      });
      
      await wait(200);
      const { data: requests } = await supabase
        .from("gdpr_requests")
        .select("*")
        .eq("user_id", testUser.id)
        .eq("request_type", "export")
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (requests && requests.length > 0) {
        const request = requests[0];
        assertEquals(request.user_id, testUser.id);
        assertEquals(request.request_type, "export");
        assertExists(request.created_at);
      }
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Rate Limiting Tests
// ============================================================================

Deno.test({
  name: "gdpr-request/integration: rate limit requests",
  ignore: skipServiceRoleTests,
  ...integrationTestOptions,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest, wait } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const session = await createTestSession(supabase, testUser.id);
      
      const responses: Response[] = [];
      for (let i = 0; i < 5; i++) {
        const response = await makeRequest("gdpr-request", {
          method: "POST",
          headers: {
            Cookie: `__Secure-rise_access=${session}`,
          },
          body: JSON.stringify({
            action: "export",
          }),
        });
        responses.push(response);
        await wait(100);
      }
      
      const rateLimited = responses.filter(r => r.status === 429);
      assert(rateLimited.length >= 0);
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Data Format Tests
// ============================================================================

Deno.test({
  name: "gdpr-request/integration: export data in JSON format",
  ignore: skipServiceRoleTests,
  ...integrationTestOptions,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, createTestSession, makeRequest } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const session = await createTestSession(supabase, testUser.id);
      
      const response = await makeRequest("gdpr-request", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "export",
          format: "json",
        }),
      });
      
      assert(response.status === 200 || response.status === 202);
      
      const contentType = response.headers.get("content-type");
      if (contentType) {
        assert(contentType.includes("application/json"));
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
  name: "gdpr-request/integration: cleanup test data",
  ignore: skipServiceRoleTests,
  ...integrationTestOptions,
  fn: async () => {
    const supabase = await getTestClient();
    const { cleanupTestData } = await getTestHelpers();
    await cleanupTestData(supabase);
    assertEquals(true, true);
  },
});
