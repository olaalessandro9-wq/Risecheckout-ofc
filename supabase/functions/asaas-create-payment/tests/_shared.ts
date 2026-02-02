/**
 * Shared Test Infrastructure for asaas-create-payment
 * 
 * @module asaas-create-payment/tests/_shared
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { getTestConfig, skipIntegration, integrationTestOptions } from "../../_shared/testing/mod.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "asaas-create-payment";

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

export interface CustomerPayload {
  name?: string;
  email?: string;
  document?: string;
}

export interface PaymentPayload {
  orderId?: string;
  amountCents?: number;
  paymentMethod?: string;
  customer?: CustomerPayload;
  cardToken?: string;
}

export function createPayload(overrides: Partial<PaymentPayload> = {}): PaymentPayload {
  return {
    orderId: "order_test_123",
    amountCents: 10000,
    paymentMethod: "pix",
    customer: {
      name: "Test Customer",
      email: "test@example.com",
      document: "12345678900",
    },
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
