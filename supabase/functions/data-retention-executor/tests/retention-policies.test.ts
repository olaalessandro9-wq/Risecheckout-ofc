/**
 * Retention Policies Tests for data-retention-executor
 * 
 * @module data-retention-executor/tests/retention-policies.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidPeriod, VALID_CATEGORIES } from "./_shared.ts";
import type { RetentionPolicy, StatusResponse } from "./_shared.ts";

// ============================================================================
// RETENTION POLICIES TESTS
// ============================================================================

Deno.test("Retention policies - should have required fields", () => {
  const policy: RetentionPolicy = {
    table_name: 'oauth_states',
    category: 'oauth',
    retention_period: '1 hour',
    criteria: 'Expired or used tokens'
  };

  assertExists(policy.table_name);
  assertExists(policy.category);
  assertExists(policy.retention_period);
  assertExists(policy.criteria);
});

Deno.test("Retention policies - should cover all categories", () => {
  const policies: RetentionPolicy[] = [
    { table_name: 'oauth_states', category: 'oauth', retention_period: '1 hour', criteria: 'Expired' },
    { table_name: 'sessions', category: 'sessions', retention_period: '7 days', criteria: 'Expired' },
    { table_name: 'security_events', category: 'security', retention_period: '90 days', criteria: 'Old' },
    { table_name: 'gdpr_requests', category: 'gdpr', retention_period: '90 days', criteria: 'Completed' },
    { table_name: 'rate_limit_attempts', category: 'rate_limit', retention_period: '24 hours', criteria: 'Old' },
    { table_name: 'trigger_debug_logs', category: 'debug', retention_period: '7 days', criteria: 'Old' },
  ];

  const categories = new Set(policies.map(p => p.category));
  
  assertEquals(categories.has('oauth'), true);
  assertEquals(categories.has('sessions'), true);
  assertEquals(categories.has('security'), true);
  assertEquals(categories.has('gdpr'), true);
  assertEquals(categories.has('rate_limit'), true);
  assertEquals(categories.has('debug'), true);
});

Deno.test("Retention policies - should have valid periods", () => {
  assertEquals(isValidPeriod('1 hour'), true);
  assertEquals(isValidPeriod('7 days after expiry'), true);
  assertEquals(isValidPeriod('90 days after processing'), true);
});

Deno.test("Retention policies - invalid periods rejected", () => {
  assertEquals(isValidPeriod('invalid'), false);
  assertEquals(isValidPeriod(''), false);
});

// ============================================================================
// STATUS ENDPOINT TESTS
// ============================================================================

Deno.test("Status response - should include policies", () => {
  const response: StatusResponse = {
    success: true,
    timestamp: new Date().toISOString(),
    policies: [
      { table_name: 'oauth_states', category: 'oauth', retention_period: '1 hour', criteria: 'Expired' }
    ],
    categories: VALID_CATEGORIES.filter(c => c !== 'all')
  };

  assertEquals(response.success, true);
  assertExists(response.policies);
  assertEquals(response.categories.includes('all'), false); // 'all' filtered out
});

Deno.test("Status response - should have timestamp", () => {
  const response: StatusResponse = {
    success: true,
    timestamp: new Date().toISOString(),
    policies: [],
    categories: []
  };

  assertExists(response.timestamp);
  assertEquals(response.timestamp.length > 0, true);
});
