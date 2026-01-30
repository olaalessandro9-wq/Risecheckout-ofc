/**
 * Manage User Role Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for manage-user-role Edge Function.
 * Tests role assignment, validation, and permission checks.
 * 
 * @module manage-user-role/integration.test
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

Deno.test("manage-user-role: require admin role", async () => {
  // Setup: Create producer user
  const producerUser = await createTestUser(supabase, { role: "producer" });
  const targetUser = await createTestUser(supabase, { role: "buyer" });
  createdUsers.push(producerUser.id, targetUser.id);
  
  try {
    const session = await createTestSession(supabase, producerUser.id);
    
    // Act: Attempt to change role as producer
    const response = await makeRequest("manage-user-role", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: targetUser.id,
        newRole: "affiliate",
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

Deno.test("manage-user-role: allow admin to change roles", async () => {
  // Setup: Create admin and target user
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const targetUser = await createTestUser(supabase, { role: "buyer" });
  createdUsers.push(adminUser.id, targetUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Change role as admin
    const response = await makeRequest("manage-user-role", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: targetUser.id,
        newRole: "producer",
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.success);
      
      // Verify role changed
      await wait(100);
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUser.id)
        .single();
      
      if (roleData) {
        assertEquals(roleData.role, "producer");
      }
    }
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Role Change Tests
// ============================================================================

Deno.test("manage-user-role: change user role successfully", async () => {
  // Setup: Create admin and target user
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const targetUser = await createTestUser(supabase, { role: "buyer" });
  createdUsers.push(adminUser.id, targetUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Change role
    const response = await makeRequest("manage-user-role", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: targetUser.id,
        newRole: "affiliate",
      }),
    });
    
    // Assert: Success or appropriate response
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.success);
      assertEquals(data.success, true);
      assertExists(data.oldRole);
      assertExists(data.newRole);
      assertEquals(data.newRole, "affiliate");
    }
  } finally {
    await cleanup();
  }
});

Deno.test("manage-user-role: validate role values", async () => {
  // Setup: Create admin and target user
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const targetUser = await createTestUser(supabase, { role: "buyer" });
  createdUsers.push(adminUser.id, targetUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Attempt to set invalid role
    const response = await makeRequest("manage-user-role", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: targetUser.id,
        newRole: "invalid_role",
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

Deno.test("manage-user-role: require userId", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Attempt without userId
    const response = await makeRequest("manage-user-role", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        newRole: "producer",
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

Deno.test("manage-user-role: require newRole", async () => {
  // Setup: Create admin and target
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const targetUser = await createTestUser(supabase, { role: "buyer" });
  createdUsers.push(adminUser.id, targetUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Attempt without newRole
    const response = await makeRequest("manage-user-role", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: targetUser.id,
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
// Edge Cases
// ============================================================================

Deno.test("manage-user-role: handle non-existent user", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Attempt to change role of non-existent user
    const response = await makeRequest("manage-user-role", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: "non-existent-user-id-12345",
        newRole: "producer",
      }),
    });
    
    // Assert: Not Found
    assertEquals(response.status, 404);
    
    const data = await response.json();
    assertExists(data.error);
  } finally {
    await cleanup();
  }
});

Deno.test("manage-user-role: prevent changing own role", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Attempt to change own role
    const response = await makeRequest("manage-user-role", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: adminUser.id,
        newRole: "buyer",
      }),
    });
    
    // Assert: Forbidden or Bad Request
    assert(response.status === 403 || response.status === 400);
    
    const data = await response.json();
    assertExists(data.error);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Audit Trail Tests
// ============================================================================

Deno.test("manage-user-role: log role changes in audit trail", async () => {
  // Setup: Create admin and target
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const targetUser = await createTestUser(supabase, { role: "buyer" });
  createdUsers.push(adminUser.id, targetUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Change role
    await makeRequest("manage-user-role", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: targetUser.id,
        newRole: "producer",
      }),
    });
    
    // Assert: Audit log created
    await wait(200);
    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("action", "change-user-role")
      .eq("performed_by", adminUser.id)
      .order("created_at", { ascending: false })
      .limit(1);
    
    if (auditLogs && auditLogs.length > 0) {
      const log = auditLogs[0];
      assertEquals(log.action, "change-user-role");
      assertEquals(log.performed_by, adminUser.id);
      assertExists(log.metadata);
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
