/**
 * Shared Types & Mock Data for order-lifecycle-worker Tests
 * 
 * @module order-lifecycle-worker/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export type OrderStatus = 'pending' | 'paid' | 'refunded' | 'cancelled' | 'chargeback' | 'expired';
export type EventType = 'payment.approved' | 'payment.refunded' | 'payment.cancelled' | 'payment.chargeback' | 'payment.expired';

export interface LifecycleEvent {
  id: string;
  order_id: string;
  event_type: EventType;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  processed: boolean;
  created_at: string;
}

export interface OrderRecord {
  id: string;
  vendor_id: string;
  status: OrderStatus;
  customer_email: string | null;
  product_id: string;
  amount_cents: number;
}

export interface WebhookAction {
  type: 'purchase_approved' | 'purchase_refunded' | 'purchase_cancelled' | 'purchase_chargeback';
  orderId: string;
  priority: 'high' | 'normal' | 'low';
}

export interface AccessAction {
  type: 'grant' | 'revoke';
  buyerEmail: string;
  productId: string;
  reason: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_EVENT: LifecycleEvent = {
  id: 'evt-123',
  order_id: 'order-456',
  event_type: 'payment.approved',
  old_status: 'pending',
  new_status: 'paid',
  processed: false,
  created_at: new Date().toISOString()
};

export const MOCK_ORDER: OrderRecord = {
  id: 'order-456',
  vendor_id: 'vendor-789',
  status: 'paid',
  customer_email: 'buyer@example.com',
  product_id: 'prod-123',
  amount_cents: 10000
};

export const VALID_EVENT_TYPES: EventType[] = [
  'payment.approved',
  'payment.refunded',
  'payment.cancelled',
  'payment.chargeback',
  'payment.expired'
];

export const VALID_STATUSES: OrderStatus[] = [
  'pending', 'paid', 'refunded', 'cancelled', 'chargeback', 'expired'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isValidEventType(eventType: unknown): eventType is EventType {
  return typeof eventType === 'string' && VALID_EVENT_TYPES.includes(eventType as EventType);
}

export function isValidOrderStatus(status: unknown): status is OrderStatus {
  return typeof status === 'string' && VALID_STATUSES.includes(status as OrderStatus);
}

export function mapEventToStatus(eventType: EventType): OrderStatus {
  switch (eventType) {
    case 'payment.approved': return 'paid';
    case 'payment.refunded': return 'refunded';
    case 'payment.cancelled': return 'cancelled';
    case 'payment.chargeback': return 'chargeback';
    case 'payment.expired': return 'expired';
    default: return 'pending';
  }
}

export function isStatusTransitionValid(from: OrderStatus | null, to: OrderStatus): boolean {
  if (from === null) return true;
  
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['paid', 'cancelled', 'expired'],
    paid: ['refunded', 'chargeback'],
    refunded: [],
    cancelled: [],
    chargeback: [],
    expired: ['paid']
  };
  
  return validTransitions[from]?.includes(to) ?? false;
}

export function determineWebhookAction(event: LifecycleEvent): WebhookAction | null {
  const typeMap: Record<EventType, WebhookAction['type'] | null> = {
    'payment.approved': 'purchase_approved',
    'payment.refunded': 'purchase_refunded',
    'payment.cancelled': 'purchase_cancelled',
    'payment.chargeback': 'purchase_chargeback',
    'payment.expired': null
  };
  
  const webhookType = typeMap[event.event_type];
  if (!webhookType) return null;
  
  const priorityMap: Record<WebhookAction['type'], WebhookAction['priority']> = {
    'purchase_approved': 'high',
    'purchase_refunded': 'normal',
    'purchase_cancelled': 'normal',
    'purchase_chargeback': 'high'
  };
  
  return {
    type: webhookType,
    orderId: event.order_id,
    priority: priorityMap[webhookType]
  };
}

export function determineAccessAction(event: LifecycleEvent, order: OrderRecord): AccessAction | null {
  if (!order.customer_email) return null;
  
  switch (event.event_type) {
    case 'payment.approved':
      return {
        type: 'grant',
        buyerEmail: order.customer_email,
        productId: order.product_id,
        reason: 'Payment approved'
      };
    case 'payment.refunded':
    case 'payment.chargeback':
      return {
        type: 'revoke',
        buyerEmail: order.customer_email,
        productId: order.product_id,
        reason: event.event_type === 'payment.refunded' ? 'Refund processed' : 'Chargeback received'
      };
    default:
      return null;
  }
}

export function shouldSendEmail(eventType: EventType): boolean {
  return ['payment.approved', 'payment.refunded'].includes(eventType);
}

export function calculateRetryDelay(attempt: number, baseDelay: number = 1000): number {
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, 300000);
}

export function shouldRetry(attempt: number, maxAttempts: number = 5): boolean {
  return attempt < maxAttempts;
}

export function buildEventLogEntry(
  event: LifecycleEvent, 
  success: boolean, 
  error?: string
): Record<string, unknown> {
  return {
    event_id: event.id,
    order_id: event.order_id,
    event_type: event.event_type,
    processed_at: new Date().toISOString(),
    success,
    error: error || null
  };
}
