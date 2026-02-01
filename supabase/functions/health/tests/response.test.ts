/**
 * Health Edge Function - Response Structure Tests
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * @module health/tests/response
 */

import { assertEquals, assert, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type HealthResponse,
  SERVICE_NAMES,
  VALID_SERVICE_STATUSES,
  isValidHealthResponse,
  parseResponseTimeMs,
} from "./_shared.ts";

// ============================================================================
// RESPONSE STRUCTURE TESTS
// ============================================================================

Deno.test("health - Response - valid OK response structure", () => {
  const response: HealthResponse = {
    status: "OK",
    timestamp: new Date().toISOString(),
    services: {
      database: "healthy",
      edgeFunction: "healthy",
    },
    responseTime: "50ms",
  };

  assertEquals(isValidHealthResponse(response), true);
});

Deno.test("health - Response - services object contains required keys", () => {
  assertEquals(SERVICE_NAMES.length, 2);
  assert(SERVICE_NAMES.includes("database"));
  assert(SERVICE_NAMES.includes("edgeFunction"));
});

Deno.test("health - Response - valid service statuses", () => {
  assertEquals(VALID_SERVICE_STATUSES.length, 2);
  assert(VALID_SERVICE_STATUSES.includes("healthy"));
  assert(VALID_SERVICE_STATUSES.includes("unhealthy"));
});

// ============================================================================
// RESPONSE TIME PARSING TESTS
// ============================================================================

Deno.test("health - Response - parseResponseTimeMs extracts milliseconds", () => {
  assertEquals(parseResponseTimeMs("123ms"), 123);
});

Deno.test("health - Response - parseResponseTimeMs handles zero", () => {
  assertEquals(parseResponseTimeMs("0ms"), 0);
});

Deno.test("health - Response - parseResponseTimeMs handles large values", () => {
  assertEquals(parseResponseTimeMs("9999ms"), 9999);
});

Deno.test("health - Response - parseResponseTimeMs returns -1 for invalid", () => {
  assertEquals(parseResponseTimeMs("invalid"), -1);
});

// ============================================================================
// INVALID RESPONSE TESTS
// ============================================================================

Deno.test("health - Response - null is not valid response", () => {
  assertEquals(isValidHealthResponse(null), false);
});

Deno.test("health - Response - empty object is not valid response", () => {
  assertEquals(isValidHealthResponse({}), false);
});

Deno.test("health - Response - missing status is not valid", () => {
  const response = {
    timestamp: new Date().toISOString(),
    services: { database: "healthy", edgeFunction: "healthy" },
    responseTime: "50ms",
  };
  assertEquals(isValidHealthResponse(response), false);
});

Deno.test("health - Response - invalid status value is not valid", () => {
  const response = {
    status: "INVALID",
    timestamp: new Date().toISOString(),
    services: { database: "healthy", edgeFunction: "healthy" },
    responseTime: "50ms",
  };
  assertEquals(isValidHealthResponse(response), false);
});
