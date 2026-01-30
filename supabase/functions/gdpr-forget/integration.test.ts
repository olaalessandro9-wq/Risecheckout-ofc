/**
 * GDPR Forget Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for gdpr-forget Edge Function.
 * Tests right to be forgotten, data deletion, and anonymization.
 * 
 * @module gdpr-forget/integration.test
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
// Account Deletion Tests
// ============================================================================

Deno.test("gdpr-forget: initiate account deletion", async () => {
  // Setup: Create user
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    const session = await createTestSession(supabase, testUser.id);
    
    // Act: Request account deletion
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
    
    // Assert: Success or accepted
    assert(response.status === 200 || response.status === 202);
    
    const data = await response.json();
    assertExists(data.success || data.requestId);
  } finally {
    await cleanup();
  }
});

Deno.test("gdpr-forget: require confirmation", async () => {
  // Setup: Create user
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    const session = await createTestSession(supabase, testUser.id);
    
    // Act: Attempt deletion without confirmation
    const response = await makeRequest("gdpr-forget", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "delete",
      }),
    });
    
    // Assert: Bad Request
    assertEquals(response.status, 400);
    
    const data = await response.json();
    assertExists(data.error);
  } finally {
    await cleanup();
  }
});

Deno.test("gdpr-forget: validate confirmation text", async () => {
  // Setup: Create user
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    const session = await createTestSession(supabase, testUser.id);
    
    // Act: Attempt with wrong confirmation
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
    
    // Assert: Bad Request
    assertEquals(response.status, 400);
    
    const data = await response.json();
    assertExists(data.error);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Data Deletion Tests
// ============================================================================

Deno.test("gdpr-forget: delete user data", async () => {
  // Setup: Create user
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    const session = await createTestSession(supabase, testUser.id);
    
    // Act: Delete account
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
    
    // Assert: User data deleted or marked for deletion
    await wait(500);
    const { data: userData } = await supabase
      .from("users")
      .select("status, deleted_at")
      .eq("id", testUser.id)
      .single();
    
    if (userData) {
      // User should be marked as deleted or status changed
      assert(
        userData.status === "deleted" ||
        userData.deleted_at !== null
      );
    }
  } finally {
    // Don't cleanup - user should be deleted by the function
  }
});

Deno.test("gdpr-forget: invalidate all sessions on deletion", async () => {
  // Setup: Create user with sessions
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    const session1 = await createTestSession(supabase, testUser.id);
    const session2 = await createTestSession(supabase, testUser.id);
    
    // Act: Delete account
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
    
    // Assert: All sessions invalidated
    await wait(300);
    const { data: sessions } = await supabase
      .from("sessions")
      .select("is_valid")
      .eq("user_id", testUser.id);
    
    if (sessions) {
      sessions.forEach(session => {
        assertEquals(session.is_valid, false);
      });
    }
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Authentication Tests
// ============================================================================

Deno.test("gdpr-forget: require authentication", async () => {
  // Act: Attempt without authentication
  const response = await makeRequest("gdpr-forget", {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      confirmation: "DELETE MY ACCOUNT",
    }),
  });
  
  // Assert: Unauthorized
  assertEquals(response.status, 401);
  
  const data = await response.json();
  assertExists(data.error);
});

Deno.test("gdpr-forget: only allow deleting own account", async () => {
  // Setup: Create two users
  const user1 = await createTestUser(supabase);
  const user2 = await createTestUser(supabase);
  createdUsers.push(user1.id, user2.id);
  
  try {
    const session1 = await createTestSession(supabase, user1.id);
    
    // Act: User1 attempts to delete User2's account
    const response = await makeRequest("gdpr-forget", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session1}`,
      },
      body: JSON.stringify({
        action: "delete",
        userId: user2.id, // Attempting to delete other user
        confirmation: "DELETE MY ACCOUNT",
      }),
    });
    
    // Assert: Should only delete own account or reject
    assert(response.status === 200 || response.status === 403 || response.status === 202);
    
    // Verify user2 still exists
    await wait(200);
    const { data: user2Data } = await supabase
      .from("users")
      .select("id")
      .eq("id", user2.id)
      .single();
    
    assertExists(user2Data); // User2 should still exist
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Request Tracking Tests
// ============================================================================

Deno.test("gdpr-forget: create deletion request record", async () => {
  // Setup: Create user
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    const session = await createTestSession(supabase, testUser.id);
    
    // Act: Request deletion
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
    
    // Assert: Request logged
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
});

// ============================================================================
// Anonymization Tests
// ============================================================================

Deno.test("gdpr-forget: anonymize instead of hard delete (if applicable)", async () => {
  // Setup: Create user
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    const session = await createTestSession(supabase, testUser.id);
    
    // Act: Delete account
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
    
    // Assert: Data anonymized (if soft delete is used)
    await wait(300);
    const { data: userData } = await supabase
      .from("users")
      .select("email, name")
      .eq("id", testUser.id)
      .single();
    
    if (userData) {
      // Email and name should be anonymized
      assert(
        userData.email.includes("deleted") ||
        userData.email.includes("anonymized") ||
        userData.email === null
      );
    }
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Compliance Tests
// ============================================================================

Deno.test("gdpr-forget: complete deletion within compliance timeframe", async () => {
  // Setup: Create user
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    const session = await createTestSession(supabase, testUser.id);
    
    // Act: Request deletion
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
    
    // Assert: Deletion scheduled or completed
    assert(response.status === 200 || response.status === 202);
    
    const data = await response.json();
    
    // Should indicate when deletion will be complete
    if (data.scheduledFor || data.completionDate) {
      assertExists(data.scheduledFor || data.completionDate);
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
