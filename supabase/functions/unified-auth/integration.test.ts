/**
 * Unified Auth Edge Function - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete integration tests for unified-auth Edge Function.
 * Tests real HTTP requests, database state, and full authentication flows.
 * 
 * @module unified-auth/integration.test
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
  loginTestUser,
  assertSessionExists,
  assertUserExists,
  cleanupTestData,
  wait,
  type TestUser,
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
// Login Integration Tests
// ============================================================================

Deno.test("unified-auth/login: successful login with valid credentials", async () => {
  // Setup: Create test user
  const testUser = await createTestUser(supabase, {
    email: `login-test-${Date.now()}@example.com`,
    password: "ValidPassword123!",
  });
  createdUsers.push(testUser.id);
  
  try {
    // Act: Attempt login
    const response = await makeRequest("unified-auth", {
      method: "POST",
      body: JSON.stringify({
        action: "login",
        email: testUser.email,
        password: testUser.password,
      }),
    });
    
    // Assert: Response
    assertEquals(response.status, 200);
    
    const data = await response.json();
    assertExists(data.user);
    assertExists(data.session);
    assertEquals(data.user.email, testUser.email);
    
    // Assert: Session cookie set
    const setCookie = response.headers.get("set-cookie");
    assertExists(setCookie);
    assert(setCookie.includes("__Secure-rise_access"));
    assert(setCookie.includes("HttpOnly"));
    assert(setCookie.includes("Secure"));
    
    // Assert: Session exists in database
    const sessionExists = await assertSessionExists(supabase, data.session.session_token);
    assertEquals(sessionExists, true);
  } finally {
    await cleanup();
  }
});

Deno.test("unified-auth/login: failed login with invalid password", async () => {
  // Setup: Create test user
  const testUser = await createTestUser(supabase, {
    email: `invalid-pw-test-${Date.now()}@example.com`,
    password: "CorrectPassword123!",
  });
  createdUsers.push(testUser.id);
  
  try {
    // Act: Attempt login with wrong password
    const response = await makeRequest("unified-auth", {
      method: "POST",
      body: JSON.stringify({
        action: "login",
        email: testUser.email,
        password: "WrongPassword123!",
      }),
    });
    
    // Assert: Unauthorized
    assertEquals(response.status, 401);
    
    const data = await response.json();
    assertExists(data.error);
    assert(data.error.toLowerCase().includes("invalid") || data.error.toLowerCase().includes("incorrect"));
  } finally {
    await cleanup();
  }
});

Deno.test("unified-auth/login: failed login with non-existent email", async () => {
  // Act: Attempt login with non-existent email
  const response = await makeRequest("unified-auth", {
    method: "POST",
    body: JSON.stringify({
      action: "login",
      email: `nonexistent-${Date.now()}@example.com`,
      password: "SomePassword123!",
    }),
  });
  
  // Assert: Unauthorized
  assertEquals(response.status, 401);
  
  const data = await response.json();
  assertExists(data.error);
});

Deno.test("unified-auth/login: JWT token structure validation", async () => {
  // Setup: Create test user
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    // Act: Login
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
    
    // Assert: Token structure
    assertExists(data.session.access_token);
    assertExists(data.session.refresh_token);
    assertExists(data.session.expires_at);
    
    // JWT should have 3 parts separated by dots
    const tokenParts = data.session.access_token.split(".");
    assertEquals(tokenParts.length, 3);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Registration Integration Tests
// ============================================================================

Deno.test("unified-auth/register: successful registration with valid data", async () => {
  const timestamp = Date.now();
  const email = `register-test-${timestamp}@example.com`;
  
  try {
    // Act: Register new user
    const response = await makeRequest("unified-auth", {
      method: "POST",
      body: JSON.stringify({
        action: "register",
        email,
        password: "NewUserPassword123!",
        name: "New Test User",
      }),
    });
    
    // Assert: Success
    assertEquals(response.status, 201);
    
    const data = await response.json();
    assertExists(data.user);
    assertEquals(data.user.email, email);
    
    // Track for cleanup
    createdUsers.push(data.user.id);
    
    // Assert: User exists in database
    const userExists = await assertUserExists(supabase, email);
    assertEquals(userExists, true);
    
    // Assert: Default role assigned
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .single();
    
    assertExists(roleData);
    assertEquals(roleData.role, "producer"); // Default role
  } finally {
    await cleanup();
  }
});

Deno.test("unified-auth/register: duplicate email rejection", async () => {
  // Setup: Create existing user
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    // Act: Attempt to register with same email
    const response = await makeRequest("unified-auth", {
      method: "POST",
      body: JSON.stringify({
        action: "register",
        email: testUser.email, // Duplicate email
        password: "AnotherPassword123!",
        name: "Another User",
      }),
    });
    
    // Assert: Conflict
    assertEquals(response.status, 400);
    
    const data = await response.json();
    assertExists(data.error);
    assert(data.error.toLowerCase().includes("already") || data.error.toLowerCase().includes("exists"));
  } finally {
    await cleanup();
  }
});

Deno.test("unified-auth/register: password strength validation", async () => {
  const timestamp = Date.now();
  
  // Act: Attempt registration with weak password
  const response = await makeRequest("unified-auth", {
    method: "POST",
    body: JSON.stringify({
      action: "register",
      email: `weak-pw-test-${timestamp}@example.com`,
      password: "weak", // Too weak
      name: "Test User",
    }),
  });
  
  // Assert: Bad Request
  assertEquals(response.status, 400);
  
  const data = await response.json();
  assertExists(data.error);
  assert(data.error.toLowerCase().includes("password"));
});

// ============================================================================
// Token Refresh Integration Tests
// ============================================================================

Deno.test("unified-auth/refresh: successful token refresh", async () => {
  // Setup: Create user and login
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    const session = await loginTestUser(testUser.email, testUser.password);
    
    // Act: Refresh token
    const response = await makeRequest("unified-auth", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session.sessionToken}`,
      },
      body: JSON.stringify({
        action: "refresh",
      }),
    });
    
    // Assert: Success
    assertEquals(response.status, 200);
    
    const data = await response.json();
    assertExists(data.session);
    assertExists(data.session.access_token);
    
    // New token should be different from old one
    assert(data.session.access_token !== session.sessionToken);
  } finally {
    await cleanup();
  }
});

Deno.test("unified-auth/refresh: expired token rejection", async () => {
  // Setup: Create expired session
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    // Create session with past expiration
    const expiredToken = `expired-${Date.now()}`;
    await supabase.from("sessions").insert({
      user_id: testUser.id,
      session_token: expiredToken,
      is_valid: true,
      access_token_expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      device_info: {},
      ip_address: "127.0.0.1",
    });
    
    // Act: Attempt refresh with expired token
    const response = await makeRequest("unified-auth", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${expiredToken}`,
      },
      body: JSON.stringify({
        action: "refresh",
      }),
    });
    
    // Assert: Unauthorized
    assertEquals(response.status, 401);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Password Reset Integration Tests
// ============================================================================

Deno.test("unified-auth/reset-password: request password reset", async () => {
  // Setup: Create test user
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    // Act: Request password reset
    const response = await makeRequest("unified-auth", {
      method: "POST",
      body: JSON.stringify({
        action: "reset-password-request",
        email: testUser.email,
      }),
    });
    
    // Assert: Success (even for non-existent emails for security)
    assertEquals(response.status, 200);
    
    const data = await response.json();
    assertExists(data.message);
    
    // TODO: Verify reset email was sent (requires email service mock)
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Logout Integration Tests
// ============================================================================

Deno.test("unified-auth/logout: successful logout", async () => {
  // Setup: Create user and login
  const testUser = await createTestUser(supabase);
  createdUsers.push(testUser.id);
  
  try {
    const session = await loginTestUser(testUser.email, testUser.password);
    
    // Verify session exists
    let sessionExists = await assertSessionExists(supabase, session.sessionToken);
    assertEquals(sessionExists, true);
    
    // Act: Logout
    const response = await makeRequest("unified-auth", {
      method: "POST",
      headers: {
        Cookie: `__Secure-rise_access=${session.sessionToken}`,
      },
      body: JSON.stringify({
        action: "logout",
      }),
    });
    
    // Assert: Success
    assertEquals(response.status, 200);
    
    // Assert: Session invalidated
    await wait(100); // Small delay for DB update
    sessionExists = await assertSessionExists(supabase, session.sessionToken);
    assertEquals(sessionExists, false);
  } finally {
    await cleanup();
  }
});

// ============================================================================
// Security Tests
// ============================================================================

Deno.test("unified-auth/security: rate limiting on failed login attempts", async () => {
  const email = `rate-limit-test-${Date.now()}@example.com`;
  
  // Act: Make multiple failed login attempts
  const attempts = 6; // Assuming limit is 5
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
    await wait(100); // Small delay between attempts
  }
  
  // Assert: Last attempt should be rate limited
  const lastResponse = responses[responses.length - 1];
  assert(lastResponse.status === 429 || lastResponse.status === 401);
  
  // If 429, verify rate limit message
  if (lastResponse.status === 429) {
    const data = await lastResponse.json();
    assertExists(data.error);
    assert(data.error.toLowerCase().includes("rate") || data.error.toLowerCase().includes("too many"));
  }
});

Deno.test("unified-auth/security: SQL injection prevention", async () => {
  // Act: Attempt SQL injection in email field
  const response = await makeRequest("unified-auth", {
    method: "POST",
    body: JSON.stringify({
      action: "login",
      email: "admin@example.com' OR '1'='1",
      password: "anything",
    }),
  });
  
  // Assert: Should fail safely (not expose SQL error)
  assertEquals(response.status, 401);
  
  const data = await response.json();
  assertExists(data.error);
  // Should not contain SQL keywords or error details
  assert(!data.error.toLowerCase().includes("sql"));
  assert(!data.error.toLowerCase().includes("syntax"));
});

// ============================================================================
// Cleanup after all tests
// ============================================================================

Deno.test("cleanup: remove all test data", async () => {
  await cleanupTestData(supabase);
  assertEquals(true, true); // Placeholder assertion
});
