/**
 * Unit Tests for Webhook Helpers
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - Status mapping (MercadoPago, PushinPay, Asaas)
 * - Response helpers
 * - HMAC signature generation
 * - Error codes
 * 
 * @module _shared/webhook-helpers.test
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { 
  mapMercadoPagoStatus,
  mapPushinPayStatus,
  mapAsaasStatus,
  createSuccessResponse,
  createErrorResponse,
  generateHmacSignature,
  createLogger,
  ERROR_CODES,
  SIGNATURE_MAX_AGE
} from "./webhook-helpers.ts";

// ============================================================================
// Constants Tests
// ============================================================================

Deno.test("ERROR_CODES: Deve ter todos os códigos de erro definidos", () => {
  assertExists(ERROR_CODES.PAYMENT_ID_MISSING);
  assertExists(ERROR_CODES.ORDER_NOT_FOUND);
  assertExists(ERROR_CODES.GATEWAY_NOT_CONFIGURED);
  assertExists(ERROR_CODES.GATEWAY_API_ERROR);
  assertExists(ERROR_CODES.UPDATE_ERROR);
  assertExists(ERROR_CODES.INTERNAL_ERROR);
  assertExists(ERROR_CODES.SECRET_NOT_CONFIGURED);
  assertExists(ERROR_CODES.MISSING_SIGNATURE_HEADERS);
  assertExists(ERROR_CODES.INVALID_SIGNATURE_FORMAT);
  assertExists(ERROR_CODES.WEBHOOK_EXPIRED);
  assertExists(ERROR_CODES.SIGNATURE_MISMATCH);
  assertExists(ERROR_CODES.VALIDATION_ERROR);
  assertExists(ERROR_CODES.UNAUTHORIZED);
  assertExists(ERROR_CODES.CIRCUIT_OPEN);
});

Deno.test("SIGNATURE_MAX_AGE: Deve ser 300 segundos (5 minutos)", () => {
  assertEquals(SIGNATURE_MAX_AGE, 300);
});

// ============================================================================
// MercadoPago Status Mapping Tests
// ============================================================================

Deno.test("mapMercadoPagoStatus: approved -> PAID", () => {
  const result = mapMercadoPagoStatus('approved');
  assertEquals(result.orderStatus, 'PAID');
  assertEquals(result.eventType, 'purchase_approved');
});

Deno.test("mapMercadoPagoStatus: pending -> PENDING", () => {
  const result = mapMercadoPagoStatus('pending');
  assertEquals(result.orderStatus, 'PENDING');
  assertEquals(result.eventType, 'pix_generated');
});

Deno.test("mapMercadoPagoStatus: in_process -> PENDING", () => {
  const result = mapMercadoPagoStatus('in_process');
  assertEquals(result.orderStatus, 'PENDING');
  assertEquals(result.eventType, 'pix_generated');
});

Deno.test("mapMercadoPagoStatus: rejected -> PENDING + technicalStatus", () => {
  const result = mapMercadoPagoStatus('rejected');
  assertEquals(result.orderStatus, 'PENDING');
  assertEquals(result.eventType, null);
  assertEquals(result.technicalStatus, 'gateway_error');
});

Deno.test("mapMercadoPagoStatus: cancelled -> PENDING + technicalStatus", () => {
  const result = mapMercadoPagoStatus('cancelled');
  assertEquals(result.orderStatus, 'PENDING');
  assertEquals(result.technicalStatus, 'gateway_cancelled');
});

Deno.test("mapMercadoPagoStatus: refunded -> REFUNDED", () => {
  const result = mapMercadoPagoStatus('refunded');
  assertEquals(result.orderStatus, 'REFUNDED');
  assertEquals(result.eventType, 'refund');
});

Deno.test("mapMercadoPagoStatus: charged_back -> CHARGEBACK", () => {
  const result = mapMercadoPagoStatus('charged_back');
  assertEquals(result.orderStatus, 'CHARGEBACK');
  assertEquals(result.eventType, 'chargeback');
});

Deno.test("mapMercadoPagoStatus: unknown -> PENDING", () => {
  const result = mapMercadoPagoStatus('unknown_status');
  assertEquals(result.orderStatus, 'PENDING');
  assertEquals(result.eventType, null);
});

// ============================================================================
// PushinPay Status Mapping Tests
// ============================================================================

Deno.test("mapPushinPayStatus: paid -> PAID", () => {
  const result = mapPushinPayStatus('paid');
  assertEquals(result.orderStatus, 'PAID');
  assertEquals(result.eventType, 'purchase_approved');
});

Deno.test("mapPushinPayStatus: expired -> PENDING + expired", () => {
  const result = mapPushinPayStatus('expired');
  assertEquals(result.orderStatus, 'PENDING');
  assertEquals(result.eventType, null);
  assertEquals(result.technicalStatus, 'expired');
});

Deno.test("mapPushinPayStatus: canceled -> PENDING + gateway_cancelled", () => {
  const result = mapPushinPayStatus('canceled');
  assertEquals(result.orderStatus, 'PENDING');
  assertEquals(result.technicalStatus, 'gateway_cancelled');
});

Deno.test("mapPushinPayStatus: created -> PENDING", () => {
  const result = mapPushinPayStatus('created');
  assertEquals(result.orderStatus, 'PENDING');
  assertEquals(result.eventType, null);
});

// ============================================================================
// Asaas Status Mapping Tests (Modelo Hotmart/Kiwify)
// ============================================================================

Deno.test("mapAsaasStatus: PENDING -> PENDING", () => {
  const result = mapAsaasStatus('PENDING');
  assertEquals(result.orderStatus, 'PENDING');
  assertEquals(result.eventType, 'pix_generated');
});

Deno.test("mapAsaasStatus: RECEIVED -> PAID", () => {
  const result = mapAsaasStatus('RECEIVED');
  assertEquals(result.orderStatus, 'PAID');
  assertEquals(result.eventType, 'purchase_approved');
});

Deno.test("mapAsaasStatus: CONFIRMED -> PAID", () => {
  const result = mapAsaasStatus('CONFIRMED');
  assertEquals(result.orderStatus, 'PAID');
  assertEquals(result.eventType, 'purchase_approved');
});

Deno.test("mapAsaasStatus: RECEIVED_IN_CASH -> PAID", () => {
  const result = mapAsaasStatus('RECEIVED_IN_CASH');
  assertEquals(result.orderStatus, 'PAID');
  assertEquals(result.eventType, 'purchase_approved');
});

Deno.test("mapAsaasStatus: OVERDUE -> PENDING + expired (Modelo Hotmart)", () => {
  const result = mapAsaasStatus('OVERDUE');
  assertEquals(result.orderStatus, 'PENDING');
  assertEquals(result.eventType, null);
  assertEquals(result.technicalStatus, 'expired');
});

Deno.test("mapAsaasStatus: REFUNDED -> REFUNDED", () => {
  const result = mapAsaasStatus('REFUNDED');
  assertEquals(result.orderStatus, 'REFUNDED');
  assertEquals(result.eventType, 'purchase_refunded');
});

Deno.test("mapAsaasStatus: REFUND_IN_PROGRESS -> PENDING + refund_in_progress", () => {
  const result = mapAsaasStatus('REFUND_IN_PROGRESS');
  assertEquals(result.orderStatus, 'PENDING');
  assertEquals(result.technicalStatus, 'refund_in_progress');
});

Deno.test("mapAsaasStatus: CHARGEBACK_REQUESTED -> CHARGEBACK", () => {
  const result = mapAsaasStatus('CHARGEBACK_REQUESTED');
  assertEquals(result.orderStatus, 'CHARGEBACK');
  assertEquals(result.eventType, 'chargeback');
});

Deno.test("mapAsaasStatus: DUNNING_RECEIVED -> PAID", () => {
  const result = mapAsaasStatus('DUNNING_RECEIVED');
  assertEquals(result.orderStatus, 'PAID');
  assertEquals(result.eventType, 'purchase_approved');
});

Deno.test("mapAsaasStatus: unknown -> PENDING", () => {
  const result = mapAsaasStatus('UNKNOWN_STATUS');
  assertEquals(result.orderStatus, 'PENDING');
  assertEquals(result.eventType, null);
});

// ============================================================================
// Response Helper Tests
// ============================================================================

Deno.test("createSuccessResponse: Deve criar resposta com status 200", async () => {
  const response = createSuccessResponse({ orderId: '123' });
  
  assertEquals(response.status, 200);
  assertEquals(response.headers.get('Content-Type'), 'application/json');
  
  const body = await response.json();
  assertEquals(body.success, true);
  assertEquals(body.data.orderId, '123');
});

Deno.test("createErrorResponse: Deve criar resposta com status específico", async () => {
  const response = createErrorResponse('TEST_ERROR', 'Test message', 400);
  
  assertEquals(response.status, 400);
  assertEquals(response.headers.get('Content-Type'), 'application/json');
  
  const body = await response.json();
  assertEquals(body.success, false);
  assertEquals(body.error, 'Test message');
  assertEquals(body.code, 'TEST_ERROR');
});

Deno.test("createErrorResponse: Deve funcionar com status 500", async () => {
  const response = createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Internal error', 500);
  
  assertEquals(response.status, 500);
  
  const body = await response.json();
  assertEquals(body.code, 'INTERNAL_ERROR');
});

// ============================================================================
// HMAC Signature Tests
// ============================================================================

Deno.test("generateHmacSignature: Deve gerar assinatura determinística", async () => {
  const secret = 'test-secret-key';
  const message = 'test-message';
  
  const sig1 = await generateHmacSignature(secret, message);
  const sig2 = await generateHmacSignature(secret, message);
  
  assertEquals(sig1, sig2);
});

Deno.test("generateHmacSignature: Deve gerar assinaturas diferentes para mensagens diferentes", async () => {
  const secret = 'test-secret-key';
  
  const sig1 = await generateHmacSignature(secret, 'message1');
  const sig2 = await generateHmacSignature(secret, 'message2');
  
  assertEquals(sig1 !== sig2, true);
});

Deno.test("generateHmacSignature: Deve gerar assinaturas diferentes para secrets diferentes", async () => {
  const message = 'same-message';
  
  const sig1 = await generateHmacSignature('secret1', message);
  const sig2 = await generateHmacSignature('secret2', message);
  
  assertEquals(sig1 !== sig2, true);
});

Deno.test("generateHmacSignature: Deve retornar string hexadecimal", async () => {
  const signature = await generateHmacSignature('secret', 'message');
  
  // SHA-256 produz 64 caracteres hex
  assertEquals(signature.length, 64);
  assertEquals(/^[0-9a-f]+$/.test(signature), true);
});

// ============================================================================
// Logger Tests
// ============================================================================

Deno.test("createLogger: Deve criar logger com métodos info, warn, error", () => {
  const logger = createLogger('test-function', '1');
  
  assertExists(logger.info);
  assertExists(logger.warn);
  assertExists(logger.error);
  
  // Não deve lançar erro
  logger.info('Test info message');
  logger.warn('Test warning message');
  logger.error('Test error message');
});
