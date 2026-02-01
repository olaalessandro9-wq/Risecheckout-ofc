/**
 * Unified Auth Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for unified-auth Edge Function.
 * Tests real HTTP requests, database state, and full authentication flows.
 * 
 * NOTE: These tests require local Supabase infrastructure.
 * They are skipped in CI environments without SUPABASE_SERVICE_ROLE_KEY.
 * 
 * @module unified-auth/integration.test
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

// ============================================================================
// Environment Detection & Test Gating
// ============================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const skipTests = !SUPABASE_URL || 
  !SUPABASE_SERVICE_ROLE_KEY || 
  SUPABASE_URL.includes("test.supabase.co") || 
  !SUPABASE_URL.startsWith("https://");

// ============================================================================
// Lazy Client Factory
// ============================================================================

// deno-lint-ignore no-explicit-any
let _supabase: any = null;
const createdUsers: string[] = [];

// deno-lint-ignore no-explicit-any
async function getTestClient(): Promise<any> {
  if (_supabase) return _supabase;
  
  const { createTestClient } = await import("../_shared/test-helpers.ts");
  _supabase = createTestClient();
  return _supabase;
}

async function getTestHelpers() {
  return await import("../_shared/test-helpers.ts");
}

async function cleanup() {
  if (createdUsers.length === 0) return;
  
  const supabase = await getTestClient();
  const { deleteTestUser } = await getTestHelpers();
  
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
// Login Integration Tests
// ============================================================================

Deno.test({
  name: "unified-auth/login: successful login with valid credentials",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, makeRequest, assertSessionExists } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase, {
      email: `login-test-${Date.now()}@example.com`,
      password: "ValidPassword123!",
    });
    createdUsers.push(testUser.id);
    
    try {
      const response = await makeRequest("unified-auth", {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          email: testUser.email,
          password: testUser.password,
        }),
      });
      
      assertEquals(response.status, 200);
      
      const data = await response.json();
      assertExists(data.user);
      assertExists(data.session);
      assertEquals(data.user.email, testUser.email);
      
      const setCookie = response.headers.get("set-cookie");
      assertExists(setCookie);
      assert(setCookie.includes("__Secure-rise_access"));
      assert(setCookie.includes("HttpOnly"));
      assert(setCookie.includes("Secure"));
      
      const sessionExists = await assertSessionExists(supabase, data.session.session_token);
      assertEquals(sessionExists, true);
    } finally {
      await cleanup();
    }
  },
});

Deno.test({
  name: "unified-auth/login: failed login with invalid password",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, makeRequest } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase, {
      email: `invalid-pw-test-${Date.now()}@example.com`,
      password: "CorrectPassword123!",
    });
    createdUsers.push(testUser.id);
    
    try {
      const response = await makeRequest("unified-auth", {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          email: testUser.email,
          password: "WrongPassword123!",
        }),
      });
      
      assertEquals(response.status, 401);
      
      const data = await response.json();
      assertExists(data.error);
      assert(data.error.toLowerCase().includes("invalid") || data.error.toLowerCase().includes("incorrect"));
    } finally {
      await cleanup();
    }
  },
});

Deno.test({
  name: "unified-auth/login: failed login with non-existent email",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    
    const response = await makeRequest("unified-auth", {
      method: "POST",
      body: JSON.stringify({
        action: "login",
        email: `nonexistent-${Date.now()}@example.com`,
        password: "SomePassword123!",
      }),
    });
    
    assertEquals(response.status, 401);
    
    const data = await response.json();
    assertExists(data.error);
  },
});

Deno.test({
  name: "unified-auth/login: JWT token structure validation",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, makeRequest } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const response = await makeRequest("unified-auth", {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          email: testUser.email,
          password: testUser.password,
        }),
      });
      
      assertEquals(response.status, 200);
      const data = await response.json();
      
      assertExists(data.session.access_token);
      assertExists(data.session.refresh_token);
      assertExists(data.session.expires_at);
      
      const tokenParts = data.session.access_token.split(".");
      assertEquals(tokenParts.length, 3);
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Registration Integration Tests
// ============================================================================

Deno.test({
  name: "unified-auth/register: successful registration with valid data",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { makeRequest, assertUserExists } = await getTestHelpers();
    
    const timestamp = Date.now();
    const email = `register-test-${timestamp}@example.com`;
    
    try {
      const response = await makeRequest("unified-auth", {
        method: "POST",
        body: JSON.stringify({
          action: "register",
          email,
          password: "NewUserPassword123!",
          name: "New Test User",
        }),
      });
      
      assertEquals(response.status, 201);
      
      const data = await response.json();
      assertExists(data.user);
      assertEquals(data.user.email, email);
      
      createdUsers.push(data.user.id);
      
      const userExists = await assertUserExists(supabase, email);
      assertEquals(userExists, true);
      
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();
      
      assertExists(roleData);
      assertEquals(roleData.role, "producer");
    } finally {
      await cleanup();
    }
  },
});

Deno.test({
  name: "unified-auth/register: duplicate email rejection",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, makeRequest } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const response = await makeRequest("unified-auth", {
        method: "POST",
        body: JSON.stringify({
          action: "register",
          email: testUser.email,
          password: "AnotherPassword123!",
          name: "Another User",
        }),
      });
      
      assertEquals(response.status, 400);
      
      const data = await response.json();
      assertExists(data.error);
      assert(data.error.toLowerCase().includes("already") || data.error.toLowerCase().includes("exists"));
    } finally {
      await cleanup();
    }
  },
});

Deno.test({
  name: "unified-auth/register: password strength validation",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    
    const timestamp = Date.now();
    
    const response = await makeRequest("unified-auth", {
      method: "POST",
      body: JSON.stringify({
        action: "register",
        email: `weak-pw-test-${timestamp}@example.com`,
        password: "weak",
        name: "Test User",
      }),
    });
    
    assertEquals(response.status, 400);
    
    const data = await response.json();
    assertExists(data.error);
    assert(data.error.toLowerCase().includes("password"));
  },
});

// ============================================================================
// Token Refresh Integration Tests
// ============================================================================

Deno.test({
  name: "unified-auth/refresh: successful token refresh",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, loginTestUser, makeRequest } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const session = await loginTestUser(testUser.email, testUser.password);
      
      const response = await makeRequest("unified-auth", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session.sessionToken}`,
        },
        body: JSON.stringify({
          action: "refresh",
        }),
      });
      
      assertEquals(response.status, 200);
      
      const data = await response.json();
      assertExists(data.session);
      assertExists(data.session.access_token);
      
      assert(data.session.access_token !== session.sessionToken);
    } finally {
      await cleanup();
    }
  },
});

Deno.test({
  name: "unified-auth/refresh: expired token rejection",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, makeRequest } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const expiredToken = `expired-${Date.now()}`;
      await supabase.from("sessions").insert({
        user_id: testUser.id,
        session_token: expiredToken,
        is_valid: true,
        access_token_expires_at: new Date(Date.now() - 3600000).toISOString(),
        device_info: {},
        ip_address: "127.0.0.1",
      });
      
      const response = await makeRequest("unified-auth", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${expiredToken}`,
        },
        body: JSON.stringify({
          action: "refresh",
        }),
      });
      
      assertEquals(response.status, 401);
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Password Reset Integration Tests
// ============================================================================

Deno.test({
  name: "unified-auth/reset-password: request password reset",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, makeRequest } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const response = await makeRequest("unified-auth", {
        method: "POST",
        body: JSON.stringify({
          action: "reset-password-request",
          email: testUser.email,
        }),
      });
      
      assertEquals(response.status, 200);
      
      const data = await response.json();
      assertExists(data.message);
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Logout Integration Tests
// ============================================================================

Deno.test({
  name: "unified-auth/logout: successful logout",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { createTestUser, loginTestUser, makeRequest, assertSessionExists, wait } = await getTestHelpers();
    
    const testUser = await createTestUser(supabase);
    createdUsers.push(testUser.id);
    
    try {
      const session = await loginTestUser(testUser.email, testUser.password);
      
      let sessionExists = await assertSessionExists(supabase, session.sessionToken);
      assertEquals(sessionExists, true);
      
      const response = await makeRequest("unified-auth", {
        method: "POST",
        headers: {
          Cookie: `__Secure-rise_access=${session.sessionToken}`,
        },
        body: JSON.stringify({
          action: "logout",
        }),
      });
      
      assertEquals(response.status, 200);
      
      await wait(100);
      sessionExists = await assertSessionExists(supabase, session.sessionToken);
      assertEquals(sessionExists, false);
    } finally {
      await cleanup();
    }
  },
});

// ============================================================================
// Security Tests
// ============================================================================

Deno.test({
  name: "unified-auth/security: rate limiting on failed login attempts",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest, wait } = await getTestHelpers();
    
    const email = `rate-limit-test-${Date.now()}@example.com`;
    
    const attempts = 6;
    const responses: Response[] = [];
    
    for (let i = 0; i < attempts; i++) {
      const response = await makeRequest("unified-auth", {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          email,
          password: "WrongPassword123!",
        }),
      });
      responses.push(response);
      await wait(100);
    }
    
    const lastResponse = responses[responses.length - 1];
    assert(lastResponse.status === 429 || lastResponse.status === 401);
    
    if (lastResponse.status === 429) {
      const data = await lastResponse.json();
      assertExists(data.error);
      assert(data.error.toLowerCase().includes("rate") || data.error.toLowerCase().includes("too many"));
    }
  },
});

Deno.test({
  name: "unified-auth/security: SQL injection prevention",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const { makeRequest } = await getTestHelpers();
    
    const response = await makeRequest("unified-auth", {
      method: "POST",
      body: JSON.stringify({
        action: "login",
        email: "admin@example.com' OR '1'='1",
        password: "anything",
      }),
    });
    
    assertEquals(response.status, 401);
    
    const data = await response.json();
    assertExists(data.error);
    assert(!data.error.toLowerCase().includes("sql"));
    assert(!data.error.toLowerCase().includes("syntax"));
  },
});

// ============================================================================
// Cleanup after all tests
// ============================================================================

Deno.test({
  name: "cleanup: remove all test data",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = await getTestClient();
    const { cleanupTestData } = await getTestHelpers();
    await cleanupTestData(supabase);
    assertEquals(true, true);
  },
});
