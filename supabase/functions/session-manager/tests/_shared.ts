/**
 * Session Manager Tests - Shared Utilities
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Type-safe mocks and utilities for session-manager tests.
 * 
 * @module session-manager/tests/_shared
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  createMockUser,
  createMockSession,
  createMockRequest,
  createMockSupabaseClient,
  createEmptyDataStore,
  jsonResponse,
  defaultCorsHeaders,
} from "../../_shared/testing/mod.ts";
import type { MockUser, MockSession, MockDataStore } from "../../_shared/testing/mod.ts";

// ============================================================================
// RE-EXPORTS
// ============================================================================

export {
  createMockUser,
  createMockSession,
  createMockRequest,
  createMockSupabaseClient,
  createEmptyDataStore,
  jsonResponse,
  defaultCorsHeaders,
};

export type { MockUser, MockSession, MockDataStore };

// ============================================================================
// SESSION MANAGEMENT TYPES
// ============================================================================

export type SessionAction = "list" | "revoke" | "revoke-all" | "revoke-others";

export interface ListRequest {
  action: "list";
}

export interface RevokeRequest {
  action: "revoke";
  sessionId: string;
}

export interface RevokeAllRequest {
  action: "revoke-all";
}

export interface RevokeOthersRequest {
  action: "revoke-others";
}

export type SessionManagementRequest = 
  | ListRequest 
  | RevokeRequest 
  | RevokeAllRequest 
  | RevokeOthersRequest;

export interface SessionInfo {
  id: string;
  user_id: string;
  device_info?: string;
  ip_address?: string;
  created_at: string;
  last_activity_at?: string;
  access_token_expires_at?: string;
  is_valid: boolean;
  is_current: boolean;
}

export interface ListResponse {
  success: boolean;
  sessions: SessionInfo[];
  currentSessionId: string;
}

export interface RevokeResponse {
  success: boolean;
  sessionId?: string;
  count?: number;
}

// ============================================================================
// SESSION MANAGEMENT FACTORIES
// ============================================================================

/**
 * Creates a session management request
 */
export function createSessionRequest<T extends SessionManagementRequest>(
  request: T
): T {
  return request;
}

/**
 * Creates a mock HTTP request for session-manager
 */
export function createSessionManagerRequest(
  body: SessionManagementRequest,
  accessToken?: string
): Request {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (accessToken) {
    headers["Cookie"] = `__Secure-rise_access=${accessToken}`;
  }
  
  return new Request("https://localhost/functions/v1/session-manager", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * Creates multiple mock sessions for a user
 */
export function createMockSessionList(
  userId: string,
  count: number = 3
): MockSession[] {
  return Array.from({ length: count }, (_, i) => 
    createMockSession(userId, {
      id: `session-${i + 1}`,
      access_token: `access-token-${i + 1}`,
      refresh_token: `refresh-token-${i + 1}`,
      is_active: true,
      created_at: new Date(Date.now() - i * 86400000).toISOString(), // i days ago
    })
  );
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Asserts that a list response is valid
 */
export async function assertListSuccess(
  response: Response,
  expectedCount?: number
): Promise<ListResponse> {
  assertEquals(response.status, 200, "Expected status 200");
  
  const body = await response.json();
  assertEquals(body.success, true, "Expected success: true");
  assertEquals(Array.isArray(body.sessions), true, "Expected sessions array");
  
  if (expectedCount !== undefined) {
    assertEquals(body.sessions.length, expectedCount, "Session count mismatch");
  }
  
  return body as ListResponse;
}

/**
 * Asserts that a revoke response is valid
 */
export async function assertRevokeSuccess(
  response: Response
): Promise<RevokeResponse> {
  assertEquals(response.status, 200, "Expected status 200");
  
  const body = await response.json();
  assertEquals(body.success, true, "Expected success: true");
  
  return body as RevokeResponse;
}

/**
 * Asserts that a response is an error
 */
export async function assertSessionError(
  response: Response,
  expectedStatus: number
): Promise<{ success: boolean; error: string }> {
  assertEquals(response.status, expectedStatus, `Expected status ${expectedStatus}`);
  
  const body = await response.json();
  assertEquals(body.success, false, "Expected success: false");
  assertEquals(typeof body.error, "string", "Expected error string");
  
  return body;
}
