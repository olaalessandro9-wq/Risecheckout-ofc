/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for Format Utilities
 * 
 * Coverage:
 * - Email validation
 * - CPF validation
 * - CNPJ validation
 * - Currency formatting
 * - Document formatting
 * - String sanitization
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  isValidEmail,
  isValidCPF,
  isValidCNPJ,
  formatCentsToBRL,
  formatDocument,
  sanitizeString,
} from "./format-utils.ts";

// ============================================================================
// EMAIL VALIDATION TESTS
// ============================================================================

Deno.test("isValidEmail - should validate correct email format", () => {
  assertEquals(isValidEmail("user@example.com"), true);
  assertEquals(isValidEmail("test.user@domain.com"), true);
  assertEquals(isValidEmail("user+tag@example.co.uk"), true);
});

Deno.test("isValidEmail - should reject invalid email formats", () => {
  assertEquals(isValidEmail("invalid"), false);
  assertEquals(isValidEmail("@example.com"), false);
  assertEquals(isValidEmail("user@"), false);
  assertEquals(isValidEmail("user@domain"), false);
  assertEquals(isValidEmail(""), false);
  assertEquals(isValidEmail("user @example.com"), false);
});

// ============================================================================
// CPF VALIDATION TESTS
// ============================================================================

Deno.test("isValidCPF - should validate correct CPF with formatting", () => {
  assertEquals(isValidCPF("123.456.789-09"), true);
  assertEquals(isValidCPF("111.444.777-35"), true);
});

Deno.test("isValidCPF - should validate correct CPF without formatting", () => {
  assertEquals(isValidCPF("12345678909"), true);
  assertEquals(isValidCPF("11144477735"), true);
});

Deno.test("isValidCPF - should reject CPF with invalid length", () => {
  assertEquals(isValidCPF("123"), false);
  assertEquals(isValidCPF("123456789"), false);
  assertEquals(isValidCPF("123456789012"), false);
});

Deno.test("isValidCPF - should reject CPF with all same digits", () => {
  assertEquals(isValidCPF("11111111111"), false);
  assertEquals(isValidCPF("00000000000"), false);
  assertEquals(isValidCPF("999.999.999-99"), false);
});

Deno.test("isValidCPF - should reject CPF with invalid check digits", () => {
  assertEquals(isValidCPF("123.456.789-00"), false);
  assertEquals(isValidCPF("111.444.777-00"), false);
});

// ============================================================================
// CNPJ VALIDATION TESTS
// ============================================================================

Deno.test("isValidCNPJ - should validate correct CNPJ with formatting", () => {
  assertEquals(isValidCNPJ("12.345.678/0001-90"), true);
});

Deno.test("isValidCNPJ - should validate correct CNPJ without formatting", () => {
  assertEquals(isValidCNPJ("12345678000190"), true);
});

Deno.test("isValidCNPJ - should reject CNPJ with invalid length", () => {
  assertEquals(isValidCNPJ("123"), false);
  assertEquals(isValidCNPJ("12345678000"), false);
  assertEquals(isValidCNPJ("123456780001901"), false);
});

Deno.test("isValidCNPJ - should reject CNPJ with all same digits", () => {
  assertEquals(isValidCNPJ("11111111111111"), false);
  assertEquals(isValidCNPJ("00000000000000"), false);
});

// ============================================================================
// CURRENCY FORMATTING TESTS
// ============================================================================

Deno.test("formatCentsToBRL - should format cents to BRL currency", () => {
  assertEquals(formatCentsToBRL(10000), "R$ 100,00");
  assertEquals(formatCentsToBRL(1550), "R$ 15,50");
  assertEquals(formatCentsToBRL(99), "R$ 0,99");
});

Deno.test("formatCentsToBRL - should handle zero value", () => {
  assertEquals(formatCentsToBRL(0), "R$ 0,00");
});

Deno.test("formatCentsToBRL - should handle large values", () => {
  const result = formatCentsToBRL(123456789);
  assertExists(result);
  assertEquals(result.includes("R$"), true);
});

// ============================================================================
// DOCUMENT FORMATTING TESTS
// ============================================================================

Deno.test("formatDocument - should format CPF correctly", () => {
  assertEquals(formatDocument("12345678909"), "123.456.789-09");
  assertEquals(formatDocument("111.444.777-35"), "111.444.777-35");
});

Deno.test("formatDocument - should format CNPJ correctly", () => {
  assertEquals(formatDocument("12345678000190"), "12.345.678/0001-90");
  assertEquals(formatDocument("12.345.678/0001-90"), "12.345.678/0001-90");
});

Deno.test("formatDocument - should return cleaned string for invalid length", () => {
  assertEquals(formatDocument("123"), "123");
  assertEquals(formatDocument("12345"), "12345");
});

Deno.test("formatDocument - should remove non-digit characters", () => {
  assertEquals(formatDocument("123-456-789-09"), "123.456.789-09");
  assertEquals(formatDocument("12.345.678/0001-90"), "12.345.678/0001-90");
});

// ============================================================================
// STRING SANITIZATION TESTS
// ============================================================================

Deno.test("sanitizeString - should trim whitespace", () => {
  assertEquals(sanitizeString("  hello  "), "hello");
  assertEquals(sanitizeString("\n\ttest\n\t"), "test");
});

Deno.test("sanitizeString - should remove dangerous characters", () => {
  assertEquals(sanitizeString("<script>alert('xss')</script>"), "scriptalert('xss')/script");
  assertEquals(sanitizeString("Hello <div>World</div>"), "Hello divWorld/div");
});

Deno.test("sanitizeString - should limit string length to 1000 characters", () => {
  const longString = "a".repeat(1500);
  const result = sanitizeString(longString);
  assertEquals(result.length, 1000);
});

Deno.test("sanitizeString - should handle empty string", () => {
  assertEquals(sanitizeString(""), "");
  assertEquals(sanitizeString("   "), "");
});

Deno.test("sanitizeString - should preserve safe content", () => {
  assertEquals(sanitizeString("Hello World 123"), "Hello World 123");
  assertEquals(sanitizeString("user@example.com"), "user@example.com");
});
