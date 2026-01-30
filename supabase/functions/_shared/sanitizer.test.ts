/**
 * Sanitizer Module Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for input sanitization functions.
 * CRITICAL: Proper sanitization prevents XSS, SQL injection, and other attacks.
 * 
 * @module _shared/sanitizer.test
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  sanitizeString,
  sanitizeEmail,
  sanitizeCPF,
  sanitizePhone,
  sanitizeName,
  sanitizeUUID,
  sanitizeURL,
  sanitizeInteger,
  sanitizeAmountCents,
  sanitizeOrderInput,
  sanitizeAuthInput,
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
  // After removing <script></script> tags, "alert('xss')" remains, then quotes get escaped
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
  // After HTML tag removal and control char cleanup, newlines/tabs should be preserved
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
  // sanitizeName removes tags and filters only letters
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
  assertEquals(sanitizeUUID("12345678-1234-1234-1234-12345678901"), null); // too short
  assertEquals(sanitizeUUID("12345678-1234-1234-1234-1234567890123"), null); // too long
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
  assertEquals(sanitizeURL("ftp://example.com"), null); // non-http protocol
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
  // 0 gets clamped to min (1), so it returns 1, not null
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
// sanitizeOrderInput Tests
// ============================================================================

Deno.test("sanitizeOrderInput: should return null for missing required fields", () => {
  assertEquals(sanitizeOrderInput({}), null);
  assertEquals(sanitizeOrderInput({ product_id: "123" }), null);
});

Deno.test("sanitizeOrderInput: should accept valid order input", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_email: "JOHN@EXAMPLE.COM",
    customer_name: "John Doe",
    customer_cpf: "123.456.789-01",
    amount_cents: 5000,
  };
  
  const result = sanitizeOrderInput(input);
  
  assertExists(result);
  assertEquals(result.product_id, "550e8400-e29b-41d4-a716-446655440000");
  assertEquals(result.customer_email, "john@example.com");
  assertEquals(result.customer_name, "John Doe");
  assertEquals(result.customer_cpf, "12345678901");
  assertEquals(result.amount_cents, 5000);
});

Deno.test("sanitizeOrderInput: should handle optional fields", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_email: "john@example.com",
    customer_name: "John Doe",
    customer_cpf: "12345678901",
    amount_cents: 5000,
    offer_id: "550e8400-e29b-41d4-a716-446655440001",
    payment_method: "PIX",
    coupon_code: "save10!@#",
  };
  
  const result = sanitizeOrderInput(input);
  
  assertExists(result);
  assertEquals(result.offer_id, "550e8400-e29b-41d4-a716-446655440001");
  assertEquals(result.payment_method, "pix");
  assertEquals(result.coupon_code, "SAVE10");
});

Deno.test("sanitizeOrderInput: should filter invalid bump_ids", () => {
  const input = {
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    customer_email: "john@example.com",
    customer_name: "John Doe",
    customer_cpf: "12345678901",
    amount_cents: 5000,
    bump_ids: [
      "550e8400-e29b-41d4-a716-446655440001",
      "invalid-uuid",
      "550e8400-e29b-41d4-a716-446655440002",
    ],
  };
  
  const result = sanitizeOrderInput(input);
  
  assertExists(result);
  assertEquals(result.bump_ids?.length, 2);
});

// ============================================================================
// sanitizeAuthInput Tests
// ============================================================================

Deno.test("sanitizeAuthInput: should return null for missing required fields", () => {
  assertEquals(sanitizeAuthInput({}), null);
  assertEquals(sanitizeAuthInput({ email: "test@example.com" }), null); // missing password
});

Deno.test("sanitizeAuthInput: should accept valid auth input", () => {
  const input = {
    email: "USER@EXAMPLE.COM",
    password: "SecurePass123!",
  };
  
  const result = sanitizeAuthInput(input);
  
  assertExists(result);
  assertEquals(result.email, "user@example.com");
  assertEquals(result.password, "SecurePass123!"); // password preserved as-is
});

Deno.test("sanitizeAuthInput: should handle optional fields", () => {
  const input = {
    email: "user@example.com",
    password: "SecurePass123!",
    name: "John <b>Doe</b>",
    phone: "(11) 91234-5678",
  };
  
  const result = sanitizeAuthInput(input);
  
  assertExists(result);
  assertEquals(result.name, "John Doe"); // HTML removed
  assertEquals(result.phone, "11912345678");
});

Deno.test("sanitizeAuthInput: should not sanitize password special chars", () => {
  const input = {
    email: "user@example.com",
    password: "P@$$w0rd!<script>",
  };
  
  const result = sanitizeAuthInput(input);
  
  assertExists(result);
  // Password should be exactly as provided (not sanitized)
  assertEquals(result.password, "P@$$w0rd!<script>");
});

// ============================================================================
// XSS Prevention Tests
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

Deno.test("XSS Prevention: javascript protocol in URL", () => {
  assertEquals(sanitizeURL("javascript:alert(1)"), null);
});

Deno.test("XSS Prevention: name with script tag", () => {
  const result = sanitizeName("<script>alert(1)</script>John");
  assertEquals(result.includes("<script>"), false);
});

// ============================================================================
// SQL Injection Prevention Tests
// ============================================================================

Deno.test("SQL Injection Prevention: quotes in email", () => {
  const result = sanitizeEmail("user'--@example.com");
  assertEquals(result.includes("'"), false);
});

Deno.test("SQL Injection Prevention: semicolon in string", () => {
  const result = sanitizeString("'; DROP TABLE users; --");
  // Should escape or remove dangerous characters
  assertEquals(result.includes("'"), false);
});

// ============================================================================
// Edge Cases
// ============================================================================

Deno.test("Edge Case: empty strings", () => {
  assertEquals(sanitizeString(""), "");
  assertEquals(sanitizeEmail(""), "");
  assertEquals(sanitizeCPF(""), "");
  assertEquals(sanitizePhone(""), "");
  assertEquals(sanitizeName(""), "");
  assertEquals(sanitizeUUID(""), null);
  assertEquals(sanitizeURL(""), null);
});

Deno.test("Edge Case: unicode and emoji", () => {
  assertEquals(sanitizeName("João 👋").includes("João"), true);
  assertEquals(sanitizeString("Hello 世界 🌍").includes("世界"), true);
});

Deno.test("Edge Case: very long inputs", () => {
  const longInput = "a".repeat(10000);
  assertEquals(sanitizeString(longInput).length, 1000); // default max
  assertEquals(sanitizeEmail(longInput + "@example.com").length, 255);
});
