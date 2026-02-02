/**
 * Send Confirmation Email Tests - Shared Utilities
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Type-safe factories and mocks for send-confirmation-email tests.
 * 
 * @module send-confirmation-email/tests/_shared
 * @version 1.0.0
 */

import type { MockOrder, MockProduct } from "../../_shared/testing/types.ts";
import { 
  createMockOrder,
  createMockProduct,
  createMockRequest,
  generatePrefixedId,
} from "../../_shared/testing/mod.ts";

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "send-confirmation-email";
export const FUNCTION_URL = "https://test.supabase.co/functions/v1/send-confirmation-email";

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface SendConfirmationEmailRequest {
  orderId: string;
}

export interface SendConfirmationEmailResponse {
  success: boolean;
  error?: string;
}

// ============================================================================
// ORDER WITH PRODUCT TYPE
// ============================================================================

export interface OrderWithProduct extends MockOrder {
  product: Array<{ name: string; image_url?: string }>;
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

/**
 * Creates a valid send confirmation email request
 */
export function createConfirmationEmailPayload(
  orderId?: string
): SendConfirmationEmailRequest {
  return {
    orderId: orderId || generatePrefixedId("order"),
  };
}

/**
 * Creates a mock order with product for email tests
 */
export function createMockOrderWithProduct(
  vendorId: string,
  productId: string,
  overrides: Partial<OrderWithProduct> = {}
): OrderWithProduct {
  const baseOrder = createMockOrder(vendorId, productId);
  return {
    ...baseOrder,
    status: "paid",
    customer_email: "customer@test.com",
    customer_name: "Test Customer",
    product: [{ name: "Test Product", image_url: "https://example.com/image.png" }],
    ...overrides,
  };
}

/**
 * Creates a mock order without customer email
 */
export function createMockOrderWithoutEmail(
  vendorId: string,
  productId: string
): OrderWithProduct {
  const order = createMockOrderWithProduct(vendorId, productId);
  order.customer_email = "";
  return order;
}

/**
 * Creates a mock order without product data
 */
export function createMockOrderWithoutProduct(
  vendorId: string,
  productId: string
): OrderWithProduct {
  return createMockOrderWithProduct(vendorId, productId, {
    product: [],
  });
}

// ============================================================================
// RESEND API MOCK TYPES
// ============================================================================

export interface ResendSuccessResponse {
  id: string;
  from: string;
  to: string[];
  created_at: string;
}

export interface ResendErrorResponse {
  statusCode: number;
  message: string;
  name: string;
}

// ============================================================================
// MOCK RESPONSES
// ============================================================================

/**
 * Creates a successful Resend API response
 */
export function createResendSuccessResponse(): ResendSuccessResponse {
  return {
    id: generatePrefixedId("resend"),
    from: "Rise Checkout <noreply@risecheckout.com>",
    to: ["customer@test.com"],
    created_at: new Date().toISOString(),
  };
}

/**
 * Creates a failed Resend API response
 */
export function createResendErrorResponse(
  message: string = "Invalid API key"
): ResendErrorResponse {
  return {
    statusCode: 401,
    message,
    name: "validation_error",
  };
}

// ============================================================================
// HTTP REQUEST FACTORIES
// ============================================================================

/**
 * Creates a mock request for send-confirmation-email
 */
export function createConfirmationEmailRequest(
  payload: SendConfirmationEmailRequest
): Request {
  return createMockRequest({
    method: "POST",
    url: FUNCTION_URL,
    headers: {
      "Origin": "https://risecheckout.com",
    },
    body: payload,
  });
}

/**
 * Creates a request with invalid origin
 */
export function createInvalidOriginRequest(
  payload: SendConfirmationEmailRequest
): Request {
  return createMockRequest({
    method: "POST",
    url: FUNCTION_URL,
    headers: {
      "Origin": "https://malicious-site.com",
    },
    body: payload,
  });
}

// ============================================================================
// EMAIL HTML HELPERS
// ============================================================================

/**
 * Expected HTML structure elements
 */
export const EMAIL_HTML_ELEMENTS = {
  title: "Confirmação de Compra",
  successEmoji: "🎉",
  productSection: "Detalhes do Pedido",
  pricePrefix: "R$",
} as const;

/**
 * Validates email HTML contains required elements
 */
export function validateEmailHtml(html: string): {
  hasTitle: boolean;
  hasEmoji: boolean;
  hasProductSection: boolean;
  hasPricePrefix: boolean;
} {
  return {
    hasTitle: html.includes(EMAIL_HTML_ELEMENTS.title),
    hasEmoji: html.includes(EMAIL_HTML_ELEMENTS.successEmoji),
    hasProductSection: html.includes(EMAIL_HTML_ELEMENTS.productSection),
    hasPricePrefix: html.includes(EMAIL_HTML_ELEMENTS.pricePrefix),
  };
}

// ============================================================================
// ENVIRONMENT MOCK
// ============================================================================

export const mockEnv = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  RESEND_API_KEY: "re_test_12345",
};

export function setupMockEnv(): void {
  for (const [key, value] of Object.entries(mockEnv)) {
    Deno.env.set(key, value);
  }
}

export function clearMockEnv(): void {
  for (const key of Object.keys(mockEnv)) {
    Deno.env.delete(key);
  }
}
