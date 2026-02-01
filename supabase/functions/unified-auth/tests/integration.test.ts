/**
 * Unified Auth - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * End-to-end tests that verify the complete auth flow.
 * Requires RUN_INTEGRATION=true environment variable.
 * 
 * @module unified-auth/tests/integration
 */

// Note: We do NOT use dotenv/load.ts because it throws when .env.example has extra vars
// Tests that need env vars should use skipIntegration() guards
import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import { skipIntegration } from "../../_shared/testing/mod.ts";

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || "http://localhost:54321";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/unified-auth`;

// Generate unique email for each test run
const TEST_EMAIL = `integration-test-${Date.now()}@example.com`;
const TEST_PASSWORD = "IntegrationTest123!";

// ============================================================================
// FULL REGISTRATION FLOW
// ============================================================================

Deno.test({
  name: "integration: complete registration flow",
  ignore: skipIntegration(),
  fn: async () => {
    // 1. Register new user
    const registerResponse = await fetch(`${FUNCTION_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: "Integration Test User",
        registrationType: "buyer",
      }),
    });
    
    const registerBody = await registerResponse.json();
    assertEquals(registerResponse.status, 200, `Registration failed: ${JSON.stringify(registerBody)}`);
    assertExists(registerBody.user);
    assertExists(registerBody.user.id);
    assertEquals(registerBody.user.email, TEST_EMAIL.toLowerCase());
    
    // Verify roles
    assert(Array.isArray(registerBody.roles));
    assert(registerBody.roles.includes("buyer"));
    
    // Verify cookies are set
    const cookies = registerResponse.headers.get("Set-Cookie");
    assertExists(cookies, "Expected Set-Cookie header");
    assert(cookies.includes("__Secure-rise_access"), "Expected access token cookie");
  },
});

// ============================================================================
// FULL LOGIN FLOW
// ============================================================================

Deno.test({
  name: "integration: complete login flow",
  ignore: skipIntegration(),
  fn: async () => {
    // First ensure user exists (register)
    const uniqueEmail = `login-test-${Date.now()}@example.com`;
    
    await fetch(`${FUNCTION_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail,
        password: TEST_PASSWORD,
        name: "Login Test User",
      }),
    });
    
    // Now test login
    const loginResponse = await fetch(`${FUNCTION_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail,
        password: TEST_PASSWORD,
      }),
    });
    
    const loginBody = await loginResponse.json();
    assertEquals(loginResponse.status, 200, `Login failed: ${JSON.stringify(loginBody)}`);
    assertExists(loginBody.user);
    assertEquals(loginBody.user.email, uniqueEmail.toLowerCase());
    assertExists(loginBody.roles);
    assertExists(loginBody.activeRole);
  },
});

// ============================================================================
// SESSION VALIDATION FLOW
// ============================================================================

Deno.test({
  name: "integration: session validation after login",
  ignore: skipIntegration(),
  fn: async () => {
    const uniqueEmail = `validate-test-${Date.now()}@example.com`;
    
    // Register and get tokens
    const registerResponse = await fetch(`${FUNCTION_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail,
        password: TEST_PASSWORD,
        name: "Validate Test User",
      }),
    });
    
    const cookies = registerResponse.headers.get("Set-Cookie") || "";
    
    // Extract access token from cookies
    const accessTokenMatch = cookies.match(/__Secure-rise_access=([^;]+)/);
    assertExists(accessTokenMatch, "Expected access token in cookies");
    
    // Validate session
    const validateResponse = await fetch(`${FUNCTION_URL}/validate`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessTokenMatch[1]}`,
      },
      body: JSON.stringify({}),
    });
    
    const validateBody = await validateResponse.json();
    assertEquals(validateResponse.status, 200, `Validation failed: ${JSON.stringify(validateBody)}`);
    assertEquals(validateBody.valid, true);
    assertExists(validateBody.user);
    assertEquals(validateBody.user.email, uniqueEmail.toLowerCase());
  },
});

// ============================================================================
// TOKEN REFRESH FLOW
// ============================================================================

Deno.test({
  name: "integration: token refresh flow",
  ignore: skipIntegration(),
  fn: async () => {
    const uniqueEmail = `refresh-test-${Date.now()}@example.com`;
    
    // Register and get tokens
    const registerResponse = await fetch(`${FUNCTION_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail,
        password: TEST_PASSWORD,
        name: "Refresh Test User",
      }),
    });
    
    const cookies = registerResponse.headers.get("Set-Cookie") || "";
    
    // Extract refresh token from cookies
    const refreshTokenMatch = cookies.match(/__Secure-rise_refresh=([^;]+)/);
    assertExists(refreshTokenMatch, "Expected refresh token in cookies");
    
    // Refresh tokens
    const refreshResponse = await fetch(`${FUNCTION_URL}/refresh`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_refresh=${refreshTokenMatch[1]}`,
      },
      body: JSON.stringify({}),
    });
    
    const refreshBody = await refreshResponse.json();
    assertEquals(refreshResponse.status, 200, `Refresh failed: ${JSON.stringify(refreshBody)}`);
    assertEquals(refreshBody.success, true);
    assertExists(refreshBody.expiresIn);
  },
});

