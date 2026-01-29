/**
 * Validation Library - Phone/Email/Name/Password Validation Unit Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for phone, email, name, and password validation functions.
 * Single Responsibility: Only contact/credential validation tests.
 *
 * @module lib/__tests__/validation.phone-email.test
 */

import { describe, it, expect } from "vitest";
import {
  validatePhone,
  validateEmail,
  validateName,
  validatePassword,
} from "../validation";

// ============================================================================
// PHONE VALIDATION TESTS
// ============================================================================

describe("Phone Validation", () => {
  const validPhones = [
    "(11) 98765-4321",
    "11987654321",
    "(21) 3456-7890",
    "2134567890",
    "(99) 99999-9999",
  ];

  const invalidPhones = [
    "(10) 98765-4321",
    "(00) 98765-4321",
    "123456789",
    "123456789012",
    "(11) 88765-4321",
  ];

  it.each(validPhones)("should validate valid phone: %s", (phone) => {
    expect(validatePhone(phone)).toBe(true);
  });

  it.each(invalidPhones)("should reject invalid phone: %s", (phone) => {
    expect(validatePhone(phone)).toBe(false);
  });

  it("should reject empty string", () => {
    expect(validatePhone("")).toBe(false);
  });

  it("should accept landline format (10 digits)", () => {
    expect(validatePhone("1134567890")).toBe(true);
  });

  it("should accept mobile format (11 digits starting with 9)", () => {
    expect(validatePhone("11987654321")).toBe(true);
  });
});

// ============================================================================
// EMAIL VALIDATION TESTS
// ============================================================================

describe("Email Validation", () => {
  const validEmails = [
    "test@example.com",
    "user.name@domain.org",
    "user-name@domain.co.uk",
    "user_name@domain.io",
    "user123@sub.domain.com",
  ];

  const invalidEmails = [
    "",
    "notanemail",
    "@nodomain.com",
    "no@",
    "no@domain",
    "no@domain.c",
    "spa ces@domain.com",
    "no@doma in.com",
  ];

  it.each(validEmails)("should validate valid email: %s", (email) => {
    expect(validateEmail(email)).toBe(true);
  });

  it.each(invalidEmails)("should reject invalid email: %s", (email) => {
    expect(validateEmail(email)).toBe(false);
  });
});

// ============================================================================
// NAME VALIDATION TESTS
// ============================================================================

describe("Name Validation", () => {
  it("should accept valid names", () => {
    expect(validateName("João")).toBe(true);
    expect(validateName("Maria Silva")).toBe(true);
    expect(validateName("José da Costa")).toBe(true);
  });

  it("should accept names with accents", () => {
    expect(validateName("José")).toBe(true);
    expect(validateName("Müller")).toBe(true);
    expect(validateName("François")).toBe(true);
  });

  it("should reject names shorter than 3 characters", () => {
    expect(validateName("")).toBe(false);
    expect(validateName("A")).toBe(false);
    expect(validateName("AB")).toBe(false);
  });

  it("should accept names with exactly 3 characters", () => {
    expect(validateName("Ana")).toBe(true);
  });

  it("should reject names with numbers", () => {
    expect(validateName("João123")).toBe(false);
    expect(validateName("Maria 2nd")).toBe(false);
  });

  it("should reject names with special characters", () => {
    expect(validateName("João@Silva")).toBe(false);
    expect(validateName("Maria!")).toBe(false);
  });
});

// ============================================================================
// PASSWORD VALIDATION TESTS
// ============================================================================

describe("Password Validation", () => {
  it("should accept passwords with 6+ characters", () => {
    expect(validatePassword("123456")).toBe(true);
    expect(validatePassword("abcdef")).toBe(true);
    expect(validatePassword("pass12")).toBe(true);
  });

  it("should reject passwords shorter than 6 characters", () => {
    expect(validatePassword("")).toBe(false);
    expect(validatePassword("12345")).toBe(false);
    expect(validatePassword("abcde")).toBe(false);
  });

  it("should accept exactly 6 characters", () => {
    expect(validatePassword("abcdef")).toBe(true);
  });

  it("should accept special characters", () => {
    expect(validatePassword("p@ss!#")).toBe(true);
  });
});
