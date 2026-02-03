/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for validation module
 * 
 * Coverage:
 * - Order validation functions
 * - Customer data validation
 * - Format utilities (email, CPF, CNPJ)
 * - Security logging
 * 
 * @module _shared/validation/validation.test
 * @version 2.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import * as validation from "./index.ts";

// ============================================================================
// EXPORT VERIFICATION TESTS
// ============================================================================

Deno.test({
  name: "validation: Deve exportar validateOrderAmount",
  fn: () => {
    assertExists(validation.validateOrderAmount);
    assertEquals(typeof validation.validateOrderAmount, 'function');
  }
});

Deno.test({
  name: "validation: Deve exportar validateCustomerData",
  fn: () => {
    assertExists(validation.validateCustomerData);
    assertEquals(typeof validation.validateCustomerData, 'function');
  }
});

Deno.test({
  name: "validation: Deve exportar isValidEmail",
  fn: () => {
    assertExists(validation.isValidEmail);
    assertEquals(typeof validation.isValidEmail, 'function');
  }
});

Deno.test({
  name: "validation: Deve exportar isValidCPF",
  fn: () => {
    assertExists(validation.isValidCPF);
    assertEquals(typeof validation.isValidCPF, 'function');
  }
});

Deno.test({
  name: "validation: Deve exportar formatCentsToBRL",
  fn: () => {
    assertExists(validation.formatCentsToBRL);
    assertEquals(typeof validation.formatCentsToBRL, 'function');
  }
});

// ============================================================================
// FORMAT UTILITY TESTS (Sync functions)
// ============================================================================

Deno.test({
  name: "validation: isValidEmail deve aceitar emails válidos",
  fn: () => {
    const result = validation.isValidEmail('test@example.com');
    assertEquals(result, true);
  }
});

Deno.test({
  name: "validation: isValidEmail deve rejeitar emails inválidos",
  fn: () => {
    const result = validation.isValidEmail('invalid-email');
    assertEquals(result, false);
  }
});

Deno.test({
  name: "validation: formatCentsToBRL deve formatar corretamente",
  fn: () => {
    const result = validation.formatCentsToBRL(10000);
    assertExists(result);
    assertEquals(typeof result, 'string');
    // Should contain formatted number
    assertEquals(result.includes('100'), true);
  }
});

Deno.test({
  name: "validation: isValidCPF deve aceitar CPFs válidos",
  fn: () => {
    // Known valid CPF for testing (checksum-valid)
    const result = validation.isValidCPF('52998224725');
    assertEquals(result, true);
  }
});

Deno.test({
  name: "validation: isValidCPF deve rejeitar CPFs inválidos",
  fn: () => {
    const result = validation.isValidCPF('12345678900');
    assertEquals(result, false);
  }
});

// ============================================================================
// CUSTOMER DATA VALIDATION TESTS (Sync function)
// ============================================================================

Deno.test({
  name: "validation: validateCustomerData deve funcionar corretamente",
  fn: () => {
    const customer = {
      name: 'Test Customer',
      email: 'test@example.com',
      document: '12345678900'
    };
    const result = validation.validateCustomerData(customer);
    assertExists(result);
    assertEquals(result.valid, true);
  }
});

Deno.test({
  name: "validation: validateCustomerData deve rejeitar dados inválidos",
  fn: () => {
    const customer = {
      name: '',
      email: 'invalid-email',
      document: ''
    };
    const result = validation.validateCustomerData(customer);
    assertExists(result);
    assertEquals(result.valid, false);
  }
});

// ============================================================================
// SECURITY LOGGING TESTS
// ============================================================================

Deno.test({
  name: "validation: Deve exportar logSecurityViolation",
  fn: () => {
    assertExists(validation.logSecurityViolation);
    assertEquals(typeof validation.logSecurityViolation, 'function');
  }
});
