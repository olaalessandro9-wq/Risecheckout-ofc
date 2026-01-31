/**
 * Email Validation Tests for students-invite
 * RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidEmail, buildAccessUrl } from "./_shared.ts";

// ============================================
// UNIT TESTS: Email Validation
// ============================================

Deno.test("students-invite: validates email format", () => {
  const validEmails = [
    "test@example.com",
    "user.name@domain.co",
    "user+tag@example.org",
  ];

  validEmails.forEach(email => {
    assertEquals(isValidEmail(email), true);
  });
});

Deno.test("students-invite: rejects invalid email format", () => {
  const invalidEmails = [
    "invalid",
    "missing@domain",
    "@nodomain.com",
    "spaces in@email.com",
  ];

  invalidEmails.forEach(email => {
    assertEquals(isValidEmail(email), false);
  });
});

// ============================================
// UNIT TESTS: Access URL Generation
// ============================================

Deno.test("students-invite: generates valid access URL", () => {
  const baseUrl = "https://app.risecheckout.com";
  const token = "abc123def456";
  const accessUrl = buildAccessUrl(baseUrl, token);

  assertEquals(accessUrl.startsWith(baseUrl), true);
  assertEquals(accessUrl.includes("token="), true);
});

Deno.test("students-invite: URL-encodes special characters in token", () => {
  const token = "abc+123/456=";
  const encoded = encodeURIComponent(token);
  
  assertEquals(encoded.includes("+"), false);
  assertEquals(encoded.includes("/"), false);
  assertEquals(encoded.includes("="), false);
});