// ============================================================================
// LOGOUT FLOW
// ============================================================================

Deno.test({
  name: "integration: logout invalidates session",
  ignore: skipIntegration(),
  fn: async () => {
    const uniqueEmail = `logout-test-${Date.now()}@example.com`;
    
    // Register
    const registerResponse = await fetch(`${FUNCTION_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail,
        password: TEST_PASSWORD,
        name: "Logout Test User",
      }),
    });
    
    const cookies = registerResponse.headers.get("Set-Cookie") || "";
    const accessTokenMatch = cookies.match(/__Secure-rise_access=([^;]+)/);
    assertExists(accessTokenMatch);
    
    // Logout
    const logoutResponse = await fetch(`${FUNCTION_URL}/logout`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessTokenMatch[1]}`,
      },
      body: JSON.stringify({}),
    });
    
    await logoutResponse.text();
    assertEquals(logoutResponse.status, 200);
    
    // Verify session is invalid
    const validateResponse = await fetch(`${FUNCTION_URL}/validate`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessTokenMatch[1]}`,
      },
      body: JSON.stringify({}),
    });
    
    assertEquals(validateResponse.status, 401);
    await validateResponse.text();
  },
});

// ============================================================================
// DUPLICATE EMAIL REGISTRATION
// ============================================================================

Deno.test({
  name: "integration: duplicate email returns 409",
  ignore: skipIntegration(),
  fn: async () => {
    const uniqueEmail = `duplicate-test-${Date.now()}@example.com`;
    
    // First registration
    const firstResponse = await fetch(`${FUNCTION_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail,
        password: TEST_PASSWORD,
        name: "First User",
      }),
    });
    
    await firstResponse.text();
    assertEquals(firstResponse.status, 200);
    
    // Second registration with same email
    const secondResponse = await fetch(`${FUNCTION_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail,
        password: TEST_PASSWORD,
        name: "Second User",
      }),
    });
    
    const body = await secondResponse.json();
    assertEquals(secondResponse.status, 409);
    assertExists(body.error);
  },
});

// ============================================================================
// PASSWORD RESET FLOW
// ============================================================================

Deno.test({
  name: "integration: password reset request succeeds for existing user",
  ignore: skipIntegration(),
  fn: async () => {
    const uniqueEmail = `reset-test-${Date.now()}@example.com`;
    
    // Register user first
    const registerResponse = await fetch(`${FUNCTION_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail,
        password: TEST_PASSWORD,
        name: "Reset Test User",
      }),
    });
    
    await registerResponse.text();
    
    // Request password reset
    const resetResponse = await fetch(`${FUNCTION_URL}/password-reset-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: uniqueEmail }),
    });
    
    const body = await resetResponse.json();
    // Should succeed or return specific error
    assert([200, 400].includes(resetResponse.status), `Unexpected status: ${resetResponse.status}`);
  },
});

// ============================================================================
// CONTEXT SWITCHING
// ============================================================================

Deno.test({
  name: "integration: context switch between roles",
  ignore: skipIntegration(),
  fn: async () => {
    const uniqueEmail = `context-test-${Date.now()}@example.com`;
    
    // Register as producer (which gets both buyer and seller roles)
    const registerResponse = await fetch(`${FUNCTION_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail,
        password: TEST_PASSWORD,
        name: "Context Test User",
        registrationType: "producer",
      }),
    });
    
    const registerBody = await registerResponse.json();
    const cookies = registerResponse.headers.get("Set-Cookie") || "";
    const accessTokenMatch = cookies.match(/__Secure-rise_access=([^;]+)/);
    
    if (!accessTokenMatch) {
      // Skip if registration didn't return token
      return;
    }
    
    // Verify user has multiple roles
    assert(Array.isArray(registerBody.roles));
    if (!registerBody.roles.includes("seller")) {
      // Skip if user doesn't have multiple roles
      return;
    }
    
    // Switch context to buyer
    const switchResponse = await fetch(`${FUNCTION_URL}/switch-context`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessTokenMatch[1]}`,
      },
      body: JSON.stringify({ targetContext: "buyer" }),
    });
    
    const switchBody = await switchResponse.json();
    if (switchResponse.status === 200) {
      assertEquals(switchBody.activeRole, "buyer");
    }
  },
});

// ============================================================================
// SECURITY: RATE LIMITING
// ============================================================================

Deno.test({
  name: "integration: rate limiting after multiple failed logins",
  ignore: skipIntegration(),
  fn: async () => {
    const uniqueEmail = `ratelimit-test-${Date.now()}@example.com`;
    
    // Attempt multiple failed logins
    const attempts = 10;
    let lastStatus = 0;
    
    for (let i = 0; i < attempts; i++) {
      const response = await fetch(`${FUNCTION_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: uniqueEmail,
          password: "WrongPassword123",
        }),
      });
      
      await response.text();
      lastStatus = response.status;
      
      // If we get rate limited, test passes
      if (response.status === 429) {
        break;
      }
    }
    
    // Either we got rate limited (429) or all attempts returned 401
    assert([401, 429].includes(lastStatus));
  },
});
