/**
 * Sanitizer Module Unit Tests - Identity & Format
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for CPF, phone, name, UUID, URL, and integer sanitization.
 * Split from sanitizer.test.ts to respect 300-line limit.
 * 
 * @module _shared/sanitizer-identity.test
 */

import {
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  sanitizeCPF,
  sanitizePhone,
  sanitizeName,
  sanitizeUUID,
  sanitizeURL,
  sanitizeInteger,
  sanitizeAmountCents,
} from "./sanitizer.ts";

// ============================================================================
// sanitizeCPF Tests
// ============================================================================

Deno.test("sanitizeCPF: should return empty string for non-string input", () => {
  assertEquals(sanitizeCPF(null), "");
  assertEquals(sanitizeCPF(undefined), "");
  assertEquals(sanitizeCPF(12345678901), "");
});

Deno.test("sanitizeCPF: should extract digits only", () => {
  assertEquals(sanitizeCPF("123.456.789-01"), "12345678901");
  assertEquals(sanitizeCPF("12345678901"), "12345678901");
});

Deno.test("sanitizeCPF: should accept CNPJ (14 digits)", () => {
  assertEquals(sanitizeCPF("12.345.678/0001-90"), "12345678000190");
});

Deno.test("sanitizeCPF: should truncate to 14 digits", () => {
  assertEquals(sanitizeCPF("123456789012345678"), "12345678901234");
});

Deno.test("sanitizeCPF: should handle spaces and special chars", () => {
  assertEquals(sanitizeCPF("123 456 789 01"), "12345678901");
  assertEquals(sanitizeCPF("abc12345678901xyz"), "12345678901");
});

// ============================================================================
// sanitizePhone Tests
// ============================================================================

Deno.test("sanitizePhone: should return empty string for non-string input", () => {
  assertEquals(sanitizePhone(null), "");
  assertEquals(sanitizePhone(undefined), "");
});

Deno.test("sanitizePhone: should extract digits only", () => {
  assertEquals(sanitizePhone("(11) 91234-5678"), "11912345678");
  assertEquals(sanitizePhone("+55 11 91234-5678"), "5511912345678");
});

Deno.test("sanitizePhone: should truncate to 15 digits", () => {
  assertEquals(sanitizePhone("12345678901234567890").length, 15);
});

// ============================================================================
// sanitizeName Tests
// ============================================================================

Deno.test("sanitizeName: should return empty string for non-string input", () => {
  assertEquals(sanitizeName(null), "");
  assertEquals(sanitizeName(undefined), "");
});

Deno.test("sanitizeName: should remove HTML tags", () => {
  const result1 = sanitizeName("<b>John</b> Doe");
  assertEquals(result1.includes("<b>"), false);
  assertEquals(result1.includes("John"), true);
  assertEquals(result1.includes("Doe"), true);
  
  const result2 = sanitizeName("<script>alert(1)</script>Smith");
  assertEquals(result2.includes("<script>"), false);
  assertEquals(result2.includes("Smith"), true);
});

Deno.test("sanitizeName: should preserve letters with accents", () => {
  assertEquals(sanitizeName("José María"), "José María");
  assertEquals(sanitizeName("François Müller"), "François Müller");
});

Deno.test("sanitizeName: should allow hyphens and apostrophes", () => {
  assertEquals(sanitizeName("Mary-Jane O'Connor"), "Mary-Jane O'Connor");
});

Deno.test("sanitizeName: should remove numbers and special chars", () => {
  assertEquals(sanitizeName("John123"), "John");
  assertEquals(sanitizeName("John@Doe!"), "JohnDoe");
});

Deno.test("sanitizeName: should collapse multiple spaces", () => {
  assertEquals(sanitizeName("John    Doe"), "John Doe");
});

Deno.test("sanitizeName: should respect maxLength", () => {
  const result = sanitizeName("a".repeat(300), 50);
  assertEquals(result.length, 50);
});

// ============================================================================
// sanitizeUUID Tests
// ============================================================================

Deno.test("sanitizeUUID: should return null for non-string input", () => {
  assertEquals(sanitizeUUID(null), null);
  assertEquals(sanitizeUUID(undefined), null);
  assertEquals(sanitizeUUID(123), null);
});

Deno.test("sanitizeUUID: should return null for invalid UUID", () => {
  assertEquals(sanitizeUUID("not-a-uuid"), null);
  assertEquals(sanitizeUUID("12345678-1234-1234-1234-12345678901"), null);
  assertEquals(sanitizeUUID("12345678-1234-1234-1234-1234567890123"), null);
});

