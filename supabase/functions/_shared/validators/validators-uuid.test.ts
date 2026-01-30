/**
 * UUID Validators Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for UUID validation functions.
 * 
 * @module _shared/validators/validators-uuid.test
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidUUID, isValidUUIDArray } from "../validators.ts";

// ============================================================================
// isValidUUID Tests (10 tests)
// ============================================================================

Deno.test("isValidUUID: should accept valid UUID v4", () => {
  assertEquals(isValidUUID("550e8400-e29b-41d4-a716-446655440000"), true);
});

Deno.test("isValidUUID: should accept valid UUID v1", () => {
  assertEquals(isValidUUID("f47ac10b-58cc-1e77-a8b2-123456789abc"), true);
});

Deno.test("isValidUUID: should accept lowercase UUID", () => {
  assertEquals(isValidUUID("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"), true);
});

Deno.test("isValidUUID: should accept uppercase UUID", () => {
  assertEquals(isValidUUID("A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D"), true);
});

Deno.test("isValidUUID: should reject invalid format", () => {
  assertEquals(isValidUUID("not-a-valid-uuid"), false);
});

Deno.test("isValidUUID: should reject empty string", () => {
  assertEquals(isValidUUID(""), false);
});

Deno.test("isValidUUID: should reject null", () => {
  assertEquals(isValidUUID(null), false);
});

Deno.test("isValidUUID: should reject undefined", () => {
  assertEquals(isValidUUID(undefined), false);
});

Deno.test("isValidUUID: should reject number", () => {
  assertEquals(isValidUUID(12345), false);
});

Deno.test("isValidUUID: should reject UUID without hyphens", () => {
  assertEquals(isValidUUID("550e8400e29b41d4a716446655440000"), false);
});

// ============================================================================
// isValidUUIDArray Tests (6 tests)
// ============================================================================

Deno.test("isValidUUIDArray: should accept array of valid UUIDs", () => {
  const uuids = [
    "550e8400-e29b-41d4-a716-446655440000",
    "f47ac10b-58cc-4e77-a8b2-123456789abc",
  ];
  assertEquals(isValidUUIDArray(uuids), true);
});

Deno.test("isValidUUIDArray: should accept empty array", () => {
  assertEquals(isValidUUIDArray([]), true);
});

Deno.test("isValidUUIDArray: should accept single UUID array", () => {
  assertEquals(isValidUUIDArray(["550e8400-e29b-41d4-a716-446655440000"]), true);
});

Deno.test("isValidUUIDArray: should reject array with invalid UUID", () => {
  const uuids = [
    "550e8400-e29b-41d4-a716-446655440000",
    "not-a-uuid",
  ];
  assertEquals(isValidUUIDArray(uuids), false);
});

Deno.test("isValidUUIDArray: should reject non-array", () => {
  assertEquals(isValidUUIDArray("not-an-array"), false);
});

Deno.test("isValidUUIDArray: should reject null", () => {
  assertEquals(isValidUUIDArray(null), false);
});
