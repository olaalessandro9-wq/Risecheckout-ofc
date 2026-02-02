/**
 * Shared Test Infrastructure for mercadopago-create-payment
 * 
 * @module mercadopago-create-payment/tests/_shared
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { getTestConfig, skipIntegration, integrationTestOptions } from "../../_shared/testing/mod.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "mercadopago-create-payment";

const config = getTestConfig();

export function getFunctionUrl(): string {
  return config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
    : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;
}

// ============================================================================
// RE-EXPORT CENTRALIZED TEST HELPERS
// ============================================================================

export { skipIntegration, integrationTestOptions };

// ============================================================================
// VALID PAYMENT METHODS
// ============================================================================

export const VALID_PAYMENT_METHODS = ["pix", "credit_card"] as const;
export type ValidPaymentMethod = typeof VALID_PAYMENT_METHODS[number];

export function isValidPaymentMethod(method: string): method is ValidPaymentMethod {
  return (VALID_PAYMENT_METHODS as readonly string[]).includes(method);
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export interface PaymentPayload {
  orderId?: string;
  payerEmail?: string;
  paymentMethod?: string;
  token?: string;
}

export function createPayload(overrides: Partial<PaymentPayload> = {}): PaymentPayload {
  return {
    orderId: "order_test_123",
    payerEmail: "test@example.com",
    paymentMethod: "pix",
    ...overrides,
  };
}

export function createMockRequest(payload: PaymentPayload): Request {
  return new Request(getFunctionUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
