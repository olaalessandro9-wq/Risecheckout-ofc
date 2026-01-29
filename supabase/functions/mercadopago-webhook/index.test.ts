/**
 * Integration Tests for mercadopago-webhook Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * These are HTTP integration tests that require:
 * 1. SUPABASE_URL environment variable
 * 2. The Edge Function to be deployed
 * 
 * Tests will be skipped if environment is not configured.
 * 
 * @module mercadopago-webhook/index.test
 */

import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { createHmac } from "node:crypto";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const webhookSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET') ?? 'test-secret';

// Skip tests if environment is not configured or using mock values
// These are integration tests that require the actual Edge Function to be deployed
const isMockUrl = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');
const skipTests = isMockUrl;

/**
 * Gera uma assinatura HMAC-SHA256 válida para testes
 */
function generateValidSignature(dataId: string, ts: string): string {
  const manifest = `id:${dataId};request-id:test-request-id;ts:${ts};`;
  const hmac = createHmac('sha256', webhookSecret);
  hmac.update(manifest);
  return `ts=${ts},v1=${hmac.digest('hex')}`;
}

Deno.test({
  name: "mercadopago-webhook: Deve aceitar webhook com assinatura válida",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const dataId = "12345678";
    const ts = Math.floor(Date.now() / 1000).toString();
    const validSignature = generateValidSignature(dataId, ts);

    const payload = {
      action: "payment.updated",
      data: {
        id: dataId
      },
      type: "payment"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': validSignature,
        'x-request-id': 'test-request-id'
      },
      body: JSON.stringify(payload)
    });

    // Consumir o body para evitar leak
    await response.text();
    
    assertEquals(response.status, 200);
  }
});

Deno.test({
  name: "mercadopago-webhook: Deve rejeitar webhook com assinatura inválida",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "payment.updated",
      data: {
        id: "12345678"
      },
      type: "payment"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': 'ts=1234567890,v1=invalid_signature',
        'x-request-id': 'test-request-id'
      },
      body: JSON.stringify(payload)
    });

    // Consumir o body para evitar leak
    await response.text();
    
    assertEquals(response.status, 401);
  }
});

Deno.test({
  name: "mercadopago-webhook: Deve rejeitar webhook sem headers de assinatura",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      action: "payment.updated",
      data: {
        id: "12345678"
      },
      type: "payment"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Consumir o body para evitar leak
    await response.text();
    
    // Webhook sem headers de assinatura retorna 401 (Unauthorized)
    assertEquals(response.status, 401);
  }
});

Deno.test({
  name: "mercadopago-webhook: Deve rejeitar webhook expirado (> 5 minutos)",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const dataId = "12345678";
    // Timestamp de 10 minutos atrás
    const oldTs = (Math.floor(Date.now() / 1000) - 600).toString();
    const expiredSignature = generateValidSignature(dataId, oldTs);

    const payload = {
      action: "payment.updated",
      data: {
        id: dataId
      },
      type: "payment"
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': expiredSignature,
        'x-request-id': 'test-request-id'
      },
      body: JSON.stringify(payload)
    });

    // Consumir o body para evitar leak
    await response.text();
    
    assertEquals(response.status, 401);
  }
});
