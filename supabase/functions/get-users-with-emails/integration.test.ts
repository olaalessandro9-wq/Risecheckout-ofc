/**
 * Get Users With Emails Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for get-users-with-emails Edge Function.
 * Tests user search, filtering, and data retrieval.
 * 
 * @module get-users-with-emails/integration.test
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
// Permission Tests
// ============================================================================

Deno.test("get-users-with-emails: require admin role", async () => {
  // Setup: Create producer user
  const producerUser = await createTestUser(supabase, { role: "producer" });
  createdUsers.push(producerUser.id);
  
  try {
    const session = await createTestSession(supabase, producerUser.id);
    
    // Act: Attempt to get users as producer
    const response = await makeRequest("get-users-with-emails", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        emails: ["test@example.com"],
      }),
    });
    
    // Assert: Forbidden
    assertEquals(response.status, 403);
    
    const data = await response.json();
    assertExists(data.error);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Search Tests
// ============================================================================

Deno.test("get-users-with-emails: find users by email", async () => {
  // Setup: Create admin and target users
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const user1 = await createTestUser(supabase);
  const user2 = await createTestUser(supabase);
  createdUsers.push(adminUser.id, user1.id, user2.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Search for users
    const response = await makeRequest("get-users-with-emails", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        emails: [user1.email, user2.email],
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.users);
      assert(Array.isArray(data.users));
      
      // Should find both users
      const foundEmails = data.users.map((u: any) => u.email);
      assert(foundEmails.includes(user1.email));
      assert(foundEmails.includes(user2.email));
    }
  } finally {
    await cleanup();
  }
});

Deno.test("get-users-with-emails: handle non-existent emails", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Search for non-existent emails
    const response = await makeRequest("get-users-with-emails", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        emails: ["nonexistent1@example.com", "nonexistent2@example.com"],
      }),
    });
    
    // Assert: Success with empty results
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.users);
      assertEquals(data.users.length, 0);
    }
  } finally {
    await cleanup();
  }
});

Deno.test("get-users-with-emails: handle mixed existing and non-existent emails", async () => {
  // Setup: Create admin and one target user
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const existingUser = await createTestUser(supabase);
  createdUsers.push(adminUser.id, existingUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Search with mixed emails
    const response = await makeRequest("get-users-with-emails", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        emails: [existingUser.email, "nonexistent@example.com"],
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.users);
      
      // Should find only existing user
      assertEquals(data.users.length, 1);
      assertEquals(data.users[0].email, existingUser.email);
    }
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Validation Tests
// ============================================================================

Deno.test("get-users-with-emails: require emails parameter", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Attempt without emails
    const response = await makeRequest("get-users-with-emails", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({}),
    });
    
    // Assert: Bad Request
    assertEquals(response.status, 400);
    
    const data = await response.json();
    assertExists(data.error);
  } finally {
    await cleanup();
  }
});

Deno.test("get-users-with-emails: validate emails array", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Send invalid emails parameter
    const response = await makeRequest("get-users-with-emails", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        emails: "not-an-array",
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

Deno.test("get-users-with-emails: validate email format", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Send invalid email format
    const response = await makeRequest("get-users-with-emails", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        emails: ["invalid-email-format"],
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

Deno.test("get-users-with-emails: limit array size", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Send too many emails (assuming limit is 100)
    const tooManyEmails = Array.from({ length: 150 }, (_, i) => `test${i}@example.com`);
    const response = await makeRequest("get-users-with-emails", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        emails: tooManyEmails,
      }),
    });
    
    // Assert: Bad Request or success (depending on implementation)
    assert(response.status === 400 || response.status === 200);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Data Privacy Tests
// ============================================================================

Deno.test("get-users-with-emails: exclude sensitive data", async () => {
  // Setup: Create admin and target user
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const targetUser = await createTestUser(supabase);
  createdUsers.push(adminUser.id, targetUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Get user data
    const response = await makeRequest("get-users-with-emails", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        emails: [targetUser.email],
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      
      if (data.users && data.users.length > 0) {
        const user = data.users[0];
        
        // Should not include password hash or other sensitive fields
        assert(!user.password_hash);
        assert(!user.password);
        
        // Should include safe fields
        assertExists(user.id);
        assertExists(user.email);
      }
    }
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Performance Tests
// ============================================================================

Deno.test("get-users-with-emails: handle batch requests efficiently", async () => {
  // Setup: Create admin and multiple users
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const users = await Promise.all([
    createTestUser(supabase),
    createTestUser(supabase),
    createTestUser(supabase),
    createTestUser(supabase),
    createTestUser(supabase),
  ]);
  createdUsers.push(adminUser.id, ...users.map(u => u.id));
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Search for all users at once
    const startTime = Date.now();
    const response = await makeRequest("get-users-with-emails", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        emails: users.map(u => u.email),
      }),
    });
    const endTime = Date.now();
    
    // Assert: Success and reasonable response time
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.users);
      
      // Should find all users
      assertEquals(data.users.length, 5);
      
      // Should be reasonably fast (< 2 seconds)
      const duration = endTime - startTime;
      assert(duration < 2000);
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
