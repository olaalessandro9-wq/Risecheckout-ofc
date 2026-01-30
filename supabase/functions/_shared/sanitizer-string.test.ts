/**
 * Sanitizer Module Unit Tests - String & Email
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for string and email sanitization functions.
 * Split from sanitizer.test.ts to respect 300-line limit.
 * 
 * @module _shared/sanitizer-string.test
 */

import {
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  sanitizeString,
  sanitizeEmail,
} from "./sanitizer.ts";

// ============================================================================
// sanitizeString Tests
// ============================================================================

Deno.test("sanitizeString: should return empty string for non-string input", () => {
  assertEquals(sanitizeString(null), "");
  assertEquals(sanitizeString(undefined), "");
  assertEquals(sanitizeString(123), "");
  assertEquals(sanitizeString({}), "");
  assertEquals(sanitizeString([]), "");
});

Deno.test("sanitizeString: should trim whitespace", () => {
  assertEquals(sanitizeString("  hello  "), "hello");
  assertEquals(sanitizeString("\n\thello\t\n"), "hello");
});

Deno.test("sanitizeString: should remove null bytes", () => {
  assertEquals(sanitizeString("hello\0world"), "helloworld");
});

Deno.test("sanitizeString: should remove HTML tags", () => {
  const result1 = sanitizeString("<script>alert('xss')</script>");
  assertEquals(result1.includes("<script>"), false);
  assertEquals(result1.includes("alert"), true);
  
  const result2 = sanitizeString("<div>hello</div>");
  assertEquals(result2.includes("<div>"), false);
  assertEquals(result2.includes("hello"), true);
  
  const result3 = sanitizeString("<img src='x' onerror='alert(1)'>");
  assertEquals(result3.includes("<img"), false);
});

Deno.test("sanitizeString: should escape HTML entities", () => {
  const result = sanitizeString("5 > 3 & 2 < 4");
  assertEquals(result.includes("&amp;"), true);
  assertEquals(result.includes("&lt;"), true);
  assertEquals(result.includes("&gt;"), true);
});

Deno.test("sanitizeString: should escape quotes", () => {
  const result = sanitizeString('He said "hello" and \'goodbye\'');
  assertEquals(result.includes("&quot;"), true);
  assertEquals(result.includes("&#x27;"), true);
});

Deno.test("sanitizeString: should remove control characters", () => {
  const input = "hello\x00\x01\x02\x03\x04world";
  const result = sanitizeString(input);
  assertEquals(result.includes("\x00"), false);
  assertEquals(result.includes("\x01"), false);
});

Deno.test("sanitizeString: should preserve newline and tab", () => {
  const result = sanitizeString("hello\nworld\ttab");
  assertEquals(result.includes("\n"), true);
  assertEquals(result.includes("\t"), true);
});

Deno.test("sanitizeString: should respect maxLength", () => {
  const result = sanitizeString("a".repeat(2000), 100);
  assertEquals(result.length, 100);
});

Deno.test("sanitizeString: should use default maxLength of 1000", () => {
  const result = sanitizeString("a".repeat(2000));
  assertEquals(result.length, 1000);
});

// ============================================================================
// sanitizeEmail Tests
// ============================================================================

Deno.test("sanitizeEmail: should return empty string for non-string input", () => {
  assertEquals(sanitizeEmail(null), "");
  assertEquals(sanitizeEmail(undefined), "");
  assertEquals(sanitizeEmail(123), "");
});

Deno.test("sanitizeEmail: should lowercase email", () => {
  assertEquals(sanitizeEmail("USER@EXAMPLE.COM"), "user@example.com");
});

Deno.test("sanitizeEmail: should trim whitespace", () => {
  assertEquals(sanitizeEmail("  user@example.com  "), "user@example.com");
});

Deno.test("sanitizeEmail: should remove invalid characters", () => {
  assertEquals(sanitizeEmail("user<script>@example.com"), "userscript@example.com");
  assertEquals(sanitizeEmail("user'OR'1'='1@example.com"), "useror11@example.com");
});

Deno.test("sanitizeEmail: should preserve valid email characters", () => {
  assertEquals(sanitizeEmail("user.name+tag@example.com"), "user.name+tag@example.com");
  assertEquals(sanitizeEmail("user-name@example-domain.com"), "user-name@example-domain.com");
});

Deno.test("sanitizeEmail: should limit to 255 characters", () => {
  const longEmail = "a".repeat(300) + "@example.com";
  const result = sanitizeEmail(longEmail);
  assertEquals(result.length, 255);
});

// ============================================================================
// XSS & SQL Prevention Tests (String specific)
// ============================================================================

Deno.test("XSS Prevention: script injection in string", () => {
  const result = sanitizeString("<script>alert('XSS')</script>");
  assertEquals(result.includes("<script>"), false);
  assertEquals(result.includes("</script>"), false);
});

Deno.test("XSS Prevention: event handler injection", () => {
  const result = sanitizeString('<img src="x" onerror="alert(1)">');
  assertEquals(result.includes("onerror"), false);
});

Deno.test("SQL Injection Prevention: quotes in email", () => {
  const result = sanitizeEmail("user'--@example.com");
  assertEquals(result.includes("'"), false);
});

Deno.test("SQL Injection Prevention: semicolon in string", () => {
  const result = sanitizeString("'; DROP TABLE users; --");
  assertEquals(result.includes("'"), false);
});

Deno.test("Edge Case: empty strings", () => {
  assertEquals(sanitizeString(""), "");
  assertEquals(sanitizeEmail(""), "");
});

Deno.test("Edge Case: unicode in string", () => {
  assertEquals(sanitizeString("Hello 世界 🌍").includes("世界"), true);
});

Deno.test("Edge Case: very long string", () => {
  const longInput = "a".repeat(10000);
  assertEquals(sanitizeString(longInput).length, 1000);
});
