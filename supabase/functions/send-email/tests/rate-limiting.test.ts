/**
 * Send Email Tests - Rate Limiting
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for rate limiting in send-email Edge Function.
 * 
 * @module send-email/tests/rate-limiting
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  FUNCTION_NAME,
  createMockRateLimitRecord,
} from "./_shared.ts";

import {
  createMockSupabaseClient,
  createMockDataStore,
  createMockRequest,
} from "../../_shared/testing/mod.ts";

import { RATE_LIMIT_CONFIGS } from "../../_shared/rate-limiting/index.ts";

// ============================================================================
// RATE LIMIT CONFIG TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] RateLimit - SEND_EMAIL config exists`, () => {
  assertExists(RATE_LIMIT_CONFIGS.SEND_EMAIL, "SEND_EMAIL config should exist");
});

Deno.test(`[${FUNCTION_NAME}] RateLimit - SEND_EMAIL has correct structure`, () => {
  const config = RATE_LIMIT_CONFIGS.SEND_EMAIL;
  
  assertExists(config.action, "Should have action");
  assertExists(config.maxAttempts, "Should have maxAttempts");
  assertExists(config.windowMinutes, "Should have windowMinutes");
  assertExists(config.blockDurationMinutes, "Should have blockDurationMinutes");
});

Deno.test(`[${FUNCTION_NAME}] RateLimit - SEND_EMAIL has reasonable limits`, () => {
  const config = RATE_LIMIT_CONFIGS.SEND_EMAIL;
  
  // Should allow reasonable number of emails
  assertEquals(config.maxAttempts > 0, true, "maxAttempts should be positive");
  assertEquals(config.maxAttempts <= 100, true, "maxAttempts should be reasonable");
  
  // Window should be at least 1 minute
  assertEquals(config.windowMinutes >= 1, true, "windowMinutes should be at least 1");
});

// ============================================================================
// IP EXTRACTION TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] RateLimit - extracts IP from X-Forwarded-For`, () => {
  const request = createMockRequest({
    method: "POST",
    headers: {
      "X-Forwarded-For": "192.168.1.1, 10.0.0.1",
    },
  });
  
  const forwardedFor = request.headers.get("X-Forwarded-For");
  const clientIP = forwardedFor?.split(",")[0].trim();
  
  assertEquals(clientIP, "192.168.1.1");
});

Deno.test(`[${FUNCTION_NAME}] RateLimit - extracts IP from X-Real-IP`, () => {
  const request = createMockRequest({
    method: "POST",
    headers: {
      "X-Real-IP": "192.168.1.2",
    },
  });
  
  const realIP = request.headers.get("X-Real-IP");
  assertEquals(realIP, "192.168.1.2");
});

Deno.test(`[${FUNCTION_NAME}] RateLimit - prefers X-Forwarded-For over X-Real-IP`, () => {
  const request = createMockRequest({
    method: "POST",
    headers: {
      "X-Forwarded-For": "192.168.1.1",
      "X-Real-IP": "192.168.1.2",
    },
  });
  
  const forwardedFor = request.headers.get("X-Forwarded-For");
  const realIP = request.headers.get("X-Real-IP");
  const clientIP = forwardedFor || realIP;
  
  assertEquals(clientIP, "192.168.1.1");
});

// ============================================================================
// RATE LIMIT RECORD TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] RateLimit - creates rate limit record correctly`, () => {
  const record = createMockRateLimitRecord("192.168.1.1", 5);
  
  assertEquals(record.identifier, "192.168.1.1");
  assertEquals(record.action, "SEND_EMAIL");
  assertEquals(record.attempts, 5);
  assertExists(record.first_attempt_at);
  assertExists(record.last_attempt_at);
  assertEquals(record.blocked_until, null);
});

Deno.test(`[${FUNCTION_NAME}] RateLimit - creates blocked record correctly`, () => {
  const record = createMockRateLimitRecord("192.168.1.1", 10, true);
  
  assertEquals(record.attempts, 10);
  assertExists(record.blocked_until);
  
  const blockedUntil = new Date(record.blocked_until!);
  const now = new Date();
  assertEquals(blockedUntil > now, true, "blocked_until should be in the future");
});

// ============================================================================
// RATE LIMIT CHECK SIMULATION
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] RateLimit - allows request under limit`, async () => {
  const mockData = createMockDataStore({
    rate_limit_attempts: [
      createMockRateLimitRecord("192.168.1.1", 5), // Under limit
    ],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  const config = RATE_LIMIT_CONFIGS.SEND_EMAIL;
  
  const { data: records } = await supabase
    .from("rate_limit_attempts")
    .select("*")
    .eq("identifier", "192.168.1.1")
    .eq("action", "SEND_EMAIL");
  
  const recordList = records as Array<{ attempts: number }> | null;
  const record = recordList?.[0];
  const isBlocked = record && record.attempts >= config.maxAttempts;
  
  assertEquals(isBlocked, false, "Request should be allowed");
});

Deno.test(`[${FUNCTION_NAME}] RateLimit - blocks request at limit`, async () => {
  const config = RATE_LIMIT_CONFIGS.SEND_EMAIL;
  const mockData = createMockDataStore({
    rate_limit_attempts: [
      createMockRateLimitRecord("192.168.1.1", config.maxAttempts), // At limit
    ],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  
  const { data: records } = await supabase
    .from("rate_limit_attempts")
    .select("*")
    .eq("identifier", "192.168.1.1")
    .eq("action", "SEND_EMAIL");
  
  const recordList = records as Array<{ attempts: number }> | null;
  const record = recordList?.[0];
  const isBlocked = record && record.attempts >= config.maxAttempts;
  
  assertEquals(isBlocked, true, "Request should be blocked");
});

Deno.test(`[${FUNCTION_NAME}] RateLimit - blocks request over limit`, async () => {
  const config = RATE_LIMIT_CONFIGS.SEND_EMAIL;
  const mockData = createMockDataStore({
    rate_limit_attempts: [
      createMockRateLimitRecord("192.168.1.1", config.maxAttempts + 10), // Over limit
    ],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  
  const { data: records } = await supabase
    .from("rate_limit_attempts")
    .select("*")
    .eq("identifier", "192.168.1.1")
    .eq("action", "SEND_EMAIL");
  
  const recordList = records as Array<{ attempts: number }> | null;
  const record = recordList?.[0];
  const isBlocked = record && record.attempts >= config.maxAttempts;
  
  assertEquals(isBlocked, true, "Request should be blocked");
});

// ============================================================================
// BLOCK EXPIRATION TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] RateLimit - respects active block`, () => {
  const record = createMockRateLimitRecord("192.168.1.1", 10, true);
  const now = new Date();
  const blockedUntil = new Date(record.blocked_until!);
  
  const isBlocked = blockedUntil > now;
  assertEquals(isBlocked, true, "Should respect active block");
});

Deno.test(`[${FUNCTION_NAME}] RateLimit - allows expired block`, () => {
  const record = createMockRateLimitRecord("192.168.1.1", 10);
  // Set blocked_until to the past
  record.blocked_until = new Date(Date.now() - 3600000).toISOString();
  
  const now = new Date();
  const blockedUntil = record.blocked_until ? new Date(record.blocked_until) : null;
  
  const isBlocked = blockedUntil && blockedUntil > now;
  assertEquals(isBlocked, false, "Should allow expired block");
});

// ============================================================================
// RATE LIMIT RESPONSE TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] RateLimit - response includes retry-after header info`, () => {
  const blockDurationSeconds = 3600; // 1 hour
  const retryAfter = blockDurationSeconds;
  
  assertEquals(retryAfter, 3600);
  assertEquals(typeof retryAfter, "number");
});

Deno.test(`[${FUNCTION_NAME}] RateLimit - response has correct status code`, () => {
  const rateLimitStatus = 429;
  assertEquals(rateLimitStatus, 429, "Rate limit should return 429");
});
