import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { createHmac } from "node:crypto";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const webhookSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET') ?? 'test-secret';

/**
 * Gera uma assinatura HMAC-SHA256 válida para testes
 */
function generateValidSignature(dataId: string, ts: string): string {
  const manifest = `id:${dataId};request-id:test-request-id;ts:${ts};`;
  const hmac = createHmac('sha256', webhookSecret);
  hmac.update(manifest);
  return `ts=${ts},v1=${hmac.digest('hex')}`;
}

Deno.test("mercadopago-webhook: Deve aceitar webhook com assinatura válida", async () => {
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
});

Deno.test("mercadopago-webhook: Deve rejeitar webhook com assinatura inválida", async () => {
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
});

Deno.test("mercadopago-webhook: Deve rejeitar webhook sem headers de assinatura", async () => {
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
});

Deno.test("mercadopago-webhook: Deve rejeitar webhook expirado (> 5 minutos)", async () => {
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
});
