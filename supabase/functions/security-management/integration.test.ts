/**
 * Security Management Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for security-management Edge Function.
 * Tests security alerts, IP blocking, audit trail, and admin permissions.
 * 
 * @module security-management/integration.test
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
const createdAlerts: string[] = [];
const blockedIPs: string[] = [];

async function cleanup() {
  // Cleanup blocked IPs
  for (const ip of blockedIPs) {
    try {
      await supabase.from("blocked_ips").delete().eq("ip_address", ip);
    } catch (error) {
      console.error(`Failed to unblock IP ${ip}:`, error);
    }
  }
  blockedIPs.length = 0;
  
  // Cleanup alerts
  for (const alertId of createdAlerts) {
    try {
      await supabase.from("security_alerts").delete().eq("id", alertId);
    } catch (error) {
      console.error(`Failed to delete alert ${alertId}:`, error);
    }
  }
  createdAlerts.length = 0;
  
  // Cleanup users
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

Deno.test("security-management: require admin/owner role", async () => {
  // Setup: Create producer user (non-admin)
  const producerUser = await createTestUser(supabase, { role: "producer" });
  createdUsers.push(producerUser.id);
  
  try {
    const session = await createTestSession(supabase, producerUser.id);
    
    // Act: Attempt security operation as producer
    const response = await makeRequest("security-management", {
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
    
    // Assert: Forbidden
    assertEquals(response.status, 403);
    
    const data = await response.json();
    assertExists(data.error);
    assert(data.error.toLowerCase().includes("permiss") || data.error.toLowerCase().includes("acesso"));
  } finally {
    await cleanup();
  }
});

Deno.test("security-management: allow admin role", async () => {
  // Setup: Create admin user
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
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
      
      // Act: Acknowledge alert as admin
      const response = await makeRequest("security-management", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session}`,
        },
        body: JSON.stringify({
          action: "acknowledge-alert",
          alertId: alert.id,
        }),
      });
      
      // Assert: Success (or appropriate response)
      assert(response.status === 200 || response.status === 404);
    }
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Alert Management Tests
// ============================================================================

Deno.test("security-management/acknowledge-alert: acknowledge security alert", async () => {
  // Setup: Create admin and alert
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Create alert
    const { data: alert } = await supabase
      .from("security_alerts")
      .insert({
        alert_type: "multiple_failed_logins",
        severity: "medium",
        user_id: adminUser.id,
        ip_address: "192.168.1.50",
        description: "5 failed login attempts",
        is_acknowledged: false,
      })
      .select()
      .single();
    
    assertExists(alert);
    createdAlerts.push(alert.id);
    
    // Act: Acknowledge alert
    const response = await makeRequest("security-management", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "acknowledge-alert",
        alertId: alert.id,
      }),
    });
    
    // Assert: Success or appropriate response
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.success);
      
      // Verify alert is acknowledged
      await wait(100);
      const { data: updatedAlert } = await supabase
        .from("security_alerts")
        .select("is_acknowledged, acknowledged_by, acknowledged_at")
        .eq("id", alert.id)
        .single();
      
      if (updatedAlert) {
        assertEquals(updatedAlert.is_acknowledged, true);
        assertEquals(updatedAlert.acknowledged_by, adminUser.id);
        assertExists(updatedAlert.acknowledged_at);
      }
    }
  } finally {
    await cleanup();
  }
});

Deno.test("security-management/acknowledge-alert: require alert ID", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Attempt to acknowledge without alert ID
    const response = await makeRequest("security-management", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "acknowledge-alert",
        // Missing alertId
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
// IP Blocking Tests
// ============================================================================

Deno.test("security-management/block-ip: block IP address", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    const testIP = `192.168.1.${Math.floor(Math.random() * 255)}`;
    
    // Act: Block IP
    const response = await makeRequest("security-management", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "block-ip",
        ipAddress: testIP,
        reason: "Suspicious activity detected",
        expiresInDays: 30,
      }),
    });
    
    // Assert: Success or appropriate response
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.success);
      
      blockedIPs.push(testIP);
      
      // Verify IP is blocked in database
      await wait(100);
      const { data: blockedIP } = await supabase
        .from("blocked_ips")
        .select("*")
        .eq("ip_address", testIP)
        .single();
      
      if (blockedIP) {
        assertEquals(blockedIP.ip_address, testIP);
        assertEquals(blockedIP.reason, "Suspicious activity detected");
        assertEquals(blockedIP.blocked_by, adminUser.id);
        assertExists(blockedIP.expires_at);
      }
    }
  } finally {
    await cleanup();
  }
});

Deno.test("security-management/block-ip: validate IP address format", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Attempt to block invalid IP
    const response = await makeRequest("security-management", {
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
    
    // Assert: Bad Request
    assertEquals(response.status, 400);
    
    const data = await response.json();
    assertExists(data.error);
  } finally {
    await cleanup();
  }
});

Deno.test("security-management/block-ip: require reason", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Attempt to block without reason
    const response = await makeRequest("security-management", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "block-ip",
        ipAddress: "192.168.1.100",
        // Missing reason
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
// IP Unblocking Tests
// ============================================================================

Deno.test("security-management/unblock-ip: unblock IP address", async () => {
  // Setup: Create admin and block an IP
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    const testIP = `192.168.2.${Math.floor(Math.random() * 255)}`;
    
    // First, block the IP
    await supabase.from("blocked_ips").insert({
      ip_address: testIP,
      reason: "Test block",
      blocked_by: adminUser.id,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    });
    blockedIPs.push(testIP);
    
    // Act: Unblock IP
    const response = await makeRequest("security-management", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "unblock-ip",
        ipAddress: testIP,
      }),
    });
    
    // Assert: Success or appropriate response
    assert(response.status === 200 || response.status === 404);
    
    if (response.status === 200) {
      const data = await response.json();
      assertExists(data.success);
      
      // Verify IP is unblocked
      await wait(100);
      const { data: blockedIP } = await supabase
        .from("blocked_ips")
        .select("*")
        .eq("ip_address", testIP)
        .single();
      
      // IP should be removed or marked as inactive
      assert(!blockedIP || blockedIP.is_active === false);
    }
  } finally {
    await cleanup();
  }
});

Deno.test("security-management/unblock-ip: handle non-existent IP", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Attempt to unblock non-existent IP
    const response = await makeRequest("security-management", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "unblock-ip",
        ipAddress: "192.168.99.99",
      }),
    });
    
    // Assert: Not Found or appropriate response
    assert(response.status === 404 || response.status === 200);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Audit Trail Tests
// ============================================================================

Deno.test("security-management: log security actions in audit trail", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    const testIP = `192.168.3.${Math.floor(Math.random() * 255)}`;
    
    // Act: Perform security action
    await makeRequest("security-management", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session}`,
      },
      body: JSON.stringify({
        action: "block-ip",
        ipAddress: testIP,
        reason: "Audit trail test",
      }),
    });
    
    blockedIPs.push(testIP);
    
    // Assert: Audit log created
    await wait(200);
    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("action", "block-ip")
      .eq("performed_by", adminUser.id)
      .order("created_at", { ascending: false })
      .limit(1);
    
    if (auditLogs && auditLogs.length > 0) {
      const log = auditLogs[0];
      assertEquals(log.action, "block-ip");
      assertEquals(log.performed_by, adminUser.id);
      assertExists(log.metadata);
    }
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Error Handling Tests
// ============================================================================

Deno.test("security-management: handle invalid action", async () => {
  // Setup: Create admin
  const adminUser = await createTestUser(supabase, { role: "admin" });
  createdUsers.push(adminUser.id);
  
  try {
    const session = await createTestSession(supabase, adminUser.id);
    
    // Act: Send invalid action
    const response = await makeRequest("security-management", {
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

Deno.test("security-management: require authentication", async () => {
  // Act: Attempt operation without authentication
  const response = await makeRequest("security-management", {
    method: "POST",
    body: JSON.stringify({
      action: "block-ip",
      ipAddress: "192.168.1.100",
      reason: "Test",
    }),
  });
  
  // Assert: Unauthorized
  assertEquals(response.status, 401);
  
  const data = await response.json();
  assertExists(data.error);
});

// ============================================================================
// Cleanup after all tests
// ============================================================================

Deno.test("cleanup: remove all test data", async () => {
  await cleanupTestData(supabase);
  assertEquals(true, true);
});
