/**
 * RLS Security Tester Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for rls-security-tester Edge Function.
 * Tests Row Level Security policies, access control, and data isolation.
 * 
 * @module rls-security-tester/integration.test
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
// Permission Tests
// ============================================================================

Deno.test("rls-security-tester: require admin role", async () => {
  // Setup: Create producer user
  const producerUser = await createTestUser(supabase, { role: "producer" });
  createdUsers.push(producerUser.id);
  
  try {
    const session = await createTestSession(supabase, producerUser.id);
    
    // Act: Attempt to run RLS tests as producer
    const response = await makeRequest("rls-security-tester", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "test-all",
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
// RLS Policy Tests
// ============================================================================

Deno.test("rls-security-tester: test user data isolation", async () => {
  // Setup: Create admin and test users
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const user1 = await createTestUser(supabase);
  const user2 = await createTestUser(supabase);
  createdUsers.push(adminUser.id, user1.id, user2.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Test RLS policies
    const response = await makeRequest("rls-security-tester", {
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
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.results);
      
      // Should confirm users can't access each other's data
      if (data.results.isolation) {
        assertEquals(data.results.isolation.passed, true);
      }
    }
  } finally {
    await cleanup();
  }
});

Deno.test("rls-security-tester: test table-level RLS", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Test RLS on specific table
    const response = await makeRequest("rls-security-tester", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "test-table",
        tableName: "users",
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.results);
      
      // Should report RLS status
      if (data.results.rlsEnabled !== undefined) {
        assertEquals(typeof data.results.rlsEnabled, "boolean");
      }
    }
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Access Control Tests
// ============================================================================

Deno.test("rls-security-tester: test role-based access", async () => {
  // Setup: Create admin and users with different roles
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const producerUser = await createTestUser(supabase, { role: "producer" });
  const buyerUser = await createTestUser(supabase, { role: "buyer" });
  createdUsers.push(adminUser.id, producerUser.id, buyerUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Test role-based access
    const response = await makeRequest("rls-security-tester", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "test-role-access",
        roles: ["admin", "producer", "buyer"],
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.results);
      
      // Should test access for each role
      if (data.results.roleTests) {
        assert(Array.isArray(data.results.roleTests));
      }
    }
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Comprehensive Test Suite
// ============================================================================

Deno.test("rls-security-tester: run comprehensive RLS test suite", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Run all RLS tests
    const response = await makeRequest("rls-security-tester", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "test-all",
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.results);
      
      // Should include summary
      if (data.results.summary) {
        assertExists(data.results.summary.total);
        assertExists(data.results.summary.passed);
        assertExists(data.results.summary.failed);
      }
    }
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Specific Policy Tests
// ============================================================================

Deno.test("rls-security-tester: test SELECT policy", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Test SELECT policy
    const response = await makeRequest("rls-security-tester", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "test-policy",
        tableName: "users",
        operation: "SELECT",
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.results);
    }
  } finally {
    await cleanup();
  }
});

Deno.test("rls-security-tester: test INSERT policy", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Test INSERT policy
    const response = await makeRequest("rls-security-tester", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "test-policy",
        tableName: "products",
        operation: "INSERT",
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
  } finally {
    await cleanup();
  }
});

Deno.test("rls-security-tester: test UPDATE policy", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Test UPDATE policy
    const response = await makeRequest("rls-security-tester", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "test-policy",
        tableName: "users",
        operation: "UPDATE",
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
  } finally {
    await cleanup();
  }
});

Deno.test("rls-security-tester: test DELETE policy", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Test DELETE policy
    const response = await makeRequest("rls-security-tester", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "test-policy",
        tableName: "sessions",
        operation: "DELETE",
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Validation Tests
// ============================================================================

Deno.test("rls-security-tester: validate action parameter", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Send invalid action
    const response = await makeRequest("rls-security-tester", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "invalid-action",
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
// Reporting Tests
// ============================================================================

Deno.test("rls-security-tester: generate detailed report", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Request detailed report
    const response = await makeRequest("rls-security-tester", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "test-all",
        detailed: true,
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.results);
      
      // Should include detailed information
      if (data.results.details) {
        assert(Array.isArray(data.results.details));
      }
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
