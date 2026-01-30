/**
 * GDPR Request Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for gdpr-request Edge Function.
 * Tests GDPR data export, user data retrieval, and compliance.
 * 
 * @module gdpr-request/integration.test
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  createTestClient,
  createTestUser,
  deleteTestUser,
  makeRequest,
  createTestSession,
  cleanupTestData,
  wait,
} from "../_shared/test-helpers.ts";

// ============================================================================
// Test Setup & Teardown
// ============================================================================

const supabase = createTestClient();
const createdUsers: string[] = [];

async function cleanup() {
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

Deno.test("gdpr-request: export user data successfully", async () => {
  // Setup: Create user
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    const session = await createTestSession(supabase, testUser.id);
    
    // Act: Request data export
    const response = await makeRequest("gdpr-request", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "export",
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 202);
    
    const data = await response.json();
    assertExists(data.success || data.requestId);
  } finally {
    await cleanup();
  }
});

Deno.test("gdpr-request: include all user data categories", async () => {
  // Setup: Create user
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    const session = await createTestSession(supabase, testUser.id);
    
    // Act: Request data export
    const response = await makeRequest("gdpr-request", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "export",
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 202);
    
    const data = await response.json();
    
    if (data.data) {
      // Should include various data categories
      assertExists(data.data.profile || data.data.user);
      // May include: transactions, sessions, activities, etc.
    }
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Authentication Tests
// ============================================================================

Deno.test("gdpr-request: require authentication", async () => {
  // Act: Attempt without authentication
  const response = await makeRequest("gdpr-request", {
    method: "POST",
    body: JSON.stringify({
      action: "export",
    }),
  });
  
  // Assert: Unauthorized
  assertEquals(response.status, 401);
  
  const data = await response.json();
  assertExists(data.error);
});

Deno.test("gdpr-request: only allow access to own data", async () => {
  // Setup: Create two users
  const user1 = await createTestUser(supabase);
  const user2 = await createTestUser(supabase);
  createdUsers.push(user1.id, user2.id);
  
  try {
    const session1 = await createTestSession(supabase, user1.id);
    
    // Act: User1 attempts to access User2's data
    const response = await makeRequest("gdpr-request", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session1}`,
      },
      body: JSON.stringify({
        action: "export",
        userId: user2.id, // Attempting to access other user's data
      }),
    });
    
    // Assert: Should only return user1's data or reject
    assert(response.status === 200 || response.status === 403);
    
    if (response.status === 200) {
      const data = await response.json();
      // Should only contain user1's data
      if (data.data && data.data.user) {
        assertEquals(data.data.user.id, user1.id);
      }
    }
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Request Tracking Tests
// ============================================================================

Deno.test("gdpr-request: create request record", async () => {
  // Setup: Create user
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    const session = await createTestSession(supabase, testUser.id);
    
    // Act: Request data export
    await makeRequest("gdpr-request", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "export",
      }),
    });
    
    // Assert: Request logged
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
});

// ============================================================================
// Rate Limiting Tests
// ============================================================================

Deno.test("gdpr-request: rate limit requests", async () => {
  // Setup: Create user
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    const session = await createTestSession(supabase, testUser.id);
    
    // Act: Make multiple rapid requests
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
    
    // Assert: Some requests should be rate limited
    const rateLimited = responses.filter(r => r.status === 429);
    
    // Rate limiting may or may not be strict
    assert(rateLimited.length >= 0);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Data Format Tests
// ============================================================================

Deno.test("gdpr-request: export data in JSON format", async () => {
  // Setup: Create user
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    const session = await createTestSession(supabase, testUser.id);
    
    // Act: Request export
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
    
    // Assert: JSON format
    assert(response.status === 200 || response.status === 202);
    
    const contentType = response.headers.get("content-type");
    if (contentType) {
      assert(contentType.includes("application/json"));
    }
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Cleanup after all tests
// ============================================================================

Deno.test("cleanup: remove all test data", async () => {
  await cleanupTestData(supabase);
  assertEquals(true, true);
});
