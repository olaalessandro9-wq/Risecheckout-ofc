/**
 * Password Policy Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for password validation and strength scoring.
 * CRITICAL: Weak password policies create security vulnerabilities.
 * 
 * @module _shared/password-policy.test
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  validatePassword,
  formatPasswordError,
  PASSWORD_POLICY,
} from "./password-policy.ts";

// ============================================================================
// PASSWORD_POLICY Configuration Tests
// ============================================================================

Deno.test("PASSWORD_POLICY: should have correct default values", () => {
  assertEquals(PASSWORD_POLICY.minLength, 8);
  assertEquals(PASSWORD_POLICY.maxLength, 128);
  assertEquals(PASSWORD_POLICY.requireUppercase, true);
  assertEquals(PASSWORD_POLICY.requireLowercase, true);
  assertEquals(PASSWORD_POLICY.requireNumber, true);
  assertEquals(PASSWORD_POLICY.requireSpecialChar, false);
  assertEquals(PASSWORD_POLICY.disallowCommonPasswords, true);
});

// ============================================================================
// validatePassword Tests - Valid Passwords
// ============================================================================

Deno.test("validatePassword: should accept strong password", () => {
  const result = validatePassword("SecurePass123");
  
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
  assertEquals(result.score > 50, true);
});

Deno.test("validatePassword: should accept minimum valid password", () => {
  const result = validatePassword("Abcdefg1");
  
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validatePassword: should give bonus for special characters", () => {
  const withoutSpecial = validatePassword("SecurePass123");
  const withSpecial = validatePassword("SecurePass123!");
  
  assertEquals(withSpecial.score > withoutSpecial.score, true);
});

Deno.test("validatePassword: should give bonus for longer passwords", () => {
  const short = validatePassword("SecPass1");
  const medium = validatePassword("SecurePass123");
  const long = validatePassword("VerySecurePassword123");
  
  assertEquals(medium.score >= short.score, true);
  assertEquals(long.score >= medium.score, true);
});

Deno.test("validatePassword: should accept password with special chars", () => {
  const result = validatePassword("Secure@Pass#123!");
  
  assertEquals(result.valid, true);
  assertEquals(result.score >= 70, true);
});

Deno.test("validatePassword: should accept password at max length", () => {
  const password = "Aa1" + "x".repeat(125); // 128 chars total
  const result = validatePassword(password);
  
  assertEquals(result.valid, true);
});

// ============================================================================
// validatePassword Tests - Invalid Passwords
// ============================================================================

Deno.test("validatePassword: should reject password too short", () => {
  const result = validatePassword("Short1");
  
  assertEquals(result.valid, false);
  assertEquals(result.errors.includes(`Senha deve ter no mínimo ${PASSWORD_POLICY.minLength} caracteres`), true);
});

Deno.test("validatePassword: should reject password too long", () => {
  const password = "A".repeat(130) + "a1";
  const result = validatePassword(password);
  
  assertEquals(result.valid, false);
  assertEquals(result.errors.some(e => e.includes("máximo")), true);
});

Deno.test("validatePassword: should reject password without uppercase", () => {
  const result = validatePassword("lowercase123");
  
  assertEquals(result.valid, false);
  assertEquals(result.errors.includes("Senha deve conter pelo menos uma letra maiúscula"), true);
});

Deno.test("validatePassword: should reject password without lowercase", () => {
  const result = validatePassword("UPPERCASE123");
  
  assertEquals(result.valid, false);
  assertEquals(result.errors.includes("Senha deve conter pelo menos uma letra minúscula"), true);
});

Deno.test("validatePassword: should reject password without number", () => {
  const result = validatePassword("NoNumbersHere");
  
  assertEquals(result.valid, false);
  assertEquals(result.errors.includes("Senha deve conter pelo menos um número"), true);
});

Deno.test("validatePassword: should reject common password 'password'", () => {
  const result = validatePassword("password");
  
  assertEquals(result.valid, false);
  assertEquals(result.errors.some(e => e.includes("muito comum")), true);
});

Deno.test("validatePassword: should reject common password '123456'", () => {
  const result = validatePassword("123456");
  
  assertEquals(result.valid, false);
});

Deno.test("validatePassword: should reject common password 'senha123'", () => {
  const result = validatePassword("senha123");
  
  assertEquals(result.valid, false);
});

Deno.test("validatePassword: should reject common password 'admin123'", () => {
  const result = validatePassword("admin123");
  
  assertEquals(result.valid, false);
});

Deno.test("validatePassword: should reject common password 'qwerty'", () => {
  const result = validatePassword("qwerty");
  
  assertEquals(result.valid, false);
});

// ============================================================================
// validatePassword Tests - Sequences and Patterns
// ============================================================================

Deno.test("validatePassword: should penalize sequential characters 'abcd'", () => {
  const withSequence = validatePassword("Abcdefgh1");
  const withoutSequence = validatePassword("Axbyczdw1");
  
  // With sequence should have lower score
  assertEquals(withoutSequence.score > withSequence.score, true);
  assertEquals(withSequence.suggestions.some(s => s.includes("sequências")), true);
});

Deno.test("validatePassword: should penalize sequential numbers '1234'", () => {
  const result = validatePassword("Password1234");
  
  assertEquals(result.suggestions.some(s => s.includes("sequências")), true);
});

Deno.test("validatePassword: should penalize repeated characters 'aaa'", () => {
  const result = validatePassword("Paaasword1");
  
  assertEquals(result.suggestions.some(s => s.includes("repetir")), true);
});

Deno.test("validatePassword: should penalize qwerty pattern", () => {
  const result = validatePassword("Qwertyuiop1");
  
  assertEquals(result.suggestions.some(s => s.includes("sequências")), true);
});

// ============================================================================
// validatePassword Tests - Edge Cases
// ============================================================================

Deno.test("Edge Case: empty string should fail", () => {
  const result = validatePassword("");
  
  assertEquals(result.valid, false);
  assertEquals(result.score, 0);
});

Deno.test("Edge Case: non-string input should fail", () => {
  const result = validatePassword(null as unknown as string);
  
  assertEquals(result.valid, false);
  assertEquals(result.errors.includes("Senha inválida"), true);
});

Deno.test("Edge Case: undefined input should fail", () => {
  const result = validatePassword(undefined as unknown as string);
  
  assertEquals(result.valid, false);
});

Deno.test("Edge Case: number input should fail", () => {
  const result = validatePassword(12345678 as unknown as string);
  
  assertEquals(result.valid, false);
});

Deno.test("Edge Case: case-insensitive common password check", () => {
  const result = validatePassword("PASSWORD");
  
  assertEquals(result.valid, false);
  assertEquals(result.errors.some(e => e.includes("comum")), true);
});

Deno.test("Edge Case: password with spaces should work", () => {
  const result = validatePassword("Secure Pass 123");
  
  assertEquals(result.valid, true);
});

Deno.test("Edge Case: unicode characters should work", () => {
  const result = validatePassword("Senha123日本語");
  
  assertEquals(result.valid, true);
});

Deno.test("Edge Case: emoji in password should work", () => {
  const result = validatePassword("Secure123🔒");
  
  assertEquals(result.valid, true);
});

// ============================================================================
// Score Calculation Tests
// ============================================================================

Deno.test("Score: minimum valid password should have low score", () => {
  const result = validatePassword("Abcdefg1");
  
  assertEquals(result.score >= 20, true);
  assertEquals(result.score <= 60, true);
});

Deno.test("Score: strong password should have high score", () => {
  const result = validatePassword("VerySecure@Password#123!");
  
  assertEquals(result.score >= 70, true);
});

Deno.test("Score: should be capped at 100", () => {
  const result = validatePassword("ExtremelySecure@Password#123!456$789%");
  
  assertEquals(result.score <= 100, true);
});

Deno.test("Score: common password should have reduced score", () => {
  // Common password that would otherwise be valid
  const result = validatePassword("Passw0rd");
  
  assertEquals(result.score < 50, true);
});

// ============================================================================
// formatPasswordError Tests
// ============================================================================

Deno.test("formatPasswordError: should return empty string for valid password", () => {
  const result = validatePassword("SecurePass123");
  const formatted = formatPasswordError(result);
  
  assertEquals(formatted, "");
});

Deno.test("formatPasswordError: should return single error directly", () => {
  const result = validatePassword("short");
  const formatted = formatPasswordError(result);
  
  assertEquals(formatted.includes("Senha deve ter no mínimo"), true);
});

Deno.test("formatPasswordError: should combine multiple errors", () => {
  const result = validatePassword("1234");
  const formatted = formatPasswordError(result);
  
  assertEquals(formatted.includes("Senha inválida:"), true);
});

// ============================================================================
// Suggestions Tests
// ============================================================================

Deno.test("Suggestions: should suggest special characters when missing", () => {
  const result = validatePassword("SecurePass123");
  
  assertEquals(result.suggestions.some(s => s.includes("caracteres especiais")), true);
});

Deno.test("Suggestions: should not suggest special chars when present", () => {
  const result = validatePassword("SecurePass123!");
  
  assertEquals(result.suggestions.some(s => s.includes("caracteres especiais")), false);
});

// ============================================================================
// Real-World Password Tests
// ============================================================================

Deno.test("Real-World: 'MyP@ssw0rd!' should be valid", () => {
  const result = validatePassword("MyP@ssw0rd!");
  
  assertEquals(result.valid, true);
  assertEquals(result.score >= 60, true);
});

Deno.test("Real-World: 'JoaoSilva2024!' should be valid", () => {
  const result = validatePassword("JoaoSilva2024!");
  
  assertEquals(result.valid, true);
});

Deno.test("Real-World: 'risecheckout123' should fail (no uppercase)", () => {
  const result = validatePassword("risecheckout123");
  
  assertEquals(result.valid, false);
});

Deno.test("Real-World: 'RISECHECKOUT123' should fail (no lowercase)", () => {
  const result = validatePassword("RISECHECKOUT123");
  
  assertEquals(result.valid, false);
});

Deno.test("Real-World: 'RiseCheckout' should fail (no number)", () => {
  const result = validatePassword("RiseCheckout");
  
  assertEquals(result.valid, false);
});

Deno.test("Real-World: 'Rc2024!' should fail (too short)", () => {
  const result = validatePassword("Rc2024!");
  
  assertEquals(result.valid, false);
});
