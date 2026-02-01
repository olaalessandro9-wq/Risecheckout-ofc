/**
 * Security Management Tests - Shared Utilities
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Type-safe mocks and utilities for security-management tests.
 * 
 * @module security-management/tests/_shared
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  createMockUser,
  createMockAdmin,
  createMockOwner,
  createMockRequest,
  createMockSupabaseClient,
  createEmptyDataStore,
  jsonResponse,
  defaultCorsHeaders,
} from "../../_shared/testing/mod.ts";
import type { MockUser, MockDataStore } from "../../_shared/testing/mod.ts";

// ============================================================================
// RE-EXPORTS
// ============================================================================

export {
  createMockUser,
  createMockAdmin,
  createMockOwner,
  createMockRequest,
  createMockSupabaseClient,
  createEmptyDataStore,
  jsonResponse,
  defaultCorsHeaders,
};

export type { MockUser, MockDataStore };

// ============================================================================
// SECURITY MANAGEMENT TYPES
// ============================================================================

export type SecurityAction = "acknowledge-alert" | "block-ip" | "unblock-ip";

export interface AcknowledgeAlertRequest {
  action: "acknowledge-alert";
  alertId: string;
}

export interface BlockIpRequest {
  action: "block-ip";
  ipAddress: string;
  reason: string;
  expiresInDays?: number;
}

export interface UnblockIpRequest {
  action: "unblock-ip";
  ipAddress: string;
}

export type SecurityRequest = 
  | AcknowledgeAlertRequest 
  | BlockIpRequest 
  | UnblockIpRequest;

export interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  metadata: Record<string, unknown>;
  acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  created_at: string;
}

export interface IpBlockEntry {
  ip_address: string;
  reason: string;
  is_active: boolean;
  expires_at?: string;
  created_by: string;
  created_at: string;
}

// ============================================================================
// SECURITY MANAGEMENT FACTORIES
// ============================================================================

/**
 * Creates a mock security alert
 */
export function createMockSecurityAlert(
  overrides: Partial<SecurityAlert> = {}
): SecurityAlert {
  return {
    id: `alert-${Date.now()}`,
    alert_type: "multiple_failed_logins",
    severity: "medium",
    message: "Multiple failed login attempts detected",
    metadata: { ip: "192.168.1.1", attempts: 5 },
    acknowledged: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock IP block entry
 */
export function createMockIpBlockEntry(
  overrides: Partial<IpBlockEntry> = {}
): IpBlockEntry {
  return {
    ip_address: "192.168.1.100",
    reason: "Suspicious activity",
    is_active: true,
    created_by: "admin-123",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock HTTP request for security-management
 */
export function createSecurityRequest(
  body: SecurityRequest,
  accessToken?: string
): Request {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (accessToken) {
    headers["Cookie"] = `__Secure-rise_access=${accessToken}`;
  }
  
  return new Request("https://localhost/functions/v1/security-management", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Asserts that a security operation succeeded
 */
export async function assertSecuritySuccess(
  response: Response
): Promise<{ success: boolean }> {
  assertEquals(response.status, 200, "Expected status 200");
  
  const body = await response.json();
  assertEquals(body.success, true, "Expected success: true");
  
  return body;
}

/**
 * Asserts that a security operation failed with expected status
 */
export async function assertSecurityError(
  response: Response,
  expectedStatus: number
): Promise<{ success: boolean; error: string }> {
  assertEquals(response.status, expectedStatus, `Expected status ${expectedStatus}`);
  
  const body = await response.json();
  assertEquals(body.success, false, "Expected success: false");
  assertEquals(typeof body.error, "string", "Expected error string");
  
  return body;
}

// ============================================================================
// SECURITY TEST DATA
// ============================================================================

export const validIpAddresses = [
  "192.168.1.1",
  "10.0.0.1",
  "172.16.0.1",
  "127.0.0.1",
  "0.0.0.0",
  "255.255.255.255",
];

export const invalidIpAddresses = [
  "",
  "invalid",
  "999.999.999.999",
  "192.168.1",
  "256.168.1.1",
  "localhost",
];

export const alertTypes = [
  "multiple_failed_logins",
  "suspicious_ip",
  "account_takeover_attempt",
  "brute_force_attack",
  "unusual_activity",
];

export const allowedRoles = ["admin", "owner"];
export const forbiddenRoles = ["user", "seller", "buyer"];
