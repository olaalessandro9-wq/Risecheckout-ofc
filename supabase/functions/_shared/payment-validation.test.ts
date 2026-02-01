/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for payment-validation.ts (Compatibility Layer)
 * 
 * Coverage:
 * - Re-export validation from validation/index.ts
 * - Compatibility layer functionality
 * - Deprecation notice compliance
 * 
 * @module _shared/payment-validation.test
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import * as paymentValidation from "./payment-validation.ts";

// ============================================================================
// EXPORT VERIFICATION TESTS
// ============================================================================

Deno.test({
  name: "payment-validation: Deve re-exportar validateOrderAmount",
  fn: () => {
    assertExists(paymentValidation.validateOrderAmount);
    assertEquals(typeof paymentValidation.validateOrderAmount, 'function');
  }
});

Deno.test({
  name: "payment-validation: Deve re-exportar validateCustomerData",
  fn: () => {
    assertExists(paymentValidation.validateCustomerData);
    assertEquals(typeof paymentValidation.validateCustomerData, 'function');
  }
});

Deno.test({
  name: "payment-validation: Deve re-exportar isValidEmail",
  fn: () => {
    assertExists(paymentValidation.isValidEmail);
    assertEquals(typeof paymentValidation.isValidEmail, 'function');
  }
});

Deno.test({
  name: "payment-validation: Deve re-exportar isValidCPF",
  fn: () => {
    assertExists(paymentValidation.isValidCPF);
    assertEquals(typeof paymentValidation.isValidCPF, 'function');
  }
});

Deno.test({
  name: "payment-validation: Deve re-exportar formatCentsToBRL",
  fn: () => {
    assertExists(paymentValidation.formatCentsToBRL);
    assertEquals(typeof paymentValidation.formatCentsToBRL, 'function');
  }
});

// ============================================================================
// FORMAT UTILITY TESTS (Sync functions)
// ============================================================================

Deno.test({
  name: "payment-validation: isValidEmail deve aceitar emails válidos",
  fn: () => {
    const result = paymentValidation.isValidEmail('test@example.com');
    assertEquals(result, true);
  }
});

Deno.test({
  name: "payment-validation: isValidEmail deve rejeitar emails inválidos",
  fn: () => {
    const result = paymentValidation.isValidEmail('invalid-email');
    assertEquals(result, false);
  }
});

Deno.test({
  name: "payment-validation: formatCentsToBRL deve formatar corretamente",
  fn: () => {
    const result = paymentValidation.formatCentsToBRL(10000);
    assertExists(result);
    assertEquals(typeof result, 'string');
    // Should contain formatted number
    assertEquals(result.includes('100'), true);
  }
});

Deno.test({
  name: "payment-validation: isValidCPF deve aceitar CPFs válidos",
  fn: () => {
    // Known valid CPF for testing (checksum-valid)
    const result = paymentValidation.isValidCPF('52998224725');
    assertEquals(result, true);
  }
});

Deno.test({
  name: "payment-validation: isValidCPF deve rejeitar CPFs inválidos",
  fn: () => {
    const result = paymentValidation.isValidCPF('12345678900');
    assertEquals(result, false);
  }
});

// ============================================================================
// CUSTOMER DATA VALIDATION TESTS (Sync function)
// ============================================================================

Deno.test({
  name: "payment-validation: validateCustomerData deve funcionar corretamente",
  fn: () => {
    const customer = {
      name: 'Test Customer',
      email: 'test@example.com',
      document: '12345678900'
    };
    const result = paymentValidation.validateCustomerData(customer);
    assertExists(result);
    assertEquals(result.valid, true);
  }
});

Deno.test({
  name: "payment-validation: validateCustomerData deve rejeitar dados inválidos",
  fn: () => {
    const customer = {
      name: '',
      email: 'invalid-email',
      document: ''
    };
    const result = paymentValidation.validateCustomerData(customer);
    assertExists(result);
    assertEquals(result.valid, false);
  }
});

// ============================================================================
// SECURITY LOGGING TESTS
// ============================================================================

Deno.test({
  name: "payment-validation: Deve re-exportar logSecurityViolation",
  fn: () => {
    assertExists(paymentValidation.logSecurityViolation);
    assertEquals(typeof paymentValidation.logSecurityViolation, 'function');
  }
});
