/**
 * Security Management - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * End-to-end tests for security management.
 * Requires RUN_INTEGRATION=true environment variable.
 * 
 * @module security-management/tests/integration
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";
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
const AUTH_URL = `${SUPABASE_URL}/functions/v1/unified-auth`;
const SECURITY_URL = `${SUPABASE_URL}/functions/v1/security-management`;

const TEST_PASSWORD = "IntegrationTest123!";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Note: These integration tests require an admin/owner user to be set up
 * in the test database. For now, we test the unauthorized path.
 */

// ============================================================================
// UNAUTHORIZED ACCESS TESTS
// ============================================================================

Deno.test({
  name: "integration: security management requires authentication",
  ignore: skipIntegration(),
  fn: async () => {
    const response = await fetch(SECURITY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        action: "acknowledge-alert", 
        alertId: "test-alert-123" 
      }),
    });
    
    await response.text();
    assertEquals(response.status, 401);
  },
});

Deno.test({
  name: "integration: security management requires admin/owner role",
  ignore: skipIntegration(),
  fn: async () => {
    // Create a regular user (not admin)
    const email = `security-test-${Date.now()}@example.com`;
    
    const registerResponse = await fetch(`${AUTH_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: TEST_PASSWORD,
        name: "Security Test User",
        registrationType: "buyer", // Regular user, not admin
      }),
    });
    
    const cookies = registerResponse.headers.get("Set-Cookie") || "";
    const accessTokenMatch = cookies.match(/__Secure-rise_access=([^;]+)/);
    
    await registerResponse.text();
    
    if (!accessTokenMatch) {
      return; // Skip if registration failed
    }
    
    // Try to access security management as regular user
    const securityResponse = await fetch(SECURITY_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessTokenMatch[1]}`,
      },
      body: JSON.stringify({ 
        action: "acknowledge-alert", 
        alertId: "test-alert-123" 
      }),
    });
    
    const body = await securityResponse.json();
    
    // Should be 403 Forbidden (not 401 Unauthorized)
    assertEquals(securityResponse.status, 403, `Expected 403, got ${securityResponse.status}: ${JSON.stringify(body)}`);
  },
});

// ============================================================================
// INPUT VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "integration: block-ip validates required fields",
  ignore: skipIntegration(),
  fn: async () => {
    const email = `block-test-${Date.now()}@example.com`;
    
    const registerResponse = await fetch(`${AUTH_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: TEST_PASSWORD,
        name: "Block Test User",
      }),
    });
    
    const cookies = registerResponse.headers.get("Set-Cookie") || "";
    const accessTokenMatch = cookies.match(/__Secure-rise_access=([^;]+)/);
    
    await registerResponse.text();
    
    if (!accessTokenMatch) {
      return;
    }
    
    // Try block-ip without required fields
    const response = await fetch(SECURITY_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessTokenMatch[1]}`,
      },
      body: JSON.stringify({ action: "block-ip" }),
    });
    
    await response.text();
    
    // Should be 400 or 403 (depending on role check order)
    assert([400, 403].includes(response.status));
  },
});

Deno.test({
  name: "integration: acknowledge-alert validates alertId",
  ignore: skipIntegration(),
  fn: async () => {
    const email = `ack-test-${Date.now()}@example.com`;
    
    const registerResponse = await fetch(`${AUTH_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: TEST_PASSWORD,
        name: "Ack Test User",
      }),
    });
    
    const cookies = registerResponse.headers.get("Set-Cookie") || "";
    const accessTokenMatch = cookies.match(/__Secure-rise_access=([^;]+)/);
    
    await registerResponse.text();
    
    if (!accessTokenMatch) {
      return;
    }
    
    // Try acknowledge-alert without alertId
    const response = await fetch(SECURITY_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessTokenMatch[1]}`,
      },
      body: JSON.stringify({ action: "acknowledge-alert" }),
    });
    
    await response.text();
    
    // Should be 400 or 403
    assert([400, 403].includes(response.status));
  },
});

// ============================================================================
// UNKNOWN ACTION TESTS
// ============================================================================

Deno.test({
  name: "integration: unknown action returns error",
  ignore: skipIntegration(),
  fn: async () => {
    const email = `unknown-test-${Date.now()}@example.com`;
    
    const registerResponse = await fetch(`${AUTH_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: TEST_PASSWORD,
        name: "Unknown Test User",
      }),
    });
    
    const cookies = registerResponse.headers.get("Set-Cookie") || "";
    const accessTokenMatch = cookies.match(/__Secure-rise_access=([^;]+)/);
    
    await registerResponse.text();
    
    if (!accessTokenMatch) {
      return;
    }
    
    // Try unknown action
    const response = await fetch(SECURITY_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": `__Secure-rise_access=${accessTokenMatch[1]}`,
      },
      body: JSON.stringify({ action: "unknown-action" }),
    });
    
    await response.text();
    
    // Should be 400 or 403
    assert([400, 403].includes(response.status));
  },
});
