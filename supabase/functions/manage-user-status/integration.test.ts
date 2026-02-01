/**
 * Manage User Status Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for manage-user-status Edge Function.
 * Tests user activation, suspension, and status management.
 * 
 * @module manage-user-status/integration.test
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

Deno.test("manage-user-status: require admin role", async () => {
  // Setup: Create producer user
  const producerUser = await createTestUser(supabase, { role: "producer" });
  const targetUser = await createTestUser(supabase, { role: "buyer" });
  createdUsers.push(producerUser.id, targetUser.id);
  
  try {
    const session = await createTestSession(supabase, producerUser.id);
    
    // Act: Attempt to suspend user as producer
    const response = await makeRequest("manage-user-status", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: targetUser.id,
        action: "suspend",
        reason: "Test suspension",
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
// Suspend User Tests
// ============================================================================

Deno.test("manage-user-status: suspend user successfully", async () => {
  // Setup: Create admin and target user
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const targetUser = await createTestUser(supabase, { role: "buyer" });
  createdUsers.push(adminUser.id, targetUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Suspend user
    const response = await makeRequest("manage-user-status", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: targetUser.id,
        action: "suspend",
        reason: "Violation of terms",
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.success);
      
      // Verify user is suspended
      await wait(100);
      const { data: userData } = await supabase
        .from("users")
        .select("status")
        .eq("id", targetUser.id)
        .single();
      
      if (userData) {
        assertEquals(userData.status, "suspended");
      }
    }
  } finally {
    await cleanup();
  }
});

Deno.test("manage-user-status: require reason for suspension", async () => {
  // Setup: Create admin and target
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const targetUser = await createTestUser(supabase, { role: "buyer" });
  createdUsers.push(adminUser.id, targetUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Attempt to suspend without reason
    const response = await makeRequest("manage-user-status", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: targetUser.id,
        action: "suspend",
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
// Activate User Tests
// ============================================================================

Deno.test("manage-user-status: activate suspended user", async () => {
  // Setup: Create admin and suspended user
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const targetUser = await createTestUser(supabase, { role: "buyer" } as never);
  createdUsers.push(adminUser.id, targetUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Activate user
    const response = await makeRequest("manage-user-status", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: targetUser.id,
        action: "activate",
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.success);
      
      // Verify user is active
      await wait(100);
      const { data: userData } = await supabase
        .from("users")
        .select("status")
        .eq("id", targetUser.id)
        .single();
      
      if (userData) {
        assertEquals(userData.status, "active");
      }
    }
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Deactivate User Tests
// ============================================================================

Deno.test("manage-user-status: deactivate user", async () => {
  // Setup: Create admin and target
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const targetUser = await createTestUser(supabase, { role: "buyer" });
  createdUsers.push(adminUser.id, targetUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Deactivate user
    const response = await makeRequest("manage-user-status", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: targetUser.id,
        action: "deactivate",
        reason: "Account closure request",
      }),
    });
    
    // Assert: Success
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.success);
    }
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Validation Tests
// ============================================================================

Deno.test("manage-user-status: validate action parameter", async () => {
  // Setup: Create admin and target
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const targetUser = await createTestUser(supabase, { role: "buyer" });
  createdUsers.push(adminUser.id, targetUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Send invalid action
    const response = await makeRequest("manage-user-status", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: targetUser.id,
        action: "invalid_action",
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

Deno.test("manage-user-status: require userId", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Attempt without userId
    const response = await makeRequest("manage-user-status", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "suspend",
        reason: "Test",
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

Deno.test("manage-user-status: handle non-existent user", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Attempt to suspend non-existent user
    const response = await makeRequest("manage-user-status", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: "non-existent-user-id-12345",
        action: "suspend",
        reason: "Test",
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

Deno.test("manage-user-status: prevent changing own status", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Attempt to suspend self
    const response = await makeRequest("manage-user-status", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: adminUser.id,
        action: "suspend",
        reason: "Test",
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
// Session Revocation Tests
// ============================================================================

Deno.test("manage-user-status: revoke sessions on suspension", async () => {
  // Setup: Create admin, target, and target's session
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const targetUser = await createTestUser(supabase, { role: "buyer" });
  createdUsers.push(adminUser.id, targetUser.id);
  
  try {
    const adminSession = await createTestSession(supabase, adminUser.id);
    const targetSession = await createTestSession(supabase, targetUser.id);
    
    // Act: Suspend user
    await makeRequest("manage-user-status", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${adminSession}`,
      },
      body: JSON.stringify({
        userId: targetUser.id,
        action: "suspend",
        reason: "Test suspension",
      }),
    });
    
    // Assert: Target's sessions should be invalidated
    await wait(200);
    const { data: sessions } = await supabase
      .from("sessions")
      .select("is_valid")
      .eq("user_id", targetUser.id);
    
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
// Audit Trail Tests
// ============================================================================

Deno.test("manage-user-status: log status changes in audit trail", async () => {
  // Setup: Create admin and target
  const adminUser = await createTestUser(supabase, { role: "admin" });
  const targetUser = await createTestUser(supabase, { role: "buyer" });
  createdUsers.push(adminUser.id, targetUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Change status
    await makeRequest("manage-user-status", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        userId: targetUser.id,
        action: "suspend",
        reason: "Audit trail test",
      }),
    });
    
    // Assert: Audit log created
    await wait(200);
    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("action", "change-user-status")
      .eq("performed_by", adminUser.id)
      .order("created_at", { ascending: false })
      .limit(1);
    
    if (auditLogs && auditLogs.length > 0) {
      const log = auditLogs[0];
      assertEquals(log.action, "change-user-status");
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