Deno.test("sanitizeUUID: should accept valid UUID and lowercase", () => {
  assertEquals(
    sanitizeUUID("550E8400-E29B-41D4-A716-446655440000"),
    "550e8400-e29b-41d4-a716-446655440000"
  );
});

Deno.test("sanitizeUUID: should trim whitespace", () => {
  assertEquals(
    sanitizeUUID("  550e8400-e29b-41d4-a716-446655440000  "),
    "550e8400-e29b-41d4-a716-446655440000"
  );
});

// ============================================================================
// sanitizeURL Tests
// ============================================================================

Deno.test("sanitizeURL: should return null for non-string input", () => {
  assertEquals(sanitizeURL(null), null);
  assertEquals(sanitizeURL(undefined), null);
});

Deno.test("sanitizeURL: should return null for invalid URL", () => {
  assertEquals(sanitizeURL("not a url"), null);
  assertEquals(sanitizeURL("ftp://example.com"), null);
  assertEquals(sanitizeURL("javascript:alert(1)"), null);
});

Deno.test("sanitizeURL: should accept valid http URL", () => {
  assertEquals(sanitizeURL("http://example.com"), "http://example.com/");
});

Deno.test("sanitizeURL: should accept valid https URL", () => {
  assertEquals(sanitizeURL("https://example.com/path?query=1"), "https://example.com/path?query=1");
});

Deno.test("sanitizeURL: should trim whitespace", () => {
  assertEquals(sanitizeURL("  https://example.com  "), "https://example.com/");
});

// ============================================================================
// sanitizeInteger Tests
// ============================================================================

Deno.test("sanitizeInteger: should return null for invalid input", () => {
  assertEquals(sanitizeInteger(null), null);
  assertEquals(sanitizeInteger(undefined), null);
  assertEquals(sanitizeInteger("not a number"), null);
  assertEquals(sanitizeInteger({}), null);
});

Deno.test("sanitizeInteger: should accept valid integer", () => {
  assertEquals(sanitizeInteger(42), 42);
  assertEquals(sanitizeInteger("42"), 42);
});

Deno.test("sanitizeInteger: should return null for float", () => {
  assertEquals(sanitizeInteger(42.5), null);
});

Deno.test("sanitizeInteger: should clamp to min value", () => {
  assertEquals(sanitizeInteger(-10, 0, 100), 0);
  assertEquals(sanitizeInteger("-10", 0, 100), 0);
});

Deno.test("sanitizeInteger: should clamp to max value", () => {
  assertEquals(sanitizeInteger(200, 0, 100), 100);
  assertEquals(sanitizeInteger("200", 0, 100), 100);
});

Deno.test("sanitizeInteger: should use default min of 0", () => {
  assertEquals(sanitizeInteger(-5), 0);
});

// ============================================================================
// sanitizeAmountCents Tests
// ============================================================================

Deno.test("sanitizeAmountCents: should return null for invalid input", () => {
  assertEquals(sanitizeAmountCents(null), null);
  assertEquals(sanitizeAmountCents(0), 1); // clamped to min 1
  assertEquals(sanitizeAmountCents(-100), 1); // clamped to min 1
});

Deno.test("sanitizeAmountCents: should accept valid amount", () => {
  assertEquals(sanitizeAmountCents(1000), 1000);
  assertEquals(sanitizeAmountCents("5000"), 5000);
});

Deno.test("sanitizeAmountCents: should clamp to max ~R$10M", () => {
  assertEquals(sanitizeAmountCents(999999999), 999999999);
  assertEquals(sanitizeAmountCents(9999999999), 999999999);
});

// ============================================================================
// Edge Cases
// ============================================================================

Deno.test("Edge Case: empty identity strings", () => {
  assertEquals(sanitizeCPF(""), "");
  assertEquals(sanitizePhone(""), "");
  assertEquals(sanitizeName(""), "");
  assertEquals(sanitizeUUID(""), null);
  assertEquals(sanitizeURL(""), null);
});

Deno.test("Edge Case: XSS in name", () => {
  const result = sanitizeName("<script>alert(1)</script>John");
  assertEquals(result.includes("<script>"), false);
});

Deno.test("Edge Case: javascript protocol in URL", () => {
  assertEquals(sanitizeURL("javascript:alert(1)"), null);
});

Deno.test("Edge Case: unicode in name", () => {
  assertEquals(sanitizeName("João 👋").includes("João"), true);
});
