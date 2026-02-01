/**
 * Shared Test Utilities for trigger-webhooks
 * 
 * @module trigger-webhooks/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================
// CONSTANTS
// ============================================

export const FUNCTION_URL = "https://test.supabase.co/functions/v1/trigger-webhooks";
export const VALID_SECRET = "test-secret";

export const EVENT_TYPES = [
  "order.created",
  "order.paid",
  "order.refunded",
  "order.cancelled",
] as const;

export type EventType = typeof EVENT_TYPES[number];

// ============================================
// TYPES
// ============================================

export interface MockWebhook {
  id: string;
  vendor_id: string;
  name: string;
  url: string;
  active: boolean;
  webhook_products: { product_id: string }[];
}

export interface MockOrder {
  id: string;
  vendor_id: string;
  status: string;
  customer_email: string;
  customer_name: string;
  total_amount: number;
}

export interface MockOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface TriggerWebhooksRequest {
  order_id: string;
  event_type: EventType | string;
}

// ============================================
// MOCK FACTORIES
// ============================================

export function createMockSupabaseClient(): Record<string, unknown> {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: {}, error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
    }),
  };
}

export function createMockRequest(
  body: Partial<TriggerWebhooksRequest>,
  headers?: Record<string, string>
): Request {
  const requestHeaders = new Headers({
    "Content-Type": "application/json",
    "X-Internal-Secret": VALID_SECRET,
    ...headers,
  });

  return new Request(FUNCTION_URL, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(body),
  });
}

export function createMockRequestWithoutSecret(
  body: Partial<TriggerWebhooksRequest>
): Request {
  return new Request(FUNCTION_URL, {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(body),
  });
}

export function createDefaultOrder(): MockOrder {
  return {
    id: "order-123",
    vendor_id: "vendor-123",
    status: "pending",
    customer_email: "customer@example.com",
    customer_name: "John Doe",
    total_amount: 9900,
  };
}

export function createDefaultOrderItem(overrides?: Partial<MockOrderItem>): MockOrderItem {
  return {
    id: "item-123",
    order_id: "order-123",
    product_id: "product-123",
    product_name: "Test Product",
    quantity: 1,
    unit_price: 9900,
    ...overrides,
  };
}

export function createDefaultWebhook(overrides?: Partial<MockWebhook>): MockWebhook {
  return {
    id: "webhook-123",
    vendor_id: "vendor-123",
    name: "Test Webhook",
    url: "https://example.com/webhook",
    active: true,
    webhook_products: [],
    ...overrides,
  };
}

// ============================================
// TYPE GUARDS
// ============================================

export function isValidEventType(value: string): value is EventType {
  return EVENT_TYPES.includes(value as EventType);
}
