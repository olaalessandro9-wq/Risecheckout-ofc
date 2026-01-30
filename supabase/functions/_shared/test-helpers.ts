/**
 * Test Helpers for Edge Functions Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Shared utilities for testing Edge Functions with real HTTP requests
 * and database validation.
 * 
 * @module _shared/test-helpers
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// Types
// ============================================================================

export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface TestSession {
  sessionToken: string;
  userId: string;
  sessionId: string;
}

// ============================================================================
// Environment Configuration
// ============================================================================

export function getTestConfig() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "http://localhost:54321";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const functionUrl = Deno.env.get("FUNCTION_URL") || "http://localhost:54321/functions/v1";
  
  return {
    supabaseUrl,
    supabaseServiceKey,
    functionUrl,
  };
}

// ============================================================================
// Supabase Client
// ============================================================================

export function createTestClient(): SupabaseClient {
  const config = getTestConfig();
  return createClient(config.supabaseUrl, config.supabaseServiceKey);
}

// ============================================================================
// Test User Management
// ============================================================================

export async function createTestUser(
  supabase: SupabaseClient,
  overrides?: Partial<TestUser>
): Promise<TestUser> {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  
  const testUser: TestUser = {
    id: overrides?.id || `test-user-${randomId}`,
    email: overrides?.email || `test-${timestamp}-${randomId}@example.com`,
    password: overrides?.password || "TestPassword123!",
    name: overrides?.name || `Test User ${randomId}`,
    role: overrides?.role || "producer",
  };
  
  // Create user in auth.users (if using Supabase Auth)
  // Note: This is a simplified version. Real implementation may vary.
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: testUser.email,
    password: testUser.password,
    email_confirm: true,
    user_metadata: {
      name: testUser.name,
    },
  });
  
  if (authError) {
    throw new Error(`Failed to create auth user: ${authError.message}`);
  }
  
  testUser.id = authUser.user.id;
  
  // Create profile
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: testUser.id,
      name: testUser.name,
      email: testUser.email,
    });
  
  if (profileError) {
    throw new Error(`Failed to create profile: ${profileError.message}`);
  }
  
  // Assign role
  const { error: roleError } = await supabase
    .from("user_roles")
    .insert({
      user_id: testUser.id,
      role: testUser.role,
    });
  
  if (roleError) {
    throw new Error(`Failed to assign role: ${roleError.message}`);
  }
  
  return testUser;
}

export async function deleteTestUser(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  // Delete in reverse order of creation
  await supabase.from("user_roles").delete().eq("user_id", userId);
  await supabase.from("profiles").delete().eq("id", userId);
  await supabase.from("sessions").delete().eq("user_id", userId);
  await supabase.auth.admin.deleteUser(userId);
}

// ============================================================================
// HTTP Request Helpers
// ============================================================================

export async function makeRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const config = getTestConfig();
  const url = `${config.functionUrl}/${endpoint}`;
  
  const defaultHeaders = {
    "Content-Type": "application/json",
  };
  
  return await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
}

export async function loginTestUser(
  email: string,
  password: string
): Promise<TestSession> {
  const response = await makeRequest("unified-auth", {
    method: "POST",
    body: JSON.stringify({
      action: "login",
      email,
      password,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Extract session token from Set-Cookie header
  const setCookie = response.headers.get("set-cookie");
  const sessionToken = extractSessionToken(setCookie);
  
  return {
    sessionToken,
    userId: data.user.id,
    sessionId: data.session.id,
  };
}

function extractSessionToken(setCookie: string | null): string {
  if (!setCookie) {
    throw new Error("No session cookie found");
  }
  
  const match = setCookie.match(/__Secure-rise_access=([^;]+)/);
  if (!match) {
    throw new Error("Session token not found in cookie");
  }
  
  return match[1];
}

// ============================================================================
// Session Helpers
// ============================================================================

export async function createTestSession(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const sessionToken = `test-session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  const { error } = await supabase
    .from("sessions")
    .insert({
      user_id: userId,
      session_token: sessionToken,
      is_valid: true,
      access_token_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      device_info: { test: true },
      ip_address: "127.0.0.1",
    });
  
  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }
  
  return sessionToken;
}

export async function deleteTestSession(
  supabase: SupabaseClient,
  sessionToken: string
): Promise<void> {
  await supabase
    .from("sessions")
    .delete()
    .eq("session_token", sessionToken);
}

// ============================================================================
// Assertion Helpers
// ============================================================================

export async function assertSessionExists(
  supabase: SupabaseClient,
  sessionToken: string
): Promise<boolean> {
  const { data } = await supabase
    .from("sessions")
    .select("id")
    .eq("session_token", sessionToken)
    .eq("is_valid", true)
    .single();
  
  return !!data;
}

export async function assertUserExists(
  supabase: SupabaseClient,
  email: string
): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();
  
  return !!data;
}

// ============================================================================
// Cleanup Helpers
// ============================================================================

export async function cleanupTestData(
  supabase: SupabaseClient
): Promise<void> {
  // Delete test users (those with email containing 'test-')
  const { data: testUsers } = await supabase
    .from("profiles")
    .select("id")
    .like("email", "%test-%@example.com");
  
  if (testUsers) {
    for (const user of testUsers) {
      await deleteTestUser(supabase, user.id);
    }
  }
}

// ============================================================================
// Wait Helpers
// ============================================================================

export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeoutMs = 5000,
  intervalMs = 100
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return true;
    }
    await wait(intervalMs);
  }
  
  return false;
}
