/**
 * Test-Deploy Edge Function - Environment Tests
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * @module test-deploy/tests/environment
 */

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type EnvironmentInfo,
  REQUIRED_ENVIRONMENT_FIELDS,
  isValidEnvironmentInfo,
  isValidVersionString,
} from "./_shared.ts";

// ============================================================================
// ENVIRONMENT FIELDS TESTS
// ============================================================================

Deno.test("test-deploy - Environment - has 2 required fields", () => {
  assertEquals(REQUIRED_ENVIRONMENT_FIELDS.length, 2);
});

Deno.test("test-deploy - Environment - deno_version is required", () => {
  assert(REQUIRED_ENVIRONMENT_FIELDS.includes("deno_version"));
});

Deno.test("test-deploy - Environment - typescript_version is required", () => {
  assert(REQUIRED_ENVIRONMENT_FIELDS.includes("typescript_version"));
});

// ============================================================================
// VERSION STRING VALIDATION TESTS
// ============================================================================

Deno.test("test-deploy - Environment - major.minor.patch version is valid", () => {
  assertEquals(isValidVersionString("1.40.0"), true);
});

Deno.test("test-deploy - Environment - major.minor version is valid", () => {
  assertEquals(isValidVersionString("5.3"), true);
});

Deno.test("test-deploy - Environment - double digit versions are valid", () => {
  assertEquals(isValidVersionString("12.34.56"), true);
});

Deno.test("test-deploy - Environment - invalid version fails", () => {
  assertEquals(isValidVersionString("v1.0.0"), false);
});

Deno.test("test-deploy - Environment - text version fails", () => {
  assertEquals(isValidVersionString("latest"), false);
});

Deno.test("test-deploy - Environment - empty string fails", () => {
  assertEquals(isValidVersionString(""), false);
});

// ============================================================================
// ENVIRONMENT INFO STRUCTURE TESTS
// ============================================================================

Deno.test("test-deploy - Environment - valid environment info passes", () => {
  const env: EnvironmentInfo = {
    deno_version: "1.40.0",
    typescript_version: "5.3.3",
  };
  assertEquals(isValidEnvironmentInfo(env), true);
});

Deno.test("test-deploy - Environment - null is not valid environment", () => {
  assertEquals(isValidEnvironmentInfo(null), false);
});

Deno.test("test-deploy - Environment - empty object is not valid", () => {
  assertEquals(isValidEnvironmentInfo({}), false);
});

Deno.test("test-deploy - Environment - missing deno_version is not valid", () => {
  const env = { typescript_version: "5.3.3" };
  assertEquals(isValidEnvironmentInfo(env), false);
});

Deno.test("test-deploy - Environment - missing typescript_version is not valid", () => {
  const env = { deno_version: "1.40.0" };
  assertEquals(isValidEnvironmentInfo(env), false);
});

// ============================================================================
// DENO RUNTIME TESTS
// ============================================================================

Deno.test("test-deploy - Environment - Deno.version.deno exists", () => {
  assert(typeof Deno.version.deno === "string");
  assert(Deno.version.deno.length > 0);
});

Deno.test("test-deploy - Environment - Deno.version.typescript exists", () => {
  assert(typeof Deno.version.typescript === "string");
  assert(Deno.version.typescript.length > 0);
});

Deno.test("test-deploy - Environment - Deno versions are valid format", () => {
  assertEquals(isValidVersionString(Deno.version.deno), true);
  assertEquals(isValidVersionString(Deno.version.typescript), true);
});
