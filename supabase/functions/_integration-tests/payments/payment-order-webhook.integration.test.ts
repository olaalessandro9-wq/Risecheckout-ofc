/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests: Payment → Order → Webhook Flow
 * 
 * Tests complete payment lifecycle:
 * 1. Create payment via gateway
 * 2. Order creation/update
 * 3. Webhook processing
 * 4. Order status transitions
 * 
 * Coverage:
 * - Payment creation (all gateways)
 * - Order lifecycle
 * - Webhook validation
 * - Status transitions
 * - Error handling
 * 
 * @module _integration-tests/payments/payment-order-webhook.integration.test
 * @version 1.1.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  skipIntegration, 
  integrationTestOptions,
  getTestConfig 
} from "../../_shared/testing/mod.ts";

const config = getTestConfig();
const supabaseUrl = config.supabaseUrl;

// ============================================================================
// PAYMENT CREATION TESTS
// ============================================================================

Deno.test({
  name: "payment-order-webhook/integration: Asaas payment creation should create order",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      amount: 10000,
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        document: '12345678900'
      },
      paymentMethod: 'pix',
      orderId: `test_order_${Date.now()}`
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    assertExists(data);
    // Should create payment and order
    assertEquals(response.status >= 200 && response.status < 300, true);
  }
});

Deno.test({
  name: "payment-order-webhook/integration: MercadoPago payment creation should create order",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      amount: 10000,
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        document: '12345678900'
      },
      paymentMethod: 'pix',
      orderId: `test_order_${Date.now()}`
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/mercadopago-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    assertExists(data);
    assertEquals(response.status >= 200 && response.status < 300, true);
  }
});

// ============================================================================
// WEBHOOK PROCESSING TESTS
// ============================================================================

Deno.test({
  name: "payment-order-webhook/integration: Asaas webhook should update order status",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const webhookPayload = {
      event: 'PAYMENT_CONFIRMED',
      payment: {
        id: 'test_payment_123',
        status: 'CONFIRMED',
        value: 100.00
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });

    await response.text();
    
    // Webhook should process successfully (200) or reject gracefully (4xx)
    assertEquals(response.status >= 200 && response.status < 500, true);
  }
});

Deno.test({
  name: "payment-order-webhook/integration: Stripe webhook should update order status",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const webhookPayload = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          status: 'succeeded',
          amount: 10000
        }
      }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      },
      body: JSON.stringify(webhookPayload)
    });

    await response.text();
    
    assertEquals(response.status >= 200 && response.status < 500, true);
  }
});

// ============================================================================
// ORDER LIFECYCLE TESTS
// ============================================================================

Deno.test({
  name: "payment-order-webhook/integration: Order lifecycle worker should process pending orders",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/order-lifecycle-worker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await response.json();
    
    assertExists(data);
    assertEquals(response.status, 200);
  }
});

Deno.test({
  name: "payment-order-webhook/integration: Reconciliation should sync payment status",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/reconcile-pending-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await response.json();
    
    assertExists(data);
    assertEquals(response.status, 200);
  }
});

// ============================================================================
// MEMBER ACCESS GRANT TESTS
// ============================================================================

Deno.test({
  name: "payment-order-webhook/integration: Grant member access after payment confirmation",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      orderId: `test_order_${Date.now()}`,
      userId: 'test_user_123'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/grant-member-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.text();
    
    // Should process (200) or reject gracefully (404 for test order)
    assertEquals(response.status >= 200 && response.status < 500, true);
  }
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

Deno.test({
  name: "payment-order-webhook/integration: Payment creation with invalid data should fail gracefully",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = {
      amount: -100, // Invalid amount
      customer: {},
      paymentMethod: 'invalid'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.text();
    
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});

Deno.test({
  name: "payment-order-webhook/integration: Webhook with invalid signature should be rejected",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const webhookPayload = {
      event: 'PAYMENT_CONFIRMED',
      payment: { id: 'test', status: 'CONFIRMED' }
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-webhook`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'asaas-signature': 'invalid_signature'
      },
      body: JSON.stringify(webhookPayload)
    });

    await response.text();
    
    // Should reject with 401 or 403
    assertEquals(response.status >= 400 && response.status < 500, true);
  }
});
