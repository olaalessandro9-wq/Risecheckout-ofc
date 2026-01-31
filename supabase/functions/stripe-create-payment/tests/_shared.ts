/**
 * Shared Types & Mock Data for stripe-create-payment Tests
 * 
 * @module stripe-create-payment/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePaymentRequest {
  order_id: string;
  payment_method: "credit_card" | "pix";
  payment_method_id?: string;
  return_url?: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  payment_intent_id?: string;
  client_secret?: string;
  status?: string;
  qr_code?: string;
  qr_code_base64?: string;
  expires_at?: string;
  error?: string;
}

export interface OrderData {
  id: string;
  vendor_id: string;
  customer_email: string;
  total_amount: number;
  status: string;
  gateway: string | null;
}

export interface PaymentIntentParams {
  amount: number;
  currency: string;
  payment_method_types: string[];
  metadata: Record<string, string>;
  application_fee_amount?: number;
  transfer_data?: {
    destination: string;
  };
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_ORDER_ID = "order-uuid-123";
export const MOCK_VENDOR_ID = "vendor-uuid-456";
export const MOCK_PAYMENT_INTENT_ID = "pi_test_123456789";
export const MOCK_CLIENT_SECRET = "pi_test_123456789_secret_abc";

export const MOCK_ORDER: OrderData = {
  id: MOCK_ORDER_ID,
  vendor_id: MOCK_VENDOR_ID,
  customer_email: "customer@example.com",
  total_amount: 99.99,
  status: "pending",
  gateway: null,
};

export const MOCK_CARD_REQUEST: CreatePaymentRequest = {
  order_id: MOCK_ORDER_ID,
  payment_method: "credit_card",
  payment_method_id: "pm_test_card",
  return_url: "https://checkout.example.com/success",
};

export const MOCK_PIX_REQUEST: CreatePaymentRequest = {
  order_id: MOCK_ORDER_ID,
  payment_method: "pix",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function validatePaymentRequest(request: CreatePaymentRequest): string | null {
  if (!request.order_id) {
    return "order_id is required";
  }
  if (!request.payment_method) {
    return "payment_method is required";
  }
  if (!["credit_card", "pix"].includes(request.payment_method)) {
    return "Invalid payment_method";
  }
  if (request.payment_method === "credit_card" && !request.payment_method_id) {
    return "payment_method_id is required for credit_card";
  }
  return null;
}

export function mapPaymentStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "succeeded":
      return "paid";
    case "requires_payment_method":
    case "requires_confirmation":
    case "requires_action":
      return "pending";
    case "canceled":
      return "cancelled";
    case "requires_capture":
      return "authorized";
    default:
      return "pending";
  }
}

export function buildPaymentIntentMetadata(order: OrderData): Record<string, string> {
  return {
    order_id: order.id,
    vendor_id: order.vendor_id,
    customer_email: order.customer_email,
  };
}
