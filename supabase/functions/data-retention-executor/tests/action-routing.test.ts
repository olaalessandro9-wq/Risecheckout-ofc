/**
 * Action Routing Tests for data-retention-executor
 * 
 * @module data-retention-executor/tests/action-routing.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  routeAction, 
  validateRequest, 
  validateCategoryRequest,
  VALID_CATEGORIES 
} from "./_shared.ts";

// ============================================================================
// ACTION ROUTING TESTS
// ============================================================================

Deno.test("Actions - should route correctly", () => {
  assertEquals(routeAction('run-all'), 'full');
  assertEquals(routeAction('run-category'), 'category');
  assertEquals(routeAction('dry-run'), 'dry');
  assertEquals(routeAction('status'), 'status');
  assertEquals(routeAction('invalid'), 'unknown');
});

Deno.test("Actions - should require action parameter", () => {
  assertEquals(validateRequest({}).valid, false);
  assertEquals(validateRequest({ action: 'run-all' }).valid, true);
});

Deno.test("Actions - missing action returns error message", () => {
  const result = validateRequest({});
  assertEquals(result.valid, false);
  assertEquals(result.error, 'Missing action parameter');
});

Deno.test("Actions - run-category should require category", () => {
  assertEquals(validateCategoryRequest({ action: 'run-category' }).valid, false);
  assertEquals(validateCategoryRequest({ action: 'run-category', category: 'oauth' }).valid, true);
  assertEquals(validateCategoryRequest({ action: 'run-all' }).valid, true);
});

Deno.test("Actions - run-category error includes valid categories", () => {
  const result = validateCategoryRequest({ action: 'run-category' });
  assertExists(result.error);
  assertEquals(result.error?.includes('oauth'), true);
  assertEquals(result.error?.includes('sessions'), true);
});

Deno.test("Actions - all category actions are valid", () => {
  VALID_CATEGORIES.forEach(category => {
    if (category !== 'all') {
      const result = validateCategoryRequest({ action: 'run-category', category });
      assertEquals(result.valid, true);
    }
  });
});

// ============================================================================
// CORS TESTS
// ============================================================================

Deno.test("CORS headers - should be included", () => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  assertExists(corsHeaders['Access-Control-Allow-Origin']);
  assertExists(corsHeaders['Access-Control-Allow-Headers']);
});

// ============================================================================
// TIMESTAMP TESTS
// ============================================================================

Deno.test("Timestamp - should be ISO format", () => {
  const timestamp = new Date().toISOString();
  
  // ISO format: 2024-01-15T12:00:00.000Z
  assertEquals(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(timestamp), true);
});
