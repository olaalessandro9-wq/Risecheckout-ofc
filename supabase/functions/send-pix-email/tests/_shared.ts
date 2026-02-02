/**
 * Send PIX Email Tests - Shared Utilities
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module send-pix-email/tests/_shared
 */

import type { MockOrder } from "../../_shared/testing/types.ts";
import { createMockOrder, createMockRequest, generatePrefixedId } from "../../_shared/testing/mod.ts";

export const FUNCTION_NAME = "send-pix-email";
export const FUNCTION_URL = "https://test.supabase.co/functions/v1/send-pix-email";

export interface SendPixEmailRequest { orderId: string; }

export interface PixOrderData extends MockOrder {
  pix_qr_code: string;
  pix_expiration: string | null;
  product: Array<{ name: string }>;
}

export function createPixEmailPayload(orderId?: string): SendPixEmailRequest {
  return { orderId: orderId || generatePrefixedId("order") };
}

export function createMockPixOrder(vendorId: string, productId: string, overrides: Partial<PixOrderData> = {}): PixOrderData {
  const baseOrder = createMockOrder(vendorId, productId);
  return {
    ...baseOrder,
    status: "pending",
    customer_email: "customer@test.com",
    customer_name: "Test Customer",
    pix_qr_code: "00020126580014br.gov.bcb.pix...",
    pix_expiration: new Date(Date.now() + 3600000).toISOString(),
    product: [{ name: "Test Product" }],
    ...overrides,
  };
}

export function createPixEmailRequest(payload: SendPixEmailRequest): Request {
  return createMockRequest({ method: "POST", url: FUNCTION_URL, headers: { "Origin": "https://risecheckout.com" }, body: payload });
}

export const mockEnv = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  RESEND_API_KEY: "re_test_12345",
};
