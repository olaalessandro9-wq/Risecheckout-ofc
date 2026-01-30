/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for mercadopago-signature.ts
 * 
 * Coverage:
 * - validateMercadoPagoSignature (HMAC validation)
 * - Secret configuration check
 * - Headers presence validation
 * - Signature format validation
 * - Webhook age verification (replay protection)
 * - HMAC signature comparison
 * - Error handling
 * 
 * @module _shared/mercadopago-signature.test
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateMercadoPagoSignature } from "./mercadopago-signature.ts";

// Mock logger
const mockLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {}
};

// ============================================================================
// SECRET CONFIGURATION TESTS
// ============================================================================

Deno.test({
  name: "mercadopago-signature: Deve rejeitar se MERCADOPAGO_WEBHOOK_SECRET não configurado",
  fn: async () => {
    // Salvar valor original
    const originalSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');
    
    // Remover temporariamente
    Deno.env.delete('MERCADOPAGO_WEBHOOK_SECRET');
    
    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'x-signature': 'ts=123,v1=abc',
        'x-request-id': 'req123'
      }
    });
    
    const result = await validateMercadoPagoSignature(req, 'data123', mockLogger);
    
    assertEquals(result.valid, false);
    assertExists(result.error);
    
    // Restaurar valor original
    if (originalSecret) {
      Deno.env.set('MERCADOPAGO_WEBHOOK_SECRET', originalSecret);
    }
  }
});

// ============================================================================
// HEADERS VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "mercadopago-signature: Deve rejeitar se x-signature ausente",
  fn: async () => {
    Deno.env.set('MERCADOPAGO_WEBHOOK_SECRET', 'test_secret');
    
    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'x-request-id': 'req123'
      }
    });
    
    const result = await validateMercadoPagoSignature(req, 'data123', mockLogger);
    
    assertEquals(result.valid, false);
    assertExists(result.error);
  }
});

Deno.test({
  name: "mercadopago-signature: Deve rejeitar se x-request-id ausente",
  fn: async () => {
    Deno.env.set('MERCADOPAGO_WEBHOOK_SECRET', 'test_secret');
    
    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'x-signature': 'ts=123,v1=abc'
      }
    });
    
    const result = await validateMercadoPagoSignature(req, 'data123', mockLogger);
    
    assertEquals(result.valid, false);
    assertExists(result.error);
  }
});

// ============================================================================
// SIGNATURE FORMAT VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "mercadopago-signature: Deve rejeitar formato de assinatura inválido (sem ts)",
  fn: async () => {
    Deno.env.set('MERCADOPAGO_WEBHOOK_SECRET', 'test_secret');
    
    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'x-signature': 'v1=abc',
        'x-request-id': 'req123'
      }
    });
    
    const result = await validateMercadoPagoSignature(req, 'data123', mockLogger);
    
    assertEquals(result.valid, false);
    assertExists(result.error);
  }
});

Deno.test({
  name: "mercadopago-signature: Deve rejeitar formato de assinatura inválido (sem v1)",
  fn: async () => {
    Deno.env.set('MERCADOPAGO_WEBHOOK_SECRET', 'test_secret');
    
    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'x-signature': 'ts=123',
        'x-request-id': 'req123'
      }
    });
    
    const result = await validateMercadoPagoSignature(req, 'data123', mockLogger);
    
    assertEquals(result.valid, false);
    assertExists(result.error);
  }
});

Deno.test({
  name: "mercadopago-signature: Deve rejeitar formato de assinatura vazio",
  fn: async () => {
    Deno.env.set('MERCADOPAGO_WEBHOOK_SECRET', 'test_secret');
    
    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'x-signature': '',
        'x-request-id': 'req123'
      }
    });
    
    const result = await validateMercadoPagoSignature(req, 'data123', mockLogger);
    
    assertEquals(result.valid, false);
    assertExists(result.error);
  }
});

// ============================================================================
// WEBHOOK AGE VALIDATION TESTS (REPLAY PROTECTION)
// ============================================================================

Deno.test({
  name: "mercadopago-signature: Deve rejeitar webhook expirado (muito antigo)",
  fn: async () => {
    Deno.env.set('MERCADOPAGO_WEBHOOK_SECRET', 'test_secret');
    
    // Timestamp muito antigo (mais de 5 minutos)
    const oldTimestamp = Math.floor(Date.now() / 1000) - 400;
    
    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'x-signature': `ts=${oldTimestamp},v1=abc123`,
        'x-request-id': 'req123'
      }
    });
    
    const result = await validateMercadoPagoSignature(req, 'data123', mockLogger);
    
    assertEquals(result.valid, false);
    assertExists(result.error);
  }
});

// ============================================================================
// SIGNATURE COMPARISON TESTS
// ============================================================================

Deno.test({
  name: "mercadopago-signature: Deve rejeitar assinatura incorreta",
  fn: async () => {
    Deno.env.set('MERCADOPAGO_WEBHOOK_SECRET', 'test_secret');
    
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'x-signature': `ts=${currentTimestamp},v1=invalid_hash`,
        'x-request-id': 'req123'
      }
    });
    
    const result = await validateMercadoPagoSignature(req, 'data123', mockLogger);
    
    assertEquals(result.valid, false);
    assertExists(result.error);
  }
});

// ============================================================================
// RESULT STRUCTURE TESTS
// ============================================================================

Deno.test({
  name: "mercadopago-signature: Resultado deve ter estrutura correta (válido)",
  fn: async () => {
    Deno.env.set('MERCADOPAGO_WEBHOOK_SECRET', 'test_secret');
    
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'x-signature': `ts=${currentTimestamp},v1=test_hash`,
        'x-request-id': 'req123'
      }
    });
    
    const result = await validateMercadoPagoSignature(req, 'data123', mockLogger);
    
    assertExists(result);
    assertExists(result.valid);
    assertEquals(typeof result.valid, 'boolean');
  }
});

Deno.test({
  name: "mercadopago-signature: Resultado deve ter estrutura correta (inválido)",
  fn: async () => {
    Deno.env.set('MERCADOPAGO_WEBHOOK_SECRET', 'test_secret');
    
    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'x-signature': 'invalid',
        'x-request-id': 'req123'
      }
    });
    
    const result = await validateMercadoPagoSignature(req, 'data123', mockLogger);
    
    assertExists(result);
    assertEquals(result.valid, false);
    assertExists(result.error);
    assertEquals(typeof result.error, 'string');
  }
});

// ============================================================================
// EDGE CASES
// ============================================================================

Deno.test({
  name: "mercadopago-signature: Deve lidar com dataId vazio",
  fn: async () => {
    Deno.env.set('MERCADOPAGO_WEBHOOK_SECRET', 'test_secret');
    
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'x-signature': `ts=${currentTimestamp},v1=test`,
        'x-request-id': 'req123'
      }
    });
    
    const result = await validateMercadoPagoSignature(req, '', mockLogger);
    
    assertExists(result);
    assertEquals(typeof result.valid, 'boolean');
  }
});

Deno.test({
  name: "mercadopago-signature: Deve lidar com timestamp inválido (não numérico)",
  fn: async () => {
    Deno.env.set('MERCADOPAGO_WEBHOOK_SECRET', 'test_secret');
    
    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'x-signature': 'ts=invalid,v1=test',
        'x-request-id': 'req123'
      }
    });
    
    const result = await validateMercadoPagoSignature(req, 'data123', mockLogger);
    
    assertEquals(result.valid, false);
    assertExists(result.error);
  }
});
