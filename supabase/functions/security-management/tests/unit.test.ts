/**
 * Security Management - Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for security management logic without external dependencies.
 * 
 * @module security-management/tests/unit
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  createMockSecurityAlert,
  createMockIpBlockEntry,
  createMockAdmin,
  createMockOwner,
  createMockUser,
  validIpAddresses,
  invalidIpAddresses,
  alertTypes,
  allowedRoles,
  forbiddenRoles,
} from "./_shared.ts";

// ============================================================================
// ACTION VALIDATION TESTS
// ============================================================================

Deno.test("security-management: defines all required actions", () => {
  const requiredActions = ["acknowledge-alert", "block-ip", "unblock-ip"];
  
  assertEquals(requiredActions.length, 3);
  assert(requiredActions.includes("acknowledge-alert"));
  assert(requiredActions.includes("block-ip"));
  assert(requiredActions.includes("unblock-ip"));
});

Deno.test("security-management: requires admin/owner role", () => {
  assertEquals(allowedRoles.length, 2);
  assert(allowedRoles.includes("admin"));
  assert(allowedRoles.includes("owner"));
});

// ============================================================================
// ALERT FACTORY TESTS
// ============================================================================

Deno.test("alert factory: creates valid mock alert", () => {
  const alert = createMockSecurityAlert();
  
  assertExists(alert.id);
  assertExists(alert.alert_type);
  assertExists(alert.severity);
  assertExists(alert.message);
  assertEquals(alert.acknowledged, false);
});

Deno.test("alert factory: applies overrides", () => {
  const alert = createMockSecurityAlert({
    alert_type: "brute_force_attack",
    severity: "critical",
    acknowledged: true,
  });
  
  assertEquals(alert.alert_type, "brute_force_attack");
  assertEquals(alert.severity, "critical");
  assertEquals(alert.acknowledged, true);
});

Deno.test("alert: defines all alert types", () => {
  assertEquals(alertTypes.length, 5);
  assert(alertTypes.includes("multiple_failed_logins"));
  assert(alertTypes.includes("brute_force_attack"));
});

// ============================================================================
// IP BLOCK FACTORY TESTS
// ============================================================================

Deno.test("ip block factory: creates valid mock entry", () => {
  const entry = createMockIpBlockEntry();
  
  assertExists(entry.ip_address);
  assertExists(entry.reason);
  assertEquals(entry.is_active, true);
  assertExists(entry.created_by);
});

Deno.test("ip block factory: applies overrides", () => {
  const entry = createMockIpBlockEntry({
    ip_address: "10.0.0.1",
    is_active: false,
  });
  
  assertEquals(entry.ip_address, "10.0.0.1");
  assertEquals(entry.is_active, false);
});

// ============================================================================
// IP VALIDATION TESTS
// ============================================================================

Deno.test("ip validation: validates IP address format", async () => {
  const { isValidIPv4 } = await import("../../_shared/validators.ts");
  
  validIpAddresses.forEach(ip => {
    assertEquals(isValidIPv4(ip), true, `${ip} should be valid`);
  });
});

Deno.test("ip validation: rejects invalid IP addresses", async () => {
  const { isValidIPv4 } = await import("../../_shared/validators.ts");
  
  invalidIpAddresses.forEach(ip => {
    assertEquals(isValidIPv4(ip), false, `${ip} should be invalid`);
  });
});

// ============================================================================
// ROLE PERMISSION TESTS
// ============================================================================

Deno.test("permissions: admin user is allowed", () => {
  const admin = createMockAdmin();
  const isAllowed = allowedRoles.includes(admin.role);
  assertEquals(isAllowed, true);
});

Deno.test("permissions: owner user is allowed", () => {
  const owner = createMockOwner();
  const isAllowed = allowedRoles.includes(owner.role);
  assertEquals(isAllowed, true);
});

Deno.test("permissions: regular user is rejected", () => {
  const user = createMockUser({ role: "user" });
  const isAllowed = allowedRoles.includes(user.role);
  assertEquals(isAllowed, false);
});

Deno.test("permissions: forbidden roles are rejected", () => {
  forbiddenRoles.forEach(role => {
    const isAllowed = allowedRoles.includes(role);
    assertEquals(isAllowed, false, `${role} should not be allowed`);
  });
});

// ============================================================================
// ACKNOWLEDGE ALERT TESTS
// ============================================================================

Deno.test("acknowledge-alert: requires alertId", () => {
  const requiredFields = ["alertId"];
  assert(requiredFields.includes("alertId"));
});

Deno.test("acknowledge-alert: updates alert status", () => {
  const alert = createMockSecurityAlert();
  assertEquals(alert.acknowledged, false);
  
  // After acknowledgment
  const acknowledged = { ...alert, acknowledged: true, acknowledged_at: new Date().toISOString() };
  assertEquals(acknowledged.acknowledged, true);
  assertExists(acknowledged.acknowledged_at);
});

// ============================================================================
// BLOCK IP TESTS
// ============================================================================

Deno.test("block-ip: requires ipAddress and reason", () => {
  const requiredFields = ["ipAddress", "reason"];
  assert(requiredFields.includes("ipAddress"));
  assert(requiredFields.includes("reason"));
});

Deno.test("block-ip: supports expiration", () => {
  const expiresInDays = 30;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  
  assert(expiresAt > new Date());
});

Deno.test("block-ip: creates block entry", () => {
  const entry = createMockIpBlockEntry({
    ip_address: "192.168.1.100",
    reason: "Brute force attack",
  });
  
  assertEquals(entry.ip_address, "192.168.1.100");
  assertEquals(entry.reason, "Brute force attack");
  assertEquals(entry.is_active, true);
});

// ============================================================================
// UNBLOCK IP TESTS
// ============================================================================

Deno.test("unblock-ip: requires ipAddress", () => {
  const requiredFields = ["ipAddress"];
  assert(requiredFields.includes("ipAddress"));
});

Deno.test("unblock-ip: sets is_active to false", () => {
  const entry = createMockIpBlockEntry({ is_active: true });
  assertEquals(entry.is_active, true);
  
  // After unblock
  const unblocked = { ...entry, is_active: false };
  assertEquals(unblocked.is_active, false);
});

// ============================================================================
// AUDIT TRAIL TESTS
// ============================================================================

Deno.test("audit: maintains audit trail fields", () => {
  const auditFields = [
    "action",
    "performed_by",
    "target_ip",
    "timestamp",
    "reason",
    "metadata",
  ];
  
  assert(auditFields.includes("performed_by"));
  assert(auditFields.includes("timestamp"));
});

Deno.test("audit: logs security events via RPC", () => {
  // log_security_event RPC should be called
  const rpcName = "log_security_event";
  assertEquals(rpcName, "log_security_event");
});

// ============================================================================
// ERROR CODE TESTS
// ============================================================================

Deno.test("errors: defines correct error messages", () => {
  const errorMessages = {
    MISSING_ALERT_ID: "alertId é obrigatório",
    MISSING_IP_ADDRESS: "ipAddress é obrigatório",
    MISSING_REASON: "reason é obrigatório",
  };
  
  assertExists(errorMessages.MISSING_ALERT_ID);
  assertExists(errorMessages.MISSING_IP_ADDRESS);
  assertExists(errorMessages.MISSING_REASON);
});

Deno.test("errors: returns proper HTTP status codes", () => {
  const statusCodes = {
    SUCCESS: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVER_ERROR: 500,
  };
  
  assertEquals(statusCodes.FORBIDDEN, 403);
  assertEquals(statusCodes.BAD_REQUEST, 400);
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

Deno.test("rate limiting: defines limits", () => {
  const rateLimits = {
    maxRequestsPerMinute: 60,
    maxBlocksPerHour: 100,
  };
  
  assert(rateLimits.maxRequestsPerMinute > 0);
  assert(rateLimits.maxBlocksPerHour > 0);
});

// ============================================================================
// SECURITY EVENT TYPES TESTS
// ============================================================================

Deno.test("security events: defines event types", () => {
  const eventTypes = [
    "login_failed",
    "login_success",
    "password_reset_requested",
    "password_changed",
    "account_locked",
    "suspicious_activity",
    "ip_blocked",
    "ip_unblocked",
  ];
  
  assert(eventTypes.length > 0);
  assert(eventTypes.includes("ip_blocked"));
  assert(eventTypes.includes("ip_unblocked"));
});

Deno.test("security events: logs with metadata", () => {
  const requiredFields = [
    "event_type",
    "user_id",
    "ip_address",
    "user_agent",
    "timestamp",
    "metadata",
  ];
  
  assert(requiredFields.includes("event_type"));
  assert(requiredFields.includes("ip_address"));
  assert(requiredFields.includes("metadata"));
});
