/**
 * IPv4 Validators Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Comprehensive tests for IPv4 address validation.
 * RFC 791 compliant validation.
 * 
 * @module _shared/validators/validators-ipv4.test
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidIPv4 } from "../validators.ts";

// ============================================================================
// Valid IPv4 Addresses
// ============================================================================

Deno.test("isValidIPv4: should accept standard private IP", () => {
  assertEquals(isValidIPv4("192.168.1.1"), true);
});

Deno.test("isValidIPv4: should accept localhost", () => {
  assertEquals(isValidIPv4("127.0.0.1"), true);
});

Deno.test("isValidIPv4: should accept minimum IP (all zeros)", () => {
  assertEquals(isValidIPv4("0.0.0.0"), true);
});

Deno.test("isValidIPv4: should accept maximum IP (all 255)", () => {
  assertEquals(isValidIPv4("255.255.255.255"), true);
});

Deno.test("isValidIPv4: should accept Class A private range", () => {
  assertEquals(isValidIPv4("10.0.0.1"), true);
});

Deno.test("isValidIPv4: should accept Class B private range", () => {
  assertEquals(isValidIPv4("172.16.0.1"), true);
});

Deno.test("isValidIPv4: should accept public IP", () => {
  assertEquals(isValidIPv4("8.8.8.8"), true);
});

Deno.test("isValidIPv4: should accept edge case 0.0.0.255", () => {
  assertEquals(isValidIPv4("0.0.0.255"), true);
});

Deno.test("isValidIPv4: should accept edge case 255.0.0.0", () => {
  assertEquals(isValidIPv4("255.0.0.0"), true);
});

// ============================================================================
// Invalid IPv4 Addresses - Octet Range
// ============================================================================

Deno.test("isValidIPv4: should reject octets > 255", () => {
  assertEquals(isValidIPv4("999.999.999.999"), false);
});

Deno.test("isValidIPv4: should reject single octet > 255", () => {
  assertEquals(isValidIPv4("192.168.1.256"), false);
});

Deno.test("isValidIPv4: should reject first octet > 255", () => {
  assertEquals(isValidIPv4("256.168.1.1"), false);
});

Deno.test("isValidIPv4: should reject 300 as octet", () => {
  assertEquals(isValidIPv4("192.300.1.1"), false);
});

// ============================================================================
// Invalid IPv4 Addresses - Structure
// ============================================================================

Deno.test("isValidIPv4: should reject empty string", () => {
  assertEquals(isValidIPv4(""), false);
});

Deno.test("isValidIPv4: should reject incomplete IP (3 octets)", () => {
  assertEquals(isValidIPv4("192.168.1"), false);
});

Deno.test("isValidIPv4: should reject incomplete IP (2 octets)", () => {
  assertEquals(isValidIPv4("192.168"), false);
});

Deno.test("isValidIPv4: should reject incomplete IP (1 octet)", () => {
  assertEquals(isValidIPv4("192"), false);
});

Deno.test("isValidIPv4: should reject too many octets (5)", () => {
  assertEquals(isValidIPv4("192.168.1.1.1"), false);
});

Deno.test("isValidIPv4: should reject text string", () => {
  assertEquals(isValidIPv4("invalid"), false);
});

Deno.test("isValidIPv4: should reject hostname", () => {
  assertEquals(isValidIPv4("localhost"), false);
});

Deno.test("isValidIPv4: should reject domain name", () => {
  assertEquals(isValidIPv4("example.com"), false);
});

// ============================================================================
// Invalid IPv4 Addresses - Type Checks
// ============================================================================

Deno.test("isValidIPv4: should reject null", () => {
  assertEquals(isValidIPv4(null), false);
});

Deno.test("isValidIPv4: should reject undefined", () => {
  assertEquals(isValidIPv4(undefined), false);
});

Deno.test("isValidIPv4: should reject number", () => {
  assertEquals(isValidIPv4(12345), false);
});

Deno.test("isValidIPv4: should reject object", () => {
  assertEquals(isValidIPv4({ ip: "192.168.1.1" }), false);
});

Deno.test("isValidIPv4: should reject array", () => {
  assertEquals(isValidIPv4(["192", "168", "1", "1"]), false);
});

// ============================================================================
// Edge Cases - Formatting
// ============================================================================

Deno.test("isValidIPv4: should reject IP with spaces", () => {
  assertEquals(isValidIPv4("192.168.1.1 "), false);
});

Deno.test("isValidIPv4: should reject IP with leading space", () => {
  assertEquals(isValidIPv4(" 192.168.1.1"), false);
});

Deno.test("isValidIPv4: should reject IP with internal space", () => {
  assertEquals(isValidIPv4("192. 168.1.1"), false);
});

Deno.test("isValidIPv4: should reject negative numbers", () => {
  assertEquals(isValidIPv4("-1.168.1.1"), false);
});

Deno.test("isValidIPv4: should reject hex values", () => {
  assertEquals(isValidIPv4("0xC0.0xA8.0x01.0x01"), false);
});

Deno.test("isValidIPv4: should reject octal notation", () => {
  assertEquals(isValidIPv4("0300.0250.0001.0001"), false);
});

Deno.test("isValidIPv4: should reject IPv6 address", () => {
  assertEquals(isValidIPv4("::1"), false);
});

Deno.test("isValidIPv4: should reject IPv4-mapped IPv6", () => {
  assertEquals(isValidIPv4("::ffff:192.168.1.1"), false);
});
