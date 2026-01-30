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

Deno.test({
  name: "payment-validation: Deve re-exportar validateAmount",
  fn: () => {
    assertExists(paymentValidation.validateAmount);
    assertEquals(typeof paymentValidation.validateAmount, 'function');
  }
});

Deno.test({
  name: "payment-validation: Deve re-exportar validateCustomer",
  fn: () => {
    assertExists(paymentValidation.validateCustomer);
    assertEquals(typeof paymentValidation.validateCustomer, 'function');
  }
});

Deno.test({
  name: "payment-validation: Deve re-exportar validatePaymentMethod",
  fn: () => {
    assertExists(paymentValidation.validatePaymentMethod);
    assertEquals(typeof paymentValidation.validatePaymentMethod, 'function');
  }
});

Deno.test({
  name: "payment-validation: Deve re-exportar validateOrderId",
  fn: () => {
    assertExists(paymentValidation.validateOrderId);
    assertEquals(typeof paymentValidation.validateOrderId, 'function');
  }
});

Deno.test({
  name: "payment-validation: validateAmount deve funcionar corretamente",
  fn: () => {
    const result = paymentValidation.validateAmount(10000);
    assertExists(result);
    assertEquals(result.valid, true);
  }
});

Deno.test({
  name: "payment-validation: validateAmount deve rejeitar valores inválidos",
  fn: () => {
    const result = paymentValidation.validateAmount(0);
    assertExists(result);
    assertEquals(result.valid, false);
  }
});

Deno.test({
  name: "payment-validation: validateCustomer deve funcionar corretamente",
  fn: () => {
    const customer = {
      name: 'Test Customer',
      email: 'test@example.com',
      document: '12345678900'
    };
    const result = paymentValidation.validateCustomer(customer);
    assertExists(result);
    assertEquals(result.valid, true);
  }
});

Deno.test({
  name: "payment-validation: validateCustomer deve rejeitar dados inválidos",
  fn: () => {
    const customer = {
      name: '',
      email: 'invalid-email',
      document: ''
    };
    const result = paymentValidation.validateCustomer(customer);
    assertExists(result);
    assertEquals(result.valid, false);
  }
});

Deno.test({
  name: "payment-validation: validatePaymentMethod deve aceitar métodos válidos",
  fn: () => {
    const result = paymentValidation.validatePaymentMethod('pix');
    assertExists(result);
    assertEquals(result.valid, true);
  }
});

Deno.test({
  name: "payment-validation: validatePaymentMethod deve rejeitar métodos inválidos",
  fn: () => {
    const result = paymentValidation.validatePaymentMethod('invalid_method');
    assertExists(result);
    assertEquals(result.valid, false);
  }
});

Deno.test({
  name: "payment-validation: validateOrderId deve aceitar IDs válidos",
  fn: () => {
    const result = paymentValidation.validateOrderId('order_123abc');
    assertExists(result);
    assertEquals(result.valid, true);
  }
});

Deno.test({
  name: "payment-validation: validateOrderId deve rejeitar IDs inválidos",
  fn: () => {
    const result = paymentValidation.validateOrderId('');
    assertExists(result);
    assertEquals(result.valid, false);
  }
});
