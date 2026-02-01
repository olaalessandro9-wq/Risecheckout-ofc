/**
 * Email Validators Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for email validation functions.
 * 
 * @module _shared/validators/validators-email.test
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidEmail } from "../validators.ts";

// ============================================================================
// isValidEmail Tests (11 tests)
// ============================================================================

Deno.test("isValidEmail: should accept valid email", () => {
  assertEquals(isValidEmail("user@example.com"), true);
});

Deno.test("isValidEmail: should accept email with subdomain", () => {
  assertEquals(isValidEmail("user@mail.example.com"), true);
});

Deno.test("isValidEmail: should accept email with plus sign", () => {
  assertEquals(isValidEmail("user+tag@example.com"), true);
});

Deno.test("isValidEmail: should accept email with dots", () => {
  assertEquals(isValidEmail("first.last@example.com"), true);
});

Deno.test("isValidEmail: should accept email with numbers", () => {
  assertEquals(isValidEmail("user123@example.com"), true);
});

Deno.test("isValidEmail: should reject email without @", () => {
  assertEquals(isValidEmail("userexample.com"), false);
});

Deno.test("isValidEmail: should reject email without domain", () => {
  assertEquals(isValidEmail("user@"), false);
});

Deno.test("isValidEmail: should reject email without TLD", () => {
  assertEquals(isValidEmail("user@example"), false);
});

Deno.test("isValidEmail: should reject empty string", () => {
  assertEquals(isValidEmail(""), false);
});

Deno.test("isValidEmail: should reject null", () => {
  assertEquals(isValidEmail(null), false);
});

Deno.test("isValidEmail: should reject very long email (> 255 chars)", () => {
  const longEmail = "a".repeat(250) + "@example.com";
  assertEquals(isValidEmail(longEmail), false);
});

// ============================================================================
// RFC 5321 Compliance Tests (Consecutive Dots)
// ============================================================================

Deno.test("isValidEmail: should reject consecutive dots in local part", () => {
  assertEquals(isValidEmail("test..test@example.com"), false);
});

Deno.test("isValidEmail: should reject consecutive dots in domain", () => {
  assertEquals(isValidEmail("test@example..com"), false);
});

Deno.test("isValidEmail: should reject leading dot in local part", () => {
  assertEquals(isValidEmail(".test@example.com"), false);
});

Deno.test("isValidEmail: should reject trailing dot in local part", () => {
  assertEquals(isValidEmail("test.@example.com"), false);
});

Deno.test("isValidEmail: should accept single dot in local part", () => {
  assertEquals(isValidEmail("first.last@example.com"), true);
});

Deno.test("isValidEmail: should accept multiple single dots in local part", () => {
  assertEquals(isValidEmail("first.middle.last@example.com"), true);
});
